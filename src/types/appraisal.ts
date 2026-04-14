import type { Appraisal, AppraisalImage, AppraisalMessage } from "@prisma/client";

export type AppraisalWithDetails = Appraisal & {
  images: AppraisalImage[];
  messages: AppraisalMessage[];
};

export interface AIExtraction {
  metalType: string;
  karatPurity?: number;
  purityConfidence: "confirmed_by_stamp" | "estimated_from_appearance" | "user_reported" | "unknown";
  estimatedWeightGrams?: number;
  weightSource: "user_provided_scale" | "user_reported_estimate" | "ai_estimated_from_photo";
  itemCategory: string;
  itemDescription: string;
  stampingsObserved?: string;
  concerns?: string[];
}

export interface AppraisalCalculation {
  metalType: string;
  purityFraction: number;
  weightGrams: number;
  confidenceLevel: "high" | "medium" | "low";
  notes?: string;
}

export interface AppraisalResult {
  pureMetalWeightGrams: number;
  spotPricePerGram: number;
  meltValue: number;
  estimatedPayoutLow: number;
  estimatedPayoutHigh: number;
  confidenceLevel: string;
  disclaimer: string;
  calculatedAt: Date;
}
