"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MapPin, DollarSign, Scale, Gem } from "lucide-react";
import { formatCurrency, formatWeight } from "@/lib/utils";
import type { AppraisalWithDetails } from "@/types/appraisal";

interface AppraisalCardProps {
  appraisal: AppraisalWithDetails;
}

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  DRAFT: { label: "Uploading", variant: "outline" },
  ANALYZING: { label: "Analyzing", variant: "secondary" },
  CONVERSING: { label: "In Progress", variant: "secondary" },
  APPRAISED: { label: "Complete", variant: "default" },
  APPOINTMENT_BOOKED: { label: "Booked", variant: "default" },
};

const METAL_LABELS: Record<string, string> = {
  GOLD: "Gold",
  SILVER: "Silver",
  PLATINUM: "Platinum",
  PALLADIUM: "Palladium",
  UNKNOWN: "Unknown",
};

export function AppraisalCard({ appraisal }: AppraisalCardProps) {
  const [activeImage, setActiveImage] = useState(0);
  const status = STATUS_LABELS[appraisal.status] || STATUS_LABELS.DRAFT;
  const isAppraised = appraisal.status === "APPRAISED" || appraisal.status === "APPOINTMENT_BOOKED";

  return (
    <Card className="sticky top-20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Appraisal Summary</CardTitle>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Item photos */}
        {appraisal.images.length > 0 && (
          <div className="flex gap-2">
            {/* Main image */}
            <div className={`relative aspect-square rounded-lg overflow-hidden bg-muted ${appraisal.images.length > 1 ? "flex-1 min-w-0" : "w-full aspect-video"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={appraisal.images[activeImage]?.url ?? appraisal.images[0].url}
                alt="Jewelry item"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
            {/* Thumbnails */}
            {appraisal.images.length > 1 && (
              <div className="flex flex-col gap-1.5 w-14 shrink-0">
                {appraisal.images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImage(i)}
                    className={`relative aspect-square rounded-md overflow-hidden bg-muted ring-offset-1 transition-all ${
                      i === activeImage ? "ring-2 ring-amber-500" : "ring-1 ring-border hover:ring-amber-300"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={`Photo ${i + 1}`}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Extracted details */}
        {appraisal.metalType && (
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Gem className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Metal:</span>
              <span className="font-medium">
                {METAL_LABELS[appraisal.metalType] || appraisal.metalType}
              </span>
            </div>
            {appraisal.karatPurity && (
              <div className="flex items-center gap-2">
                <span className="w-4" />
                <span className="text-muted-foreground">Purity:</span>
                <span className="font-medium">
                  {appraisal.metalType === "GOLD"
                    ? `${appraisal.karatPurity}K`
                    : appraisal.karatPurity}
                </span>
              </div>
            )}
            {appraisal.estimatedWeight && (
              <div className="flex items-center gap-2">
                <Scale className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Weight:</span>
                <span className="font-medium">
                  {formatWeight(appraisal.estimatedWeight)}
                </span>
                {appraisal.weightSource && (
                  <span className="text-xs text-muted-foreground">
                    ({appraisal.weightSource.replace(/_/g, " ")})
                  </span>
                )}
              </div>
            )}
            {appraisal.itemCategory && (
              <div className="flex items-center gap-2">
                <span className="w-4" />
                <span className="text-muted-foreground">Type:</span>
                <span className="font-medium capitalize">
                  {appraisal.itemCategory}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Valuation */}
        {isAppraised && appraisal.estimatedPayoutLow != null && appraisal.estimatedPayoutHigh != null && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-lg text-green-700">
                  {formatCurrency(appraisal.estimatedPayoutLow)} &ndash;{" "}
                  {formatCurrency(appraisal.estimatedPayoutHigh)}
                </span>
              </div>
              {appraisal.meltValue != null && (
                <p className="text-xs text-muted-foreground">
                  Melt value: {formatCurrency(appraisal.meltValue)} | Spot: $
                  {appraisal.spotPricePerGram?.toFixed(2)}/g
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Estimated pawn shop offer range. Final value depends on
                in-person evaluation.
              </p>
            </div>

            <Link href={`/book/${appraisal.id}`}>
              <Button className="w-full" size="lg">
                <MapPin className="h-4 w-4 mr-2" />
                Find Nearby Shops
              </Button>
            </Link>
          </>
        )}

        {/* Loading state */}
        {!isAppraised && !appraisal.metalType && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Details will appear here as the AI analyzes your item...
          </p>
        )}
      </CardContent>
    </Card>
  );
}
