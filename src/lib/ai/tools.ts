import type OpenAI from "openai";

export const appraisalTools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "extract_item_details",
      description:
        "Extract structured details about the jewelry item from the conversation so far. Call this after your initial photo analysis to record what you've identified. You can call this multiple times as you learn more.",
      parameters: {
        type: "object",
        properties: {
          metalType: {
            type: "string",
            enum: ["gold", "silver", "platinum", "palladium", "unknown"],
            description: "The identified metal type",
          },
          karatPurity: {
            type: "number",
            description:
              "Karat value for gold (9, 10, 14, 18, 22, 24) or purity number for silver (800, 900, 925, 999) or platinum (850, 900, 950, 999)",
          },
          purityConfidence: {
            type: "string",
            enum: [
              "confirmed_by_stamp",
              "estimated_from_appearance",
              "user_reported",
              "unknown",
            ],
            description: "How confident is the purity assessment",
          },
          estimatedWeightGrams: {
            type: "number",
            description: "Estimated weight in grams",
          },
          weightSource: {
            type: "string",
            enum: [
              "user_provided_scale",
              "user_reported_estimate",
              "ai_estimated_from_photo",
            ],
            description: "Source of the weight figure",
          },
          itemCategory: {
            type: "string",
            enum: [
              "ring",
              "necklace",
              "chain",
              "bracelet",
              "pendant",
              "earrings",
              "brooch",
              "coin",
              "bar",
              "watch",
              "other",
            ],
            description: "Type of jewelry item",
          },
          itemDescription: {
            type: "string",
            description: "Brief description of the item",
          },
          stampingsObserved: {
            type: "string",
            description:
              "Any stamps, hallmarks, or markings visible or reported",
          },
          concerns: {
            type: "array",
            items: { type: "string" },
            description:
              "Any concerns: possible plating, damage, unclear stamps, etc.",
          },
        },
        required: [
          "metalType",
          "purityConfidence",
          "weightSource",
          "itemCategory",
          "itemDescription",
        ],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "calculate_appraisal",
      description:
        "Calculate the final appraisal value based on metal type, purity, and weight. You MUST call this after the user has answered 2 questions. Use your best estimated values with confidence='low' when exact figures are unknown. A range estimate is always better than no answer.",
      parameters: {
        type: "object",
        properties: {
          metalType: {
            type: "string",
            enum: ["gold", "silver", "platinum", "palladium"],
          },
          purityFraction: {
            type: "number",
            description:
              "Purity as a decimal. E.g., 14K gold = 0.583, sterling silver = 0.925",
          },
          weightGrams: {
            type: "number",
            description: "Total item weight in grams",
          },
          confidenceLevel: {
            type: "string",
            enum: ["high", "medium", "low"],
            description: "Overall confidence in this appraisal",
          },
          notes: {
            type: "string",
            description: "Any caveats or notes about the appraisal",
          },
        },
        required: [
          "metalType",
          "purityFraction",
          "weightGrams",
          "confidenceLevel",
        ],
      },
    },
  },
];
