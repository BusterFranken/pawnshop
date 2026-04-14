"use client";

import { useRouter } from "next/navigation";
import { PhotoUpload } from "@/components/chat/photo-upload";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

export default function AppraisalUploadPage() {
  const router = useRouter();
  const [notes, setNotes] = useState("");

  async function handleImagesReady(images: { key: string; url: string }[]) {
    // Create appraisal via API
    const res = await fetch("/api/appraisal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ images, notes: notes.trim() || undefined }),
    });

    if (!res.ok) {
      console.error("Failed to create appraisal");
      return;
    }

    const { id } = await res.json();
    router.push(`/appraisal/${id}`);
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Get Your Appraisal</h1>
          <p className="text-muted-foreground">
            Upload a photo of your jewelry item. Our AI will analyze it and give
            you an instant valuation based on current metal prices.
          </p>
        </div>

        <PhotoUpload onImagesReady={handleImagesReady} />

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Additional info (optional)
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any stamps or markings? Know the weight? Anything else you'd like to share..."
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            Mentioning visible stamps (e.g. &quot;14K&quot;, &quot;925&quot;) or providing the
            weight helps us give a more accurate estimate.
          </p>
        </div>
      </div>
    </div>
  );
}
