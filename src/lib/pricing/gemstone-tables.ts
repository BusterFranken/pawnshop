/**
 * Conservative gemstone valuation tables.
 * Based on lab-grown diamond prices as baseline.
 * Natural diamonds may be worth more but prices are volatile.
 * Colored stones use very conservative estimates since photo ID is unreliable.
 */

// Lab-grown diamond price ranges by carat size (USD)
// These are conservative retail estimates — resale/pawn is typically 20-40% of retail
const LAB_DIAMOND_RETAIL: Record<string, { low: number; high: number }> = {
  "tiny": { low: 30, high: 150 },       // under 0.25ct
  "small": { low: 150, high: 500 },      // 0.25-0.5ct
  "medium": { low: 400, high: 1200 },    // 0.5-1.0ct
  "large": { low: 1000, high: 3000 },    // 1.0-2.0ct
  "very_large": { low: 2500, high: 8000 }, // 2.0ct+
};

// Colored stones are extremely hard to identify from photos.
// Could be natural, synthetic, glass, or simulant.
// Use very conservative flat rates.
const COLORED_STONE_RETAIL: Record<string, { low: number; high: number }> = {
  "tiny": { low: 5, high: 50 },
  "small": { low: 20, high: 200 },
  "medium": { low: 50, high: 500 },
  "large": { low: 100, high: 1500 },
  "very_large": { low: 200, high: 3000 },
};

// Pawn/resale factor — what fraction of retail a pawn shop would pay
const RESALE_FACTOR = { low: 0.15, high: 0.35 };

function getSizeCategory(carats: number): string {
  if (carats < 0.25) return "tiny";
  if (carats < 0.5) return "small";
  if (carats < 1.0) return "medium";
  if (carats < 2.0) return "large";
  return "very_large";
}

export interface GemstoneEstimate {
  type: string;
  description: string;
  estimatedCarats: number;
  count: number;
  resaleLow: number;
  resaleHigh: number;
  disclaimer: string;
}

export function estimateGemstoneValue(gemstones: {
  type: string;
  estimatedCaratSize: number;
  count: number;
  color?: string;
  cut?: string;
  confidence: string;
  notes?: string;
}[]): GemstoneEstimate[] {
  return gemstones.map((gem) => {
    const size = getSizeCategory(gem.estimatedCaratSize);
    const isDiamond = gem.type === "diamond";
    const table = isDiamond ? LAB_DIAMOND_RETAIL : COLORED_STONE_RETAIL;
    const retail = table[size];

    const totalRetailLow = retail.low * gem.count;
    const totalRetailHigh = retail.high * gem.count;
    const resaleLow = Math.round(totalRetailLow * RESALE_FACTOR.low);
    const resaleHigh = Math.round(totalRetailHigh * RESALE_FACTOR.high);

    const typeLabel = isDiamond ? "diamond" : "colored stone";
    const confidenceNote =
      gem.confidence === "likely"
        ? ""
        : gem.confidence === "possible"
          ? " (identification uncertain)"
          : " (cannot confirm from photo)";

    const disclaimer = isDiamond
      ? "Based on lab-grown diamond pricing. Natural diamonds may differ. Professional evaluation recommended."
      : "Colored stone identification from photos is unreliable. Could be natural, synthetic, or simulant. Professional gemological evaluation required.";

    return {
      type: gem.type,
      description: `${gem.count}x ~${gem.estimatedCaratSize}ct ${typeLabel}${confidenceNote}`,
      estimatedCarats: gem.estimatedCaratSize,
      count: gem.count,
      resaleLow,
      resaleHigh,
      disclaimer,
    };
  });
}
