export interface SpotPrices {
  gold: { perGram: number; perOz: number };
  silver: { perGram: number; perOz: number };
  platinum: { perGram: number; perOz: number };
  updatedAt: Date;
}

export type MetalKey = "gold" | "silver" | "platinum";
