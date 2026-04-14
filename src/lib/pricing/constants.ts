export const GOLD_PURITY: Record<number, number> = {
  24: 0.999,
  22: 0.917,
  18: 0.75,
  14: 0.583,
  10: 0.417,
  9: 0.375,
};

export const SILVER_PURITY: Record<number, number> = {
  999: 0.999,
  980: 0.98,
  925: 0.925,
  900: 0.9,
  800: 0.8,
};

export const PLATINUM_PURITY: Record<number, number> = {
  999: 0.999,
  950: 0.95,
  900: 0.9,
  850: 0.85,
};

export const TROY_OZ_TO_GRAMS = 31.1035;

export const PAYOUT_FACTORS = {
  high: { low: 0.55, high: 0.65 },
  medium: { low: 0.5, high: 0.65 },
  low: { low: 0.45, high: 0.65 },
} as const;
