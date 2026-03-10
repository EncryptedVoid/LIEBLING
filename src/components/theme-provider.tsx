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

    // Apply dark/light mode
    if (mode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Apply color overrides
    const css = THEME_CSS[color] ?? "";

    const styleId = "lieblings-theme";
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    // Apply to both :root and .dark so it works in both modes
    styleEl.textContent = css
      ? `:root, .dark { ${css} }`
      : "";
  }, [mode, color]);

  return <>{children}</>;
}