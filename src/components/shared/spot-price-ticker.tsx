"use client";

import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import type { SpotPrices } from "@/types/pricing";

export function SpotPriceTicker() {
  const [prices, setPrices] = useState<SpotPrices | null>(null);

  useEffect(() => {
    async function fetchPrices() {
      try {
        const res = await fetch("/api/spot-prices");
        if (res.ok) {
          const data = await res.json();
          setPrices(data);
        }
      } catch {
        // silently fail — ticker is non-critical
      }
    }
    fetchPrices();
    const interval = setInterval(fetchPrices, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (!prices) return null;

  return (
    <div className="bg-foreground text-background py-1.5 text-xs overflow-hidden">
      <div className="container mx-auto px-4 flex items-center gap-6 justify-center">
        <TrendingUp className="h-3.5 w-3.5 shrink-0" />
        <span>
          <span className="font-medium text-amber-400">Gold</span>{" "}
          ${prices.gold.perOz.toFixed(2)}/oz
        </span>
        <span className="text-muted-foreground/50">|</span>
        <span>
          <span className="font-medium text-gray-400">Silver</span>{" "}
          ${prices.silver.perOz.toFixed(2)}/oz
        </span>
        <span className="text-muted-foreground/50">|</span>
        <span>
          <span className="font-medium text-gray-300">Platinum</span>{" "}
          ${prices.platinum.perOz.toFixed(2)}/oz
        </span>
      </div>
    </div>
  );
}
