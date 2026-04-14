import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

interface VerificationInput {
  imageUrls: string[];
  gptExtraction: {
    metalType: string;
    karatPurity?: number;
    purityConfidence?: string;
    estimatedWeightGrams?: number;
    itemCategory?: string;
  };
}

interface VerificationResult {
  agrees: boolean;
  disagreements: string[];
  claudeAssessment: {
    metalType: string;
    purity: string;
    weightClass: string;
    gemstones: string;
  };
  confidenceAdjustment: "boost" | "none" | "reduce";
}

export async function verifyWithClaude(
  input: VerificationInput
): Promise<VerificationResult | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  try {
    // Build image content blocks
    const imageBlocks: Anthropic.ImageBlockParam[] = [];
    for (const url of input.imageUrls.slice(0, 3)) {
      // Skip base64 data URLs over 15MB (Anthropic supports up to 20MB)
      if (url.startsWith("data:") && url.length > 15_000_000) continue;

      if (url.startsWith("data:")) {
        const match = url.match(/^data:(image\/\w+);base64,(.+)$/);
        if (match) {
          imageBlocks.push({
            type: "image",
            source: {
              type: "base64",
              media_type: match[1] as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
              data: match[2],
            },
          });
        }
      } else {
        imageBlocks.push({
          type: "image",
          source: { type: "url", url },
        });
      }
    }

    if (imageBlocks.length === 0) {
      console.log("[Claude verification] No usable images, skipping");
      return null;
    }

    console.log(`[Claude verification] Sending ${imageBlocks.length} image(s) for second opinion`);
    const response = await anthropic.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: [
            ...imageBlocks,
            {
              type: "text",
              text: `You are a jewelry identification specialist providing a second opinion. Analyze these jewelry photos and respond in JSON only (no markdown, no explanation).

Return this exact JSON format:
{
  "metalType": "gold" | "silver" | "platinum" | "unknown",
  "purity": "description like '14K' or '925 sterling' or 'unknown'",
  "weightClass": "light" | "medium" | "heavy" (relative to item type),
  "gemstones": "none visible" | brief description of any stones seen,
  "concerns": "none" | any concerns about plating, authenticity, etc.
}`,
            },
          ],
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Parse Claude's JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const claude = JSON.parse(jsonMatch[0]);
    const disagreements: string[] = [];

    // Compare metal types
    const gptMetal = input.gptExtraction.metalType?.toLowerCase();
    const claudeMetal = claude.metalType?.toLowerCase();
    if (
      gptMetal &&
      claudeMetal &&
      gptMetal !== "unknown" &&
      claudeMetal !== "unknown" &&
      gptMetal !== claudeMetal
    ) {
      disagreements.push(
        `Metal type: GPT-4o says ${gptMetal}, Claude says ${claudeMetal}`
      );
    }

    // Compare purity (rough check)
    const gptPurity = input.gptExtraction.karatPurity;
    const claudePurity = claude.purity?.toLowerCase() || "";
    if (gptPurity && gptMetal === "gold") {
      const claudeKarat = parseInt(claudePurity);
      if (claudeKarat && Math.abs(claudeKarat - gptPurity) > 4) {
        disagreements.push(
          `Purity: GPT-4o says ${gptPurity}K, Claude says ${claudePurity}`
        );
      }
    }

    const confidenceAdjustment: "boost" | "none" | "reduce" =
      disagreements.length === 0
        ? "boost"
        : disagreements.length >= 2
          ? "reduce"
          : "none";

    return {
      agrees: disagreements.length === 0,
      disagreements,
      claudeAssessment: {
        metalType: claude.metalType || "unknown",
        purity: claude.purity || "unknown",
        weightClass: claude.weightClass || "unknown",
        gemstones: claude.gemstones || "none visible",
      },
      confidenceAdjustment,
    };
  } catch (error) {
    console.error("[Claude verification] Error:", error);
    return null;
  }
}
