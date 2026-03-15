export const THEME_COLORS = [
  { id: "zinc",   label: "Graphite",  preview: "#71717a" },
  { id: "rose",   label: "Rosé",      preview: "#f43f5e" },
  { id: "blue",   label: "Lapis",     preview: "#3b82f6" },
  { id: "green",  label: "Jade",      preview: "#22c55e" },
  { id: "orange", label: "Sunset",    preview: "#f97316" },
  { id: "violet", label: "Amethyst",  preview: "#8b5cf6" },
] as const;

export type ThemeColor = (typeof THEME_COLORS)[number]["id"];

// OKLCH overrides for --primary and --ring
// "zinc" uses the default shadcn values so no override needed
export const THEME_CSS: Record<string, string> = {
  zinc: "",
  rose: `
    --primary: oklch(0.585 0.233 3.44);
    --primary-foreground: oklch(1 0 0);
    --ring: oklch(0.585 0.233 3.44);
    --sidebar-primary: oklch(0.585 0.233 3.44);
    --sidebar-ring: oklch(0.585 0.233 3.44);
  `,
  blue: `
    --primary: oklch(0.623 0.214 259.53);
    --primary-foreground: oklch(1 0 0);
    --ring: oklch(0.623 0.214 259.53);
    --sidebar-primary: oklch(0.623 0.214 259.53);
    --sidebar-ring: oklch(0.623 0.214 259.53);
  `,
  green: `
    --primary: oklch(0.723 0.219 149.58);
    --primary-foreground: oklch(1 0 0);
    --ring: oklch(0.723 0.219 149.58);
    --sidebar-primary: oklch(0.723 0.219 149.58);
    --sidebar-ring: oklch(0.723 0.219 149.58);
  `,
  orange: `
    --primary: oklch(0.702 0.191 47.6);
    --primary-foreground: oklch(1 0 0);
    --ring: oklch(0.702 0.191 47.6);
    --sidebar-primary: oklch(0.702 0.191 47.6);
    --sidebar-ring: oklch(0.702 0.191 47.6);
  `,
  violet: `
    --primary: oklch(0.541 0.238 293.74);
    --primary-foreground: oklch(1 0 0);
    --ring: oklch(0.541 0.238 293.74);
    --sidebar-primary: oklch(0.541 0.238 293.74);
    --sidebar-ring: oklch(0.541 0.238 293.74);
  `,
};