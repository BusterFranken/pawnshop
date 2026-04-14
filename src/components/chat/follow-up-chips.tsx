"use client";

import { Button } from "@/components/ui/button";

const DEFAULT_CHIPS = [
  "Yes, it says 14K",
  "No stamps visible",
  "I don't have a scale",
  "It's not magnetic",
];

function getContextChips(lastMessage?: string): string[] {
  if (!lastMessage) return DEFAULT_CHIPS;
  const lower = lastMessage.toLowerCase();

  if (
    lower.includes("stamp") ||
    lower.includes("marking") ||
    lower.includes("hallmark") ||
    lower.includes("karat") ||
    lower.includes("inscri") ||
    lower.includes("engraving") ||
    lower.includes("inside")
  ) {
    return [
      "Yes, it says 14K",
      "It says 10K",
      "It says 18K",
      "It says 925",
      "No stamps visible",
      "I can't tell",
    ];
  }

  if (
    lower.includes("weigh") ||
    lower.includes("scale") ||
    lower.includes("gram") ||
    lower.includes("heavy") ||
    lower.includes("light")
  ) {
    return [
      "I don't have a scale",
      "About 3-5 grams",
      "About 10 grams",
      "About 20 grams",
      "It feels heavy",
      "It feels light",
    ];
  }

  if (lower.includes("magnet")) {
    return [
      "It's not magnetic",
      "It sticks to magnets",
      "Slightly magnetic",
      "I don't have a magnet",
    ];
  }

  return DEFAULT_CHIPS;
}

interface FollowUpChipsProps {
  onSelect: (text: string) => void;
  disabled?: boolean;
  lastAssistantMessage?: string;
}

export function FollowUpChips({
  onSelect,
  disabled,
  lastAssistantMessage,
}: FollowUpChipsProps) {
  const chips = getContextChips(lastAssistantMessage);

  return (
    <div className="px-4 py-2 flex gap-2 overflow-x-auto">
      {chips.map((text) => (
        <Button
          key={text}
          variant="outline"
          size="sm"
          className="shrink-0 text-xs rounded-full"
          disabled={disabled}
          onClick={() => onSelect(text)}
        >
          {text}
        </Button>
      ))}
    </div>
  );
}
