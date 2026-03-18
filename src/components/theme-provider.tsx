"use client";

import { useEffect } from "react";
import { THEME_CSS } from "@/lib/theme-colors";

type ThemeProviderProps = {
  mode: "light" | "dark";
  color: string;
  children: React.ReactNode;
};

export function ThemeProvider({ mode, color, children }: ThemeProviderProps) {
  useEffect(() => {
    const root = document.documentElement;

    if (mode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    const entry = THEME_CSS[color];

    const styleId = "lieblings-theme";
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    // CRITICAL: entry is now { light: string, dark: string }, NOT a plain string
    if (entry && typeof entry === "object" && (entry.light || entry.dark)) {
      styleEl.textContent = `:root { ${entry.light} } .dark { ${entry.dark} }`;
    } else if (typeof entry === "string" && entry) {
      // Backwards compat fallback — shouldn't happen but just in case
      styleEl.textContent = `:root, .dark { ${entry} }`;
    } else {
      styleEl.textContent = "";
    }
  }, [mode, color]);

  return <>{children}</>;
}