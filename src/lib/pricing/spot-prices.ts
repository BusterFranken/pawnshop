import type { SpotPrices, MetalKey } from "@/types/pricing";
import { TROY_OZ_TO_GRAMS } from "./constants";
import { db } from "@/lib/db";

let cachedPrices: SpotPrices | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Fallback prices (updated periodically as a safety net)
const FALLBACK_PRICES: SpotPrices = {
  gold: { perOz: 2350, perGram: 2350 / TROY_OZ_TO_GRAMS },
  silver: { perOz: 28, perGram: 28 / TROY_OZ_TO_GRAMS },
  platinum: { perOz: 980, perGram: 980 / TROY_OZ_TO_GRAMS },
  updatedAt: new Date(),
};

async function fetchFromGoldApi(): Promise<SpotPrices | null> {
  const apiKey = process.env.GOLDAPI_KEY;
  if (!apiKey) return null;

  try {
    const metals: MetalKey[] = ["gold", "silver", "platinum"];
    const symbols = { gold: "XAU", silver: "XAG", platinum: "XPT" };

    const results: Partial<SpotPrices> = {};

    for (const metal of metals) {
      const res = await fetch(
        `https://www.goldapi.io/api/${symbols[metal]}/USD`,
        {
          headers: { "x-access-token": apiKey },
          next: { revalidate: 300 },
        }
      );
      if (!res.ok) continue;
      const data = await res.json();
      const perOz = data.price;
      results[metal] = {
        perOz,
        perGram: perOz / TROY_OZ_TO_GRAMS,
      };
    }

    if (results.gold && results.silver && results.platinum) {
      return {
        ...results,
        updatedAt: new Date(),
      } as SpotPrices;
    }
    return null;
  } catch {
    return null;
  }
}

async function persistPrices(prices: SpotPrices): Promise<void> {
  const metals: MetalKey[] = ["gold", "silver", "platinum"];
  const metalEnumMap = { gold: "GOLD", silver: "SILVER", platinum: "PLATINUM" } as const;

  try {
    for (const metal of metals) {
      await db.spotPriceCache.create({
        data: {
          metal: metalEnumMap[metal],
          pricePerGram: prices[metal].perGram,
          pricePerOz: prices[metal].perOz,
          source: "goldapi",
          fetchedAt: prices.updatedAt,
        },
      });
    }
  } catch {
    // DB might not be available yet — don't crash
  }
}

async function loadFromDb(): Promise<SpotPrices | null> {
  try {
    const metals = ["GOLD", "SILVER", "PLATINUM"] as const;
    const results: Record<string, { perGram: number; perOz: number }> = {};
    let latestDate: Date | null = null;

    for (const metal of metals) {
      const cached = await db.spotPriceCache.findFirst({
        where: { metal },
        orderBy: { fetchedAt: "desc" },
      });
      if (!cached) return null;
      results[metal.toLowerCase()] = {
        perGram: cached.pricePerGram,
        perOz: cached.pricePerOz,
      };
      if (!latestDate || cached.fetchedAt > latestDate) {
        latestDate = cached.fetchedAt;
      }
    }

    if (results.gold && results.silver && results.platinum && latestDate) {
      // Don't use DB cache older than 1 hour
      if (Date.now() - latestDate.getTime() > 60 * 60 * 1000) return null;

      return {
        gold: results.gold,
        silver: results.silver,
        platinum: results.platinum,
        updatedAt: latestDate,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function getSpotPrices(): Promise<SpotPrices> {
  // 1. Check in-memory cache
  if (cachedPrices && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cachedPrices;
  }

  // 2. Try live API
  const livePrices = await fetchFromGoldApi();
  if (livePrices) {
    cachedPrices = livePrices;
    cacheTimestamp = Date.now();
    persistPrices(livePrices); // fire and forget
    return livePrices;
  }

  // 3. Try DB cache
  const dbPrices = await loadFromDb();
  if (dbPrices) {
    cachedPrices = dbPrices;
    cacheTimestamp = Date.now();
    return dbPrices;
  }

  // 4. Fallback to hardcoded prices
  cachedPrices = FALLBACK_PRICES;
  cacheTimestamp = Date.now();
  return FALLBACK_PRICES;
}
