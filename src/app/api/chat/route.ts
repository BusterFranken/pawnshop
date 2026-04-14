import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { runAppraisalAgent, handleToolCall } from "@/lib/ai/appraisal-agent";
import { openai } from "@/lib/ai/client";
import { buildSystemPrompt } from "@/lib/ai/prompts";
import { appraisalTools } from "@/lib/ai/tools";

export async function POST(req: NextRequest) {
  const { appraisalId, message, imageUrls: newImageUrls } = await req.json();

  if (!appraisalId || !message) {
    return new Response(
      JSON.stringify({ error: "appraisalId and message required" }),
      { status: 400 }
    );
  }

  // Load appraisal with images and messages
  const appraisal = await db.appraisal.findUnique({
    where: { id: appraisalId },
    include: {
      images: { orderBy: { order: "asc" } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!appraisal) {
    return new Response(JSON.stringify({ error: "Appraisal not found" }), {
      status: 404,
    });
  }

  // Save new images if provided
  if (newImageUrls?.length) {
    const currentMax = appraisal.images.length;
    await db.appraisalImage.createMany({
      data: (newImageUrls as string[]).map((url: string, i: number) => ({
        appraisalId,
        url,
        key: `mid-chat-${Date.now()}-${i}`,
        order: currentMax + i,
      })),
    });
  }

  // Save user message
  await db.appraisalMessage.create({
    data: { appraisalId, role: "user", content: message },
  });

  // Get all messages including the new one
  const allMessages = await db.appraisalMessage.findMany({
    where: { appraisalId },
    orderBy: { createdAt: "asc" },
  });

  // Original images for the first message, new images for the current message
  const imageUrls = appraisal.images.map((img) => img.url);

  // Update status if this is the first message
  if (appraisal.status === "DRAFT") {
    await db.appraisal.update({
      where: { id: appraisalId },
      data: { status: "ANALYZING" },
    });
  }

  const userTurnCount = allMessages.filter((m) => m.role === "user").length;

  const { response, spotPrices, messages: openaiMessages } =
    await runAppraisalAgent({
      appraisalId,
      messages: allMessages,
      imageUrls,
      newImageUrls: newImageUrls as string[] | undefined,
    });

  // Process response
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        let fullResponse = "";
        const toolResults: { name: string; result: string }[] = [];
        const choice = response.choices[0];

        // Handle text content
        if (choice.message.content) {
          fullResponse += choice.message.content;
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "text", text: choice.message.content })}\n\n`
            )
          );
        }

        // Handle tool calls — process ALL tool calls before continuation
        // so that every tool_call_id has a matching tool response
        const fnCalls = (choice.message.tool_calls || []).filter(
          (tc): tc is Extract<typeof tc, { type: "function" }> =>
            tc.type === "function"
        );

        if (fnCalls.length) {
          // Execute all tool calls and collect results
          const toolMessages: { role: "tool"; tool_call_id: string; content: string }[] = [];

          for (const toolCall of fnCalls) {
            const toolInput = JSON.parse(toolCall.function.arguments);
            const toolResult = await handleToolCall(
              toolCall.function.name,
              toolInput,
              appraisalId,
              spotPrices
            );

            toolResults.push({
              name: toolCall.function.name,
              result: toolResult,
            });

            toolMessages.push({
              role: "tool" as const,
              tool_call_id: toolCall.id,
              content: toolResult,
            });

            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "tool_result",
                  tool: toolCall.function.name,
                  result: JSON.parse(toolResult),
                })}\n\n`
              )
            );
          }

          // Continue conversation with ALL tool results to get AI summary
          const continuedMessages = [
            ...openaiMessages,
            choice.message,
            ...toolMessages,
          ];

          const summaryResponse = await openai.chat.completions.create({
            model: "gpt-4o",
            max_tokens: 512,
            messages: continuedMessages,
            tools: appraisalTools,
          });

          const summaryContent =
            summaryResponse.choices[0].message.content;
          if (summaryContent) {
            fullResponse +=
              (fullResponse ? "\n\n" : "") + summaryContent;
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "text",
                  text: (fullResponse.length > summaryContent.length ? "\n\n" : "") + summaryContent,
                })}\n\n`
              )
            );
          }

          // Handle any additional tool calls from the summary (same pattern)
          const summaryFnCalls = (
            summaryResponse.choices[0].message.tool_calls || []
          ).filter(
            (tc): tc is Extract<typeof tc, { type: "function" }> =>
              tc.type === "function"
          );

          if (summaryFnCalls.length) {
            const summaryToolMessages: { role: "tool"; tool_call_id: string; content: string }[] = [];

            for (const stc of summaryFnCalls) {
              const stcInput = JSON.parse(stc.function.arguments);
              const stcResult = await handleToolCall(
                stc.function.name,
                stcInput,
                appraisalId,
                spotPrices
              );
              toolResults.push({
                name: stc.function.name,
                result: stcResult,
              });
              summaryToolMessages.push({
                role: "tool" as const,
                tool_call_id: stc.id,
                content: stcResult,
              });
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "tool_result",
                    tool: stc.function.name,
                    result: JSON.parse(stcResult),
                  })}\n\n`
                )
              );
            }

            // Get final summary after all summary tool calls
            const finalMessages = [
              ...continuedMessages,
              summaryResponse.choices[0].message,
              ...summaryToolMessages,
            ];

            const finalResponse = await openai.chat.completions.create({
              model: "gpt-4o",
              max_tokens: 512,
              messages: finalMessages,
            });

            const finalContent =
              finalResponse.choices[0].message.content;
            if (finalContent) {
              fullResponse += "\n\n" + finalContent;
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "text", text: "\n\n" + finalContent })}\n\n`
                )
              );
            }
          }
        }

        // Backend safety net: force calculation if 3+ user turns and AI didn't calculate
        const calculatedThisTurn = toolResults.some(
          (t) => t.name === "calculate_appraisal"
        );

        if (userTurnCount >= 3 && !calculatedThisTurn) {
          const currentAppraisal = await db.appraisal.findUnique({
            where: { id: appraisalId },
          });

          const forceMessages = [
            ...openaiMessages,
            ...(choice.message.content
              ? [
                  {
                    role: "assistant" as const,
                    content: choice.message.content,
                  },
                ]
              : []),
            {
              role: "system" as const,
              content: `You MUST call calculate_appraisal RIGHT NOW. Metal: ${currentAppraisal?.metalType || "GOLD"}, Category: ${currentAppraisal?.itemCategory || "ring"}. Use default estimates for any missing values. Do not respond with text — only call the tool.`,
            },
          ];

          const forceResponse = await openai.chat.completions.create({
            model: "gpt-4o",
            max_tokens: 512,
            messages: forceMessages,
            tools: appraisalTools,
            tool_choice: {
              type: "function",
              function: { name: "calculate_appraisal" },
            },
          });

          const forcedCalls = (
            forceResponse.choices[0].message.tool_calls || []
          ).filter(
            (tc): tc is Extract<typeof tc, { type: "function" }> =>
              tc.type === "function"
          );

          for (const fc of forcedCalls) {
            const fcInput = JSON.parse(fc.function.arguments);
            const fcResult = await handleToolCall(
              fc.function.name,
              fcInput,
              appraisalId,
              spotPrices
            );
            toolResults.push({ name: fc.function.name, result: fcResult });

            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "tool_result",
                  tool: fc.function.name,
                  result: JSON.parse(fcResult),
                })}\n\n`
              )
            );

            // Get summary of the forced calculation
            const summaryMsgs = [
              ...forceMessages,
              forceResponse.choices[0].message,
              {
                role: "tool" as const,
                tool_call_id: fc.id,
                content: fcResult,
              },
            ];

            const summaryRes = await openai.chat.completions.create({
              model: "gpt-4o",
              max_tokens: 256,
              messages: summaryMsgs,
            });

            const sumContent = summaryRes.choices[0].message.content;
            if (sumContent) {
              fullResponse += (fullResponse ? "\n\n" : "") + sumContent;
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "text", text: (fullResponse.length > sumContent.length ? "\n\n" : "") + sumContent })}\n\n`
                )
              );
            }
          }
        }

        // Save assistant response
        if (fullResponse) {
          await db.appraisalMessage.create({
            data: {
              appraisalId,
              role: "assistant",
              content: fullResponse,
              metadata: toolResults.length > 0 ? toolResults : undefined,
            },
          });
        }

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`)
        );
        controller.close();
      } catch (error) {
        console.error("Chat stream error:", error);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", message: "An error occurred" })}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
