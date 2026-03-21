"use client";

import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { getTodaysFunFact } from "@/lib/fun-facts";
import { SPECIAL_DAYS } from "@/lib/special-days";

function getTodaysDisplay(): { emoji: string; text: string } {
  const now = new Date();
  const key = `${(now.getMonth() + 1).toString().padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}`;

  const special = SPECIAL_DAYS[key];
  if (special) return special;

  return { emoji: "💡", text: getTodaysFunFact() };
}

export function Footer() {
  const [display, setDisplay] = useState<{ emoji: string; text: string } | null>(null);

  useEffect(() => {
    setDisplay(getTodaysDisplay());
  }, []);

  return (
    <footer className="border-t border-border/40 bg-muted/10 py-4 mt-auto">
      <div className="container mx-auto px-6 max-w-6xl flex items-center justify-center gap-3">
        <Sparkles className="h-3 w-3 text-muted-foreground/40 shrink-0" />
        {display && (
          <p className="text-xs text-muted-foreground text-center animate-fade-up">
            <span className="mr-1.5">{display.emoji}</span>
            {display.text}
          </p>
        )}
        <Sparkles className="h-3 w-3 text-muted-foreground/40 shrink-0" />
      </div>
    </footer>
  );
}