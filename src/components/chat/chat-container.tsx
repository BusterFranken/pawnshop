"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, Camera, X, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageBubble } from "./message-bubble";
import { FollowUpChips } from "./follow-up-chips";
import { AppraisalCard } from "./appraisal-card";
import type { AppraisalWithDetails } from "@/types/appraisal";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolResults?: { name: string; result: unknown }[];
}

interface ChatContainerProps {
  appraisal: AppraisalWithDetails;
}

export function ChatContainer({ appraisal: initialAppraisal }: ChatContainerProps) {
  const [messages, setMessages] = useState<Message[]>(
    initialAppraisal.messages.map((m) => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      content: m.content,
    }))
  );
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [appraisal, setAppraisal] = useState(initialAppraisal);
  const [pendingImages, setPendingImages] = useState<
    { preview: string; url: string; key: string; uploading: boolean }[]
  >([]);
  const [dragOver, setDragOver] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasSentInitial = useRef(false);
  const msgCounter = useRef(0);

  const isHeic = (file: File) =>
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    /\.heic$/i.test(file.name) ||
    /\.heif$/i.test(file.name);

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleFilesAdded = useCallback(async (files: FileList | File[]) => {
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/") && !isHeic(file)) continue;

      const id = `pending-${Date.now()}-${Math.random()}`;
      const preview = isHeic(file) ? "" : URL.createObjectURL(file);

      setPendingImages((prev) => [
        ...prev,
        { preview, url: "", key: id, uploading: true },
      ]);

      try {
        let url: string;
        let key: string;

        if (isHeic(file)) {
          const form = new FormData();
          form.append("file", file);
          const res = await fetch("/api/upload/convert", { method: "POST", body: form });
          if (!res.ok) throw new Error("HEIC conversion failed");
          const data = await res.json();
          url = data.publicUrl;
          key = data.key;
        } else {
          // Try S3, fall back to base64
          const checkRes = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filename: file.name, contentType: file.type }),
          });
          if (checkRes.ok) {
            const { presignedUrl, key: s3Key, publicUrl } = await checkRes.json();
            await fetch(presignedUrl, {
              method: "PUT",
              body: file,
              headers: { "Content-Type": file.type },
            });
            url = publicUrl;
            key = s3Key;
          } else {
            url = await fileToBase64(file);
            key = `local-${Date.now()}`;
          }
        }

        setPendingImages((prev) =>
          prev.map((img) =>
            img.key === id
              ? { ...img, url, preview: isHeic(file) ? url : img.preview, uploading: false }
              : img
          )
        );
      } catch {
        setPendingImages((prev) => prev.filter((img) => img.key !== id));
      }
    }
  }, []);

  // Auto-send first message if no messages exist (ref prevents Strict Mode double-fire)
  useEffect(() => {
    if (messages.length === 0 && !hasSentInitial.current) {
      hasSentInitial.current = true;
      sendMessage("Please analyze my jewelry and tell me what you see.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function sendMessage(text: string) {
    const readyImages = pendingImages.filter((img) => !img.uploading && img.url);
    const imageUrls = readyImages.map((img) => img.url);

    if ((!text.trim() && imageUrls.length === 0) || isLoading) return;

    const messageText = text.trim() || "Here are additional photos of the item.";

    const userId = `user-${++msgCounter.current}`;
    const userMessage: Message = {
      id: userId,
      role: "user",
      content: messageText,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setPendingImages([]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appraisalId: appraisal.id,
          message: messageText,
          ...(imageUrls.length > 0 && { imageUrls }),
        }),
      });

      if (!res.ok) throw new Error("Chat failed");

      // Refresh appraisal data if new images were sent (updates sidebar thumbnails)
      if (imageUrls.length > 0) {
        const refreshRes = await fetch(`/api/appraisal/${appraisal.id}`);
        if (refreshRes.ok) {
          const refreshed = await refreshRes.json();
          setAppraisal((prev) => ({ ...prev, ...refreshed }));
        }
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      const assistantId = `assistant-${++msgCounter.current}`;

      // Add empty assistant message
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "" },
      ]);

      if (reader) {
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = JSON.parse(line.slice(6));

            if (data.type === "error") {
              throw new Error(data.message || "An error occurred");
            } else if (data.type === "text") {
              assistantContent += data.text;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: assistantContent }
                    : m
                )
              );
            } else if (data.type === "tool_result") {
              if (data.tool === "calculate_appraisal" && data.result?.result) {
                setAppraisal((prev) => ({
                  ...prev,
                  status: "APPRAISED",
                  estimatedPayoutLow: data.result.result.estimatedPayoutLow,
                  estimatedPayoutHigh: data.result.result.estimatedPayoutHigh,
                  meltValue: data.result.result.meltValue,
                  spotPricePerGram: data.result.result.spotPricePerGram,
                  aiConfidence:
                    data.result.result.confidenceLevel === "high"
                      ? 0.9
                      : data.result.result.confidenceLevel === "medium"
                        ? 0.7
                        : 0.5,
                }));
              }
              if (data.tool === "extract_item_details") {
                // Refresh appraisal data
                const refreshRes = await fetch(
                  `/api/appraisal/${appraisal.id}`
                );
                if (refreshRes.ok) {
                  const refreshed = await refreshRes.json();
                  setAppraisal((prev) => ({ ...prev, ...refreshed }));
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${++msgCounter.current}`,
          role: "assistant",
          content:
            "Sorry, I encountered an error. Please try sending your message again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const isAppraised = appraisal.status === "APPRAISED" || appraisal.status === "APPOINTMENT_BOOKED";

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-5rem)]">
      {/* Chat panel */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto px-4" ref={scrollRef}>
          <div className="space-y-4 py-4 max-w-2xl mx-auto">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                role={msg.role}
                content={msg.content}
              />
            ))}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </div>
            )}
          </div>
        </div>

        {/* Quick replies */}
        {!isAppraised && messages.length > 1 && (
          <FollowUpChips
            onSelect={(text) => sendMessage(text)}
            disabled={isLoading}
            lastAssistantMessage={
              messages.filter((m) => m.role === "assistant").pop()?.content
            }
          />
        )}

        {/* Input */}
        <div
          className={`border-t p-4 transition-colors ${dragOver ? "bg-amber-50" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFilesAdded(e.dataTransfer.files);
          }}
        >
          <div className="max-w-2xl mx-auto">
            {/* Pending image previews */}
            {pendingImages.length > 0 && (
              <div className="flex gap-2 mb-2 flex-wrap">
                {pendingImages.map((img) => (
                  <div
                    key={img.key}
                    className="relative h-16 w-16 rounded-lg overflow-hidden border bg-muted shrink-0"
                  >
                    {img.uploading || !img.preview ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={img.preview}
                        alt="Upload"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )}
                    <button
                      onClick={() =>
                        setPendingImages((prev) => prev.filter((p) => p.key !== img.key))
                      }
                      className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/50 text-white hover:bg-black/70"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={() => {
                  const fileInput = document.createElement("input");
                  fileInput.type = "file";
                  fileInput.accept = "image/*";
                  fileInput.multiple = true;
                  fileInput.onchange = (e) => {
                    const target = e.target as HTMLInputElement;
                    if (target.files) handleFilesAdded(target.files);
                  };
                  fileInput.click();
                }}
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  dragOver
                    ? "Drop photos here..."
                    : isAppraised
                      ? "Ask any follow-up questions..."
                      : "Type your response..."
                }
                rows={1}
                className="min-h-[42px] max-h-32 resize-none"
              />
              <Button
                onClick={() => sendMessage(input)}
                disabled={(!input.trim() && pendingImages.length === 0) || isLoading || pendingImages.some((img) => img.uploading)}
                size="icon"
                className="shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Appraisal card sidebar */}
      <div className="lg:w-80 xl:w-96 shrink-0">
        <AppraisalCard appraisal={appraisal} />
      </div>
    </div>
  );
}
