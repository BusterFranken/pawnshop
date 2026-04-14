import { openai } from "./client";
import { buildSystemPrompt } from "./prompts";
import { appraisalTools } from "./tools";
import { calculateAppraisal } from "@/lib/pricing/calculator";
import { getSpotPrices } from "@/lib/pricing/spot-prices";
import { estimateGemstoneValue } from "@/lib/pricing/gemstone-tables";
import { verifyWithClaude } from "./claude-verification";
import { notifyNearbyShops } from "@/lib/notifications";
import { db } from "@/lib/db";
import type { AppraisalMessage } from "@prisma/client";
import type OpenAI from "openai";

// Store pending Claude verification per appraisal
const pendingVerifications = new Map<
  string,
  ReturnType<typeof verifyWithClaude>
>();

interface ChatRequest {
  appraisalId: string;
  messages: AppraisalMessage[];
  imageUrls?: string[];
  newImageUrls?: string[];
}

function buildOpenAIMessages(
  systemPrompt: string,
  messages: AppraisalMessage[],
  imageUrls?: string[],
  newImageUrls?: string[]
): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  const openaiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
  ];

  const lastUserIndex = messages.reduce(
    (last, msg, i) => (msg.role === "user" ? i : last),
    -1
  );

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];

    if (msg.role === "user") {
      const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [];

      // Attach original images to the first user message
      if (i === 0 && imageUrls?.length) {
        for (const url of imageUrls) {
          content.push({
            type: "image_url",
            image_url: { url, detail: "high" },
          });
        }
      }

      // Attach new images to the last user message
      if (i === lastUserIndex && newImageUrls?.length) {
        for (const url of newImageUrls) {
          content.push({
            type: "image_url",
            image_url: { url, detail: "high" },
          });
        }
      }

      content.push({ type: "text", text: msg.content });
      openaiMessages.push({ role: "user", content });
    } else if (msg.role === "assistant") {
      openaiMessages.push({ role: "assistant", content: msg.content });
    }
  }

  return openaiMessages;
}

export async function runAppraisalAgent(request: ChatRequest) {
  const spotPrices = await getSpotPrices();
  const systemPrompt = buildSystemPrompt(spotPrices);

  const messages = buildOpenAIMessages(
    systemPrompt,
    request.messages,
    request.imageUrls,
    request.newImageUrls
  );

  // Count user turns for convergence enforcement
  const userTurnCount = request.messages.filter(
    (m) => m.role === "user"
  ).length;

  // Inject convergence system message if user has answered enough questions
  if (userTurnCount >= 3) {
    messages.push({
      role: "system",
      content:
        "IMPORTANT: The user has answered enough questions. You MUST call calculate_appraisal NOW on this turn. Use default weight/purity estimates from your instructions for any unknown values. Do NOT ask another question.",
    });
  }

  const response = await openai.chat.completions.create({
    model: "gpt-5.4-2026-03-05",
    max_completion_tokens: 1024,
    messages,
    tools: appraisalTools,
  });

  return {
    response,
    spotPrices,
    appraisalId: request.appraisalId,
    messages,
    userTurnCount,
  };
}

export async function handleToolCall(
  toolName: string,
  toolInput: Record<string, unknown>,
  appraisalId: string,
  spotPrices: Awaited<ReturnType<typeof getSpotPrices>>
): Promise<string> {
  if (toolName === "extract_item_details") {
    const metalTypeMap: Record<string, string> = {
      gold: "GOLD",
      silver: "SILVER",
      platinum: "PLATINUM",
      palladium: "PALLADIUM",
      unknown: "UNKNOWN",
    };

    await db.appraisal.update({
      where: { id: appraisalId },
      data: {
        metalType: metalTypeMap[
          toolInput.metalType as string
        ] as "GOLD" | "SILVER" | "PLATINUM" | "PALLADIUM" | "UNKNOWN",
        karatPurity: toolInput.karatPurity as number | undefined,
        estimatedWeight: toolInput.estimatedWeightGrams as number | undefined,
        weightSource: toolInput.weightSource as string | undefined,
        itemCategory: toolInput.itemCategory as string | undefined,
        description: toolInput.itemDescription as string | undefined,
        status: "CONVERSING",
      },
    });

    // Build dynamic guidance based on what's still missing
    const missing: string[] = [];
    if (!toolInput.karatPurity) missing.push("purity/karat");
    if (!toolInput.estimatedWeightGrams) missing.push("weight");

    let guidance: string;
    if (missing.length === 0) {
      guidance =
        "All key details recorded. You have enough information — call calculate_appraisal now.";
    } else if (missing.length === 1) {
      guidance = `Recorded. Missing: ${missing[0]}. Ask ONE targeted question about this. If the user cannot provide it, use the default estimate from your instructions and call calculate_appraisal.`;
    } else {
      guidance = `Recorded. Missing: ${missing.join(" and ")}. Ask 1-2 targeted questions. If the user cannot provide these, use default estimates and call calculate_appraisal.`;
    }

    // Fire Claude second-opinion verification in parallel (non-blocking)
    const appraisal = await db.appraisal.findUnique({
      where: { id: appraisalId },
      include: { images: { orderBy: { order: "asc" }, take: 3 } },
    });
    if (appraisal?.images.length) {
      const verificationPromise = verifyWithClaude({
        imageUrls: appraisal.images.map((img) => img.url),
        gptExtraction: {
          metalType: toolInput.metalType as string,
          karatPurity: toolInput.karatPurity as number | undefined,
          purityConfidence: toolInput.purityConfidence as string | undefined,
          estimatedWeightGrams: toolInput.estimatedWeightGrams as number | undefined,
          itemCategory: toolInput.itemCategory as string | undefined,
        },
      });
      pendingVerifications.set(appraisalId, verificationPromise);
    }

    return JSON.stringify({
      success: true,
      recorded: {
        metalType: toolInput.metalType,
        purity: toolInput.karatPurity || "unknown — use default",
        weight: toolInput.estimatedWeightGrams || "unknown — use default",
        category: toolInput.itemCategory,
      },
      guidance,
    });
  }

  if (toolName === "calculate_appraisal") {
    // Handle both new (weightGramsBest) and old (weightGrams) parameter names
    const rawWeight =
      (toolInput.weightGramsBest as number | undefined) ??
      (toolInput.weightGrams as number | undefined);
    const wBest = rawWeight && !isNaN(rawWeight) ? rawWeight : 5; // fallback to 5g if missing
    const wLow = (toolInput.weightGramsLow as number | undefined) ?? wBest * 0.6;
    const wHigh = (toolInput.weightGramsHigh as number | undefined) ?? wBest * 1.4;

    // Check Claude verification result if available
    let confidenceLevel = (toolInput.confidenceLevel as "high" | "medium" | "low") || "low";
    let verificationNote = "";
    const verificationPromise = pendingVerifications.get(appraisalId);
    if (verificationPromise) {
      try {
        const verification = await verificationPromise;
        pendingVerifications.delete(appraisalId);
        if (verification) {
          if (verification.confidenceAdjustment === "boost" && confidenceLevel !== "high") {
            // Both models agree — bump confidence up one level
            confidenceLevel = confidenceLevel === "low" ? "medium" : "high";
            verificationNote = "Secondary AI analysis agrees with assessment.";
          } else if (verification.confidenceAdjustment === "reduce") {
            // Models disagree — reduce confidence
            confidenceLevel = confidenceLevel === "high" ? "medium" : "low";
            verificationNote = `Secondary AI analysis disagrees: ${verification.disagreements.join("; ")}. Widening estimate range.`;
          }
        }
      } catch {
        // Verification failed — proceed without it
      }
    }

    const result = calculateAppraisal(
      {
        metalType: toolInput.metalType as string,
        purityFraction: toolInput.purityFraction as number,
        weightGramsLow: wLow,
        weightGramsBest: wBest,
        weightGramsHigh: wHigh,
        confidenceLevel,
        notes: toolInput.notes as string | undefined,
      },
      spotPrices
    );

    await db.appraisal.update({
      where: { id: appraisalId },
      data: {
        estimatedWeight: wBest,
        estimatedWeightLow: wLow,
        estimatedWeightHigh: wHigh,
        spotPricePerGram: result.spotPricePerGram,
        pureMetalWeight: result.pureMetalWeightGrams,
        meltValue: result.meltValue,
        estimatedPayoutLow: result.estimatedPayoutLow,
        estimatedPayoutHigh: result.estimatedPayoutHigh,
        aiConfidence:
          confidenceLevel === "high"
            ? 0.9
            : confidenceLevel === "medium"
              ? 0.7
              : 0.5,
        status: "APPRAISED",
      },
    });

    // Notify nearby shop owners (fire-and-forget)
    notifyNearbyShops(appraisalId).catch(console.error);

    return JSON.stringify({
      success: true,
      result: {
        estimatedPayoutLow: result.estimatedPayoutLow,
        estimatedPayoutHigh: result.estimatedPayoutHigh,
        meltValue: result.meltValue,
        pureMetalWeightGrams: result.pureMetalWeightGrams,
        spotPricePerGram: result.spotPricePerGram,
        confidenceLevel: result.confidenceLevel,
        disclaimer: result.disclaimer,
        ...(verificationNote ? { verificationNote } : {}),
      },
    });
  }

  if (toolName === "detect_gemstones") {
    const gemstones = toolInput.gemstones as {
      type: string;
      estimatedCaratSize: number;
      count: number;
      color?: string;
      cut?: string;
      confidence: string;
      notes?: string;
    }[];

    const estimates = estimateGemstoneValue(gemstones);

    const totalGemLow = estimates.reduce((sum, e) => sum + e.resaleLow, 0);
    const totalGemHigh = estimates.reduce((sum, e) => sum + e.resaleHigh, 0);

    // Gemstone data is returned to the AI and presented in the chat.
    // A dedicated Gemstone model can be added later for persistent storage.

    return JSON.stringify({
      success: true,
      gemstones: estimates.map((e) => ({
        description: e.description,
        estimatedResaleValue: `$${e.resaleLow}-$${e.resaleHigh}`,
        disclaimer: e.disclaimer,
      })),
      totalGemstoneEstimate: {
        low: totalGemLow,
        high: totalGemHigh,
      },
      guidance:
        "Present the gemstone value SEPARATELY from metal value. Say: 'In addition to the metal value, the gemstone(s) may add approximately $X-$Y in value.' Always recommend professional gemological evaluation.",
    });
  }

  return JSON.stringify({ error: "Unknown tool" });
}
