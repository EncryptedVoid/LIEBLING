export const THEME_COLORS = [
  { id: "zinc",   label: "Graphite",  preview: "#71717a" },
  { id: "rose",   label: "Rosé",      preview: "#f43f5e" },
  { id: "blue",   label: "Lapis",     preview: "#3b82f6" },
  { id: "green",  label: "Jade",      preview: "#22c55e" },
  { id: "orange", label: "Sunset",    preview: "#f97316" },
  { id: "violet", label: "Amethyst",  preview: "#8b5cf6" },
] as const;

export type ThemeColor = (typeof THEME_COLORS)[number]["id"];

// ═══════════════════════════════════════════════════════
// THEME CSS OVERRIDES
// Each entry provides light + dark mode CSS custom property
// overrides for ALL color-dependent tokens.
// "zinc" is empty because it uses the globals.css defaults.
// ═══════════════════════════════════════════════════════

export type ThemeCSSEntry = {
  light: string;
  dark: string;
};

export const THEME_CSS: Record<string, ThemeCSSEntry> = {
  // ─── Zinc (Graphite) ─────────────────────────────────
  // Uses globals.css neutral defaults — no overrides
  zinc: { light: "", dark: "" },

  // ─── Rose (hue ~3) ───────────────────────────────────
  rose: {
    light: `
      --primary: oklch(0.585 0.233 3);
      --primary-foreground: oklch(0.985 0.005 3);
      --secondary: oklch(0.955 0.015 3);
      --secondary-foreground: oklch(0.35 0.10 3);
      --accent: oklch(0.94 0.018 3);
      --accent-foreground: oklch(0.30 0.12 3);
      --ring: oklch(0.585 0.233 3 / 40%);
      --chart-1: oklch(0.65 0.22 3);
      --chart-2: oklch(0.60 0.20 38);
      --chart-3: oklch(0.55 0.18 328);
      --chart-4: oklch(0.50 0.22 73);
      --chart-5: oklch(0.60 0.15 183);
      --sidebar-primary: oklch(0.585 0.233 3);
      --sidebar-primary-foreground: oklch(0.985 0.005 3);
      --sidebar-accent: oklch(0.94 0.018 3);
      --sidebar-accent-foreground: oklch(0.30 0.12 3);
      --sidebar-ring: oklch(0.585 0.233 3 / 30%);
      --glow: oklch(0.585 0.233 3 / 15%);
      --glow-strong: oklch(0.585 0.233 3 / 30%);
      --gradient-from: oklch(0.585 0.233 3);
      --gradient-to: oklch(0.65 0.22 38);
      --gradient-accent: oklch(0.60 0.20 328);
    `,
    dark: `
      --primary: oklch(0.72 0.20 3);
      --primary-foreground: oklch(0.13 0.015 3);
      --secondary: oklch(0.22 0.03 3);
      --secondary-foreground: oklch(0.90 0.01 3);
      --accent: oklch(0.72 0.20 3);
      --accent-foreground: oklch(0.13 0.015 3);
      --ring: oklch(0.72 0.20 3 / 40%);
      --chart-1: oklch(0.72 0.20 3);
      --chart-2: oklch(0.70 0.18 38);
      --chart-3: oklch(0.65 0.16 328);
      --chart-4: oklch(0.60 0.20 73);
      --chart-5: oklch(0.68 0.14 183);
      --sidebar-primary: oklch(0.72 0.20 3);
      --sidebar-primary-foreground: oklch(0.13 0.015 3);
      --sidebar-accent: oklch(0.25 0.035 3);
      --sidebar-accent-foreground: oklch(0.90 0.01 3);
      --sidebar-ring: oklch(0.72 0.20 3 / 30%);
      --glow: oklch(0.72 0.20 3 / 12%);
      --glow-strong: oklch(0.72 0.20 3 / 25%);
      --gradient-from: oklch(0.72 0.20 3);
      --gradient-to: oklch(0.70 0.18 38);
      --gradient-accent: oklch(0.65 0.16 328);
    `,
  },

  // ─── Blue (hue ~259) ─────────────────────────────────
  blue: {
    light: `
      --primary: oklch(0.623 0.214 259);
      --primary-foreground: oklch(0.985 0.005 259);
      --secondary: oklch(0.955 0.015 259);
      --secondary-foreground: oklch(0.35 0.10 259);
      --accent: oklch(0.94 0.018 259);
      --accent-foreground: oklch(0.30 0.12 259);
      --ring: oklch(0.623 0.214 259 / 40%);
      --chart-1: oklch(0.65 0.22 259);
      --chart-2: oklch(0.60 0.20 294);
      --chart-3: oklch(0.55 0.18 224);
      --chart-4: oklch(0.50 0.22 329);
      --chart-5: oklch(0.60 0.15 79);
      --sidebar-primary: oklch(0.623 0.214 259);
      --sidebar-primary-foreground: oklch(0.985 0.005 259);
      --sidebar-accent: oklch(0.94 0.018 259);
      --sidebar-accent-foreground: oklch(0.30 0.12 259);
      --sidebar-ring: oklch(0.623 0.214 259 / 30%);
      --glow: oklch(0.623 0.214 259 / 15%);
      --glow-strong: oklch(0.623 0.214 259 / 30%);
      --gradient-from: oklch(0.623 0.214 259);
      --gradient-to: oklch(0.65 0.22 294);
      --gradient-accent: oklch(0.60 0.20 224);
    `,
    dark: `
      --primary: oklch(0.72 0.19 259);
      --primary-foreground: oklch(0.13 0.015 259);
      --secondary: oklch(0.22 0.03 259);
      --secondary-foreground: oklch(0.90 0.01 259);
      --accent: oklch(0.72 0.19 259);
      --accent-foreground: oklch(0.13 0.015 259);
      --ring: oklch(0.72 0.19 259 / 40%);
      --chart-1: oklch(0.72 0.19 259);
      --chart-2: oklch(0.70 0.18 294);
      --chart-3: oklch(0.65 0.16 224);
      --chart-4: oklch(0.60 0.20 329);
      --chart-5: oklch(0.68 0.14 79);
      --sidebar-primary: oklch(0.72 0.19 259);
      --sidebar-primary-foreground: oklch(0.13 0.015 259);
      --sidebar-accent: oklch(0.25 0.035 259);
      --sidebar-accent-foreground: oklch(0.90 0.01 259);
      --sidebar-ring: oklch(0.72 0.19 259 / 30%);
      --glow: oklch(0.72 0.19 259 / 12%);
      --glow-strong: oklch(0.72 0.19 259 / 25%);
      --gradient-from: oklch(0.72 0.19 259);
      --gradient-to: oklch(0.70 0.18 294);
      --gradient-accent: oklch(0.65 0.16 224);
    `,
  },

  // ─── Green (hue ~150) ────────────────────────────────
  green: {
    light: `
      --primary: oklch(0.723 0.219 150);
      --primary-foreground: oklch(0.985 0.005 150);
      --secondary: oklch(0.955 0.015 150);
      --secondary-foreground: oklch(0.35 0.10 150);
      --accent: oklch(0.94 0.018 150);
      --accent-foreground: oklch(0.30 0.12 150);
      --ring: oklch(0.723 0.219 150 / 40%);
      --chart-1: oklch(0.65 0.22 150);
      --chart-2: oklch(0.60 0.20 185);
      --chart-3: oklch(0.55 0.18 115);
      --chart-4: oklch(0.50 0.22 220);
      --chart-5: oklch(0.60 0.15 330);
      --sidebar-primary: oklch(0.723 0.219 150);
      --sidebar-primary-foreground: oklch(0.985 0.005 150);
      --sidebar-accent: oklch(0.94 0.018 150);
      --sidebar-accent-foreground: oklch(0.30 0.12 150);
      --sidebar-ring: oklch(0.723 0.219 150 / 30%);
      --glow: oklch(0.723 0.219 150 / 15%);
      --glow-strong: oklch(0.723 0.219 150 / 30%);
      --gradient-from: oklch(0.723 0.219 150);
      --gradient-to: oklch(0.70 0.20 185);
      --gradient-accent: oklch(0.65 0.18 115);
    `,
    dark: `
      --primary: oklch(0.78 0.19 150);
      --primary-foreground: oklch(0.13 0.015 150);
      --secondary: oklch(0.22 0.03 150);
      --secondary-foreground: oklch(0.90 0.01 150);
      --accent: oklch(0.78 0.19 150);
      --accent-foreground: oklch(0.13 0.015 150);
      --ring: oklch(0.78 0.19 150 / 40%);
      --chart-1: oklch(0.78 0.19 150);
      --chart-2: oklch(0.74 0.17 185);
      --chart-3: oklch(0.70 0.15 115);
      --chart-4: oklch(0.65 0.18 220);
      --chart-5: oklch(0.72 0.14 330);
      --sidebar-primary: oklch(0.78 0.19 150);
      --sidebar-primary-foreground: oklch(0.13 0.015 150);
      --sidebar-accent: oklch(0.25 0.035 150);
      --sidebar-accent-foreground: oklch(0.90 0.01 150);
      --sidebar-ring: oklch(0.78 0.19 150 / 30%);
      --glow: oklch(0.78 0.19 150 / 12%);
      --glow-strong: oklch(0.78 0.19 150 / 25%);
      --gradient-from: oklch(0.78 0.19 150);
      --gradient-to: oklch(0.74 0.17 185);
      --gradient-accent: oklch(0.70 0.15 115);
    `,
  },

  // ─── Orange (hue ~48) ────────────────────────────────
  orange: {
    light: `
      --primary: oklch(0.702 0.191 48);
      --primary-foreground: oklch(0.985 0.005 48);
      --secondary: oklch(0.955 0.015 48);
      --secondary-foreground: oklch(0.35 0.10 48);
      --accent: oklch(0.94 0.018 48);
      --accent-foreground: oklch(0.30 0.12 48);
      --ring: oklch(0.702 0.191 48 / 40%);
      --chart-1: oklch(0.65 0.20 48);
      --chart-2: oklch(0.60 0.18 83);
      --chart-3: oklch(0.55 0.18 13);
      --chart-4: oklch(0.50 0.20 118);
      --chart-5: oklch(0.60 0.15 228);
      --sidebar-primary: oklch(0.702 0.191 48);
      --sidebar-primary-foreground: oklch(0.985 0.005 48);
      --sidebar-accent: oklch(0.94 0.018 48);
      --sidebar-accent-foreground: oklch(0.30 0.12 48);
      --sidebar-ring: oklch(0.702 0.191 48 / 30%);
      --glow: oklch(0.702 0.191 48 / 15%);
      --glow-strong: oklch(0.702 0.191 48 / 30%);
      --gradient-from: oklch(0.702 0.191 48);
      --gradient-to: oklch(0.68 0.19 83);
      --gradient-accent: oklch(0.63 0.20 13);
    `,
    dark: `
      --primary: oklch(0.78 0.17 48);
      --primary-foreground: oklch(0.13 0.015 48);
      --secondary: oklch(0.22 0.03 48);
      --secondary-foreground: oklch(0.90 0.01 48);
      --accent: oklch(0.78 0.17 48);
      --accent-foreground: oklch(0.13 0.015 48);
      --ring: oklch(0.78 0.17 48 / 40%);
      --chart-1: oklch(0.78 0.17 48);
      --chart-2: oklch(0.74 0.16 83);
      --chart-3: oklch(0.70 0.16 13);
      --chart-4: oklch(0.65 0.18 118);
      --chart-5: oklch(0.72 0.14 228);
      --sidebar-primary: oklch(0.78 0.17 48);
      --sidebar-primary-foreground: oklch(0.13 0.015 48);
      --sidebar-accent: oklch(0.25 0.035 48);
      --sidebar-accent-foreground: oklch(0.90 0.01 48);
      --sidebar-ring: oklch(0.78 0.17 48 / 30%);
      --glow: oklch(0.78 0.17 48 / 12%);
      --glow-strong: oklch(0.78 0.17 48 / 25%);
      --gradient-from: oklch(0.78 0.17 48);
      --gradient-to: oklch(0.74 0.16 83);
      --gradient-accent: oklch(0.70 0.16 13);
    `,
  },

  // ─── Violet (hue ~294) ───────────────────────────────
  violet: {
    light: `
      --primary: oklch(0.541 0.238 294);
      --primary-foreground: oklch(0.985 0.005 294);
      --secondary: oklch(0.955 0.015 294);
      --secondary-foreground: oklch(0.35 0.10 294);
      --accent: oklch(0.94 0.018 294);
      --accent-foreground: oklch(0.30 0.12 294);
      --ring: oklch(0.541 0.238 294 / 40%);
      --chart-1: oklch(0.65 0.22 294);
      --chart-2: oklch(0.60 0.20 329);
      --chart-3: oklch(0.55 0.18 259);
      --chart-4: oklch(0.50 0.22 4);
      --chart-5: oklch(0.60 0.15 114);
      --sidebar-primary: oklch(0.541 0.238 294);
      --sidebar-primary-foreground: oklch(0.985 0.005 294);
      --sidebar-accent: oklch(0.94 0.018 294);
      --sidebar-accent-foreground: oklch(0.30 0.12 294);
      --sidebar-ring: oklch(0.541 0.238 294 / 30%);
      --glow: oklch(0.541 0.238 294 / 15%);
      --glow-strong: oklch(0.541 0.238 294 / 30%);
      --gradient-from: oklch(0.541 0.238 294);
      --gradient-to: oklch(0.65 0.22 329);
      --gradient-accent: oklch(0.60 0.20 259);
    `,
    dark: `
      --primary: oklch(0.72 0.20 294);
      --primary-foreground: oklch(0.13 0.015 294);
      --secondary: oklch(0.22 0.03 294);
      --secondary-foreground: oklch(0.90 0.01 294);
      --accent: oklch(0.72 0.20 294);
      --accent-foreground: oklch(0.13 0.015 294);
      --ring: oklch(0.72 0.20 294 / 40%);
      --chart-1: oklch(0.72 0.20 294);
      --chart-2: oklch(0.70 0.18 329);
      --chart-3: oklch(0.65 0.16 259);
      --chart-4: oklch(0.60 0.20 4);
      --chart-5: oklch(0.68 0.14 114);
      --sidebar-primary: oklch(0.72 0.20 294);
      --sidebar-primary-foreground: oklch(0.13 0.015 294);
      --sidebar-accent: oklch(0.25 0.035 294);
      --sidebar-accent-foreground: oklch(0.90 0.01 294);
      --sidebar-ring: oklch(0.72 0.20 294 / 30%);
      --glow: oklch(0.72 0.20 294 / 12%);
      --glow-strong: oklch(0.72 0.20 294 / 25%);
      --gradient-from: oklch(0.72 0.20 294);
      --gradient-to: oklch(0.70 0.18 329);
      --gradient-accent: oklch(0.65 0.16 259);
    `,
  },
};