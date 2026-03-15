"use client";

import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const COLLECTION_EMOJIS = [
  "🎁", "🎂", "🎄", "💝", "🎓", "🍼", "🏠", "📚",
  "👗", "👟", "🎮", "🎵", "🎨", "✈️", "🍳", "🌱",
  "💻", "📱", "⌚", "💎", "🧸", "🎪", "🏋️", "🎣",
  "🪴", "🕯️", "☕", "🍷", "📷", "🎯", "🛋️", "🧴",
  "👶", "🐾", "🚗", "⭐", "❤️", "🔥", "🌈", "✨",
];

type EmojiPickerProps = {
  value: string | null;
  onChange: (emoji: string | null) => void;
};

export function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7 text-base shrink-0"
        >
          {value || "📁"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <div className="grid grid-cols-8 gap-0.5">
          {COLLECTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                onChange(emoji === value ? null : emoji);
                setOpen(false);
              }}
              className={`h-7 w-7 flex items-center justify-center rounded text-base hover:bg-muted transition-colors ${
                value === emoji ? "bg-primary/10 ring-1 ring-primary" : ""
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
        {value && (
          <Button
            variant="ghost"
            size="xs"
            className="w-full mt-1.5 text-[10px]"
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
          >
            Remove icon
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}