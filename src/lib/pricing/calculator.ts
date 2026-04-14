import type { SpotPrices, MetalKey } from "@/types/pricing";
import type { AppraisalResult } from "@/types/appraisal";
import { PAYOUT_FACTORS } from "./constants";

function round(n: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(n * factor) / factor;
}

function buildDisclaimer(confidence: string): string {
  switch (confidence) {
    case "high":
      return "This estimate is based on confirmed stamps and user-provided weight. Final value depends on in-person verification with professional testing equipment.";
    case "medium":
      return "This estimate is based on visual assessment and reported details. We recommend an in-person evaluation with acid testing and a precision scale for a definitive value.";
    case "low":
      return "This is a rough estimate based on limited information. The actual value could vary significantly. Please visit a pawn shop for a professional assessment with XRF analysis and precision weighing.";
    default:
      return "This is an estimate. Visit a pawn shop for a professional assessment.";
  }
}

export function calculateAppraisal(
  input: {
    metalType: string;
    purityFraction: number;
    weightGrams: number;
    confidenceLevel: "high" | "medium" | "low";
    notes?: string;
  },
  spotPrices: SpotPrices
): AppraisalResult {
  const metalKey = input.metalType.toLowerCase() as MetalKey;
  const spotPricePerGram = spotPrices[metalKey]?.perGram || 0;
  const pureMetalWeight = input.weightGrams * input.purityFraction;
  const meltValue = pureMetalWeight * spotPricePerGram;

  const factors = PAYOUT_FACTORS[input.confidenceLevel];

  return {
    pureMetalWeightGrams: round(pureMetalWeight, 2),
    spotPricePerGram: round(spotPricePerGram, 2),
    meltValue: round(meltValue, 2),
    estimatedPayoutLow: round(meltValue * factors.low, 2),
    estimatedPayoutHigh: round(meltValue * factors.high, 2),
    confidenceLevel: input.confidenceLevel,
    disclaimer: buildDisclaimer(input.confidenceLevel),
    calculatedAt: new Date(),
  };
}
