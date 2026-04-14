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
    weightGramsLow?: number;
    weightGramsBest: number;
    weightGramsHigh?: number;
    confidenceLevel: "high" | "medium" | "low";
    notes?: string;
  },
  spotPrices: SpotPrices
): AppraisalResult {
  const metalKey = input.metalType.toLowerCase() as MetalKey;
  const spotPricePerGram = spotPrices[metalKey]?.perGram || 0;
  const factors = PAYOUT_FACTORS[input.confidenceLevel];

  const wLow = input.weightGramsLow ?? input.weightGramsBest;
  const wBest = input.weightGramsBest;
  const wHigh = input.weightGramsHigh ?? input.weightGramsBest;

  const pureWeightBest = wBest * input.purityFraction;
  const meltValueBest = pureWeightBest * spotPricePerGram;

  // Low payout uses low weight × low factor, high uses high weight × high factor
  const meltValueLow = wLow * input.purityFraction * spotPricePerGram;
  const meltValueHigh = wHigh * input.purityFraction * spotPricePerGram;

  return {
    pureMetalWeightGrams: round(pureWeightBest, 2),
    spotPricePerGram: round(spotPricePerGram, 2),
    meltValue: round(meltValueBest, 2),
    estimatedPayoutLow: round(meltValueLow * factors.low, 2),
    estimatedPayoutHigh: round(meltValueHigh * factors.high, 2),
    confidenceLevel: input.confidenceLevel,
    disclaimer: buildDisclaimer(input.confidenceLevel),
    calculatedAt: new Date(),
  };
}
