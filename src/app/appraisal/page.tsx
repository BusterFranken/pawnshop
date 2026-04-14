"use client";

import { useRouter } from "next/navigation";
import { PhotoUpload } from "@/components/chat/photo-upload";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { Camera, Ruler, Search, Loader2 } from "lucide-react";

const PHOTO_STEPS = [
  {
    icon: Camera,
    title: "1. Overview photo",
    description: "Top/face view of your item. Show the whole piece clearly.",
    tag: "Required",
    required: true,
  },
  {
    icon: Ruler,
    title: "2. Scale reference",
    description:
      "Place a US quarter or credit card next to your item and photograph from directly above. This helps us estimate weight.",
    tag: "Recommended",
    required: false,
  },
  {
    icon: Search,
    title: "3. Stamp close-up",
    description:
      "Check inside the ring band, on the clasp of a necklace, or the back of a pendant for tiny stamps (like 14K, 925, 750). Get as close as you can.",
    tag: "Recommended",
    required: false,
  },
];

export default function AppraisalUploadPage() {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleImagesReady(images: { key: string; url: string }[]) {
    setSubmitting(true);
    const res = await fetch("/api/appraisal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ images, notes: notes.trim() || undefined }),
    });

    if (!res.ok) {
      console.error("Failed to create appraisal");
      setSubmitting(false);
      return;
    }

    const { id } = await res.json();
    router.push(`/appraisal/${id}`);
  }

  if (submitting) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
        <p className="text-lg font-medium">Creating your appraisal...</p>
        <p className="text-sm text-muted-foreground">This will only take a moment</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Get Your Appraisal</h1>
          <p className="text-muted-foreground">
            Upload photos of your jewelry item. Better photos = more accurate
            estimates.
          </p>
        </div>

        <div className="grid md:grid-cols-[1fr,280px] gap-4">
          <PhotoUpload onImagesReady={handleImagesReady} />
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Additional info (optional)
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any stamps or markings? Know the weight? Anything else..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Stamps (e.g. &quot;14K&quot;, &quot;925&quot;) or weight help us
              give a more accurate estimate.
            </p>
          </div>
        </div>

        {/* Photo tips */}
        <div className="grid gap-2">
          <p className="text-sm font-medium text-muted-foreground">Tips for better estimates:</p>
          {PHOTO_STEPS.map((step) => (
            <Card key={step.title} className="border-dashed">
              <CardContent className="p-3 flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                  <step.icon className="h-4 w-4 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{step.title}</span>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ${
                        step.required
                          ? "bg-amber-100 text-amber-700"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {step.tag}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {step.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
