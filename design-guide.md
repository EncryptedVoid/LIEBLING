# Lieblings Design Guide

## Table of Contents
1. [Color System](#color-system)
2. [Marketing Pages (Public)](#marketing-pages)
3. [App Pages (Authenticated)](#app-pages)
4. [Typography](#typography)
5. [Spacing & Layout](#spacing-layout)
6. [Components & Patterns](#components-patterns)
7. [Animations](#animations)
8. [Iconography](#iconography)
9. [Quick Reference Cheatsheet](#cheatsheet)

---

## 1. Color System <a name="color-system"></a>

Lieblings has **two independent color systems** that never overlap:

### Marketing Color System (public pages)
Used on: `/`, `/about`, `/features`, `/upcoming-updates`, `/login`, `/signup`, `/onboarding`

**Brand Gradient (always the same regardless of user theme):**
```
Amber → Orange → Rose → Pink
#fbbf24 → #fb923c → #f43f5e → #ec4899
```

This gradient is the **identity** of Lieblings. It appears on:
- The logo icon background
- Primary CTA buttons
- Text gradients for emphasis
- Decorative floating orbs

**Controlled via:** `data-marketing-theme` attribute on `<html>` (`"dark"` or `"light"`)
**Stored in:** `localStorage` key `lieblings-marketing-theme`

**Dark mode (default):**
| Token | Value | Usage |
|-------|-------|-------|
| `mkt-bg` | `#0a0a0a` | Page background |
| `mkt-bg-card` | `rgba(255,255,255,0.02)` | Card/container backgrounds |
| `mkt-bg-subtle` | `rgba(255,255,255,0.05)` | Subtle highlights, hover states |
| `mkt-bg-hover` | `rgba(255,255,255,0.08)` | Active hover state |
| `mkt-text` | `#ffffff` | Primary text |
| `mkt-text-muted` | `rgba(255,255,255,0.5)` | Secondary/descriptive text |
| `mkt-text-faint` | `rgba(255,255,255,0.25)` | Tertiary text, footnotes |
| `mkt-card-border` | `rgba(255,255,255,0.05)` | Card/container borders |

**Light mode:**
| Token | Value | Usage |
|-------|-------|-------|
| `mkt-bg` | `#fefcf9` | Page background (warm white) |
| `mkt-bg-card` | `rgba(0,0,0,0.02)` | Card backgrounds |
| `mkt-bg-subtle` | `rgba(0,0,0,0.04)` | Subtle highlights |
| `mkt-bg-hover` | `rgba(0,0,0,0.06)` | Active hover |
| `mkt-text` | `#1a1a1a` | Primary text |
| `mkt-text-muted` | `rgba(0,0,0,0.5)` | Secondary text |
| `mkt-text-faint` | `rgba(0,0,0,0.25)` | Tertiary text |
| `mkt-card-border` | `rgba(0,0,0,0.06)` | Card borders |

**Rules:**
- Never use Tailwind color utilities (`text-white`, `bg-gray-900`) on marketing pages — always use `mkt-*` classes
- The brand gradient (`#fbbf24 → #f43f5e`) is hardcoded and never changes between light/dark
- Background orbs use classes `mkt-orb-1`, `mkt-orb-2`, `mkt-orb-3` which auto-adjust opacity for light mode
- `mkt-text-strike` is used for strikethrough text that needs to be theme-aware

---

### App Color System (authenticated pages)
Used on: `/dashboard`, `/wishlist`, `/events`, `/friends`, `/activities`, `/blueprints`, `/settings`

**Controlled via:** CSS custom properties set by `ThemeProvider`
**Source of truth:** `src/lib/theme-colors.ts`

**6 Available Accent Colors:**

| ID | Label | Hue | Preview |
|----|-------|-----|---------|
| `zinc` | Graphite | 265 (neutral) | `#71717a` |
| `rose` | Rosé | 3 | `#f43f5e` |
| `blue` | Lapis | 259 | `#3b82f6` |
| `green` | Jade | 150 | `#22c55e` |
| `orange` | Sunset | 48 | `#f97316` |
| `violet` | Amethyst | 294 | `#8b5cf6` |

Each color overrides these CSS custom properties (separate light/dark values):
```
--primary, --primary-foreground
--secondary, --secondary-foreground
--accent, --accent-foreground
--ring
--glow, --glow-strong
--gradient-from, --gradient-to, --gradient-accent
--sidebar-primary, --sidebar-ring, --sidebar-accent
--chart-1 through --chart-5
```

**The default (zinc) uses `globals.css` values. All other colors inject overrides via a `<style>` tag.**

**Key app tokens:**
| Token | Light Default | Dark Default | Usage |
|-------|--------------|-------------|-------|
| `--glass` | `oklch(1 0 0 / 60%)` | `oklch(0.20 0.015 270 / 55%)` | Glassmorphic card backgrounds |
| `--glass-border` | `oklch(0.87 0.005 265 / 50%)` | `oklch(1 0 0 / 12%)` | Glass card borders |
| `--glass-highlight` | `oklch(1 0 0 / 60%)` | `oklch(1 0 0 / 8%)` | Inner card highlight |
| `--glow` | `10% opacity of primary` | `10% opacity of primary` | Subtle glow shadows |
| `--glow-strong` | `20% opacity of primary` | `20% opacity of primary` | Strong glow on hover/focus |
| `--gradient-from` | Primary color | Primary color (brighter) | Start of gradient |
| `--gradient-to` | +35° hue shift | +35° hue shift | End of gradient |
| `--gradient-accent` | -15° hue shift | -15° hue shift | Tertiary gradient stop |

**Rules:**
- Always use CSS variables, never hardcode colors in app components
- When viewing a friend's wishlist, their theme is scoped to `.friend-theme-scope` — it does NOT override the nav or other chrome
- The `ThemeProvider` applies mode (`dark` class on `<html>`) and color (injected `<style>` tag)

---

## 2. Marketing Pages <a name="marketing-pages"></a>

### Structure
Every marketing page follows this layout:
```
<MarketingNav />
<section> ... hero ... </section>
<section> ... content sections ... </section>
<section> ... CTA ... </section>
<MarketingFooter />
```

### Background Pattern
```tsx
{/* Floating gradient orbs — parallax on scroll */}
<div className="mkt-orb-1 absolute ..." style={{ transform: `translateY(${scrollY * 0.1}px)` }} />
<div className="mkt-orb-2 absolute ..." style={{ transform: `translateY(${scrollY * -0.05}px)` }} />

{/* Subtle grid overlay */}
<div className="absolute inset-0 mkt-grid-overlay" style={{ backgroundSize: "60px 60px" }} />
```

### Section Headers
Always follow this pattern:
```tsx
<span className="text-xs font-bold tracking-widest uppercase bg-gradient-to-r from-amber-400 to-rose-400 bg-clip-text text-transparent">
  SECTION LABEL
</span>
<h2 className="text-3xl lg:text-5xl font-heading font-extrabold mt-4 mb-4">
  Regular text{" "}
  <span className="bg-gradient-to-r from-amber-300 to-rose-400 bg-clip-text text-transparent">
    gradient emphasis.
  </span>
</h2>
<p className="mkt-text-muted leading-relaxed">Supporting description.</p>
```

### Cards
```tsx
<div className="rounded-2xl border mkt-card-border mkt-bg-card backdrop-blur-sm p-6 mkt-card-border-hover mkt-glow-hover transition-all duration-500 hover:-translate-y-1">
  {/* content */}
</div>
```

### CTA Buttons
**Primary (high emphasis):**
```tsx
<Button style={{ background: "linear-gradient(135deg, #fbbf24, #fb923c, #f43f5e)" }}
  className="font-bold text-black rounded-2xl shadow-xl shadow-amber-500/25 hover:shadow-amber-500/50 hover:scale-105 transition-all">
```

**Secondary (low emphasis):**
```tsx
<Button variant="outline" className="rounded-xl border mkt-card-border mkt-bg-card mkt-text hover:mkt-bg-hover">
```

### Scroll Reveal
Wrap any element that should animate in on scroll:
```tsx
<Reveal delay={100}>
  <div>...</div>
</Reveal>
```
- `delay` in milliseconds (use multiples of 60-100 for staggered grid items)
- Animates from `opacity-0 translate-y-8` to `opacity-100 translate-y-0`
- Uses `IntersectionObserver` with `threshold: 0.15`

---

## 3. App Pages <a name="app-pages"></a>

### Card Types

**Glass Card (most common):**
```tsx
<Card className="glass-card gradient-border-card rounded-2xl">
```
- Translucent background with backdrop blur
- Animated gradient border on hover
- Slight lift on hover (`hover:-translate-y-1` or `hover:-translate-y-2`)

**Simple Card:**
```tsx
<Card className="glass-card rounded-2xl">
```
- Same glass effect, no animated border

### Gradient Usage in App

**Icon containers:**
```tsx
<div className="p-1.5 rounded-lg" style={{ background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))' }}>
  <Icon className="h-3.5 w-3.5 text-primary-foreground" />
</div>
```

**Active sidebar/tab items:**
```tsx
style={{ 
  background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))',
  boxShadow: '0 4px 12px var(--glow)'
}}
```

**Gradient text:**
```tsx
<span className="gradient-text">Gradient words</span>
{/* or animated: */}
<span className="gradient-text-animated">Shimmer words</span>
```

**Buttons:**
```tsx
<Button className="btn-gradient rounded-xl shadow-lg">Primary action</Button>
```

### Page Layout Pattern
```tsx
<div className="page-enter max-w-{size} mx-auto space-y-{gap}">
  {/* Header */}
  <div>
    <h1 className="text-2xl font-heading font-semibold tracking-tight">Title</h1>
    <p className="text-muted-foreground mt-0.5 text-xs">Subtitle</p>
  </div>
  {/* Content */}
</div>
```

Width presets: `max-w-3xl` (narrow), `max-w-4xl` (medium), `max-w-5xl` (wide), `max-w-6xl` (full)

### Dashboard Equal Height Grid
```tsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ gridAutoRows: '400px' }}>
```

---

## 4. Typography <a name="typography"></a>

### Font Stack
- **Headings:** `Outfit` (variable `--font-heading`)
- **Body:** `Inter` (variable `--font-sans`)
- **Mono:** `Geist Mono` (variable `--font-geist-mono`)

### Heading Conventions
| Element | Classes |
|---------|---------|
| Page title | `text-2xl font-heading font-semibold tracking-tight` or `text-3xl font-heading font-bold` |
| Card title | `text-sm font-heading font-semibold` or `text-base font-heading font-semibold` |
| Section header | `text-sm font-medium tracking-tight` |
| Label | `text-[10px] text-muted-foreground uppercase tracking-widest font-medium` |

### Text Sizes (app)
| Use | Size |
|-----|------|
| Page title | `text-2xl` or `text-3xl` |
| Card title | `text-sm` or `text-base` |
| Body text | `text-xs` |
| Secondary text | `text-xs text-muted-foreground` |
| Tiny labels | `text-[10px] text-muted-foreground` |
| Badges | `text-[10px]` |
| Micro text | `text-[9px]` or `text-[8px]` |

### Marketing Text Sizes
| Use | Size |
|-----|------|
| Hero headline | `text-5xl sm:text-6xl lg:text-8xl` |
| Section headline | `text-3xl lg:text-5xl` |
| Subheadline | `text-lg lg:text-xl` |
| Card title | `text-base` or `text-sm` |
| Card body | `text-xs` |
| Section label | `text-xs uppercase tracking-widest` |

---

## 5. Spacing & Layout <a name="spacing-layout"></a>

### Border Radius Scale
| Token | Usage |
|-------|-------|
| `rounded-md` | Small inputs, internal elements |
| `rounded-lg` | Standard buttons, inputs |
| `rounded-xl` | Buttons, small cards, badges |
| `rounded-2xl` | Cards, modals, containers |
| `rounded-3xl` | Large hero cards, CTA sections |
| `rounded-full` | Avatars, dots, circular elements |

### Spacing Conventions
- Page padding: `px-4 py-6` (via layout)
- Section gaps: `space-y-6` or `space-y-8`
- Card internal padding: `p-4` to `p-6`
- Grid gaps: `gap-3` (tight), `gap-4` (standard), `gap-6` (spacious)
- Form field gaps: `gap-1.5` (label to input), `gap-3` or `gap-4` (between fields)

### Fixed Heights
| Element | Height |
|---------|--------|
| Nav bar | `h-16` (64px) |
| Dashboard cards | `400px` (via `gridAutoRows`) |
| Wishlist page | `h-[calc(100vh-4rem)]` |
| Banner images | `h-32` (128px) in forms, `h-20` (80px) on cards |
| Collection sidebar | `w-52` |
| Profile sidebar | `w-20` |

---

## 6. Components & Patterns <a name="components-patterns"></a>

### Badge Variants
```tsx
<Badge variant="default">Primary</Badge>        {/* Gradient bg */}
<Badge variant="secondary">Neutral</Badge>       {/* Muted bg */}
<Badge variant="outline">Bordered</Badge>         {/* Transparent + border */}
<Badge className="btn-gradient border-0">Custom</Badge> {/* Gradient badge */}
```

### Empty States
Always use the `EmptyState` component:
```tsx
<EmptyState
  variant="events"  // "gifts" | "events" | "collections" | "items" | "friends" | "search" | "generic"
  title="No events here"
  description="Create your first event to get started."
>
  <Button>Action</Button>
</EmptyState>
```

### Loading Skeletons
```tsx
<div className="skeleton-shimmer rounded-2xl h-[400px]" />
<SkeletonCard />   {/* Card with image area + text lines */}
<SkeletonRow />    {/* Row with thumbnail + text */}
```

### Avatar Pattern
```tsx
<Avatar className="h-10 w-10 ring-2 ring-primary/20 shadow-sm">
  <AvatarImage src={url} />
  <AvatarFallback className="text-xs font-semibold"
    style={{ background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))', color: 'var(--primary-foreground)' }}>
    {initials}
  </AvatarFallback>
</Avatar>
```

### Dialog/Modal Pattern
```tsx
<DialogContent className="sm:max-w-md glass-card rounded-2xl">
  <DialogHeader>
    <DialogTitle className="font-heading">Title</DialogTitle>
  </DialogHeader>
  {/* content */}
</DialogContent>
```

### Form Pattern
```tsx
<div className="flex flex-col gap-1.5">
  <Label htmlFor="field">Field Name</Label>
  <Input id="field" placeholder="..." className="rounded-xl" />
</div>
```

### Active/Selected State (sidebar items, tabs)
```tsx
{/* Active */}
style={{
  background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))',
  boxShadow: '0 4px 12px var(--glow)'
}}
className="text-primary-foreground font-medium shadow-lg"

{/* Inactive */}
className="hover:bg-muted/80 text-muted-foreground"
```

---

## 7. Animations <a name="animations"></a>

### Available CSS Animations
| Class | Effect | Duration |
|-------|--------|----------|
| `page-enter` | Fade up on page load | 0.5s |
| `animate-fade-up` | Fade + slide up | 0.5s |
| `animate-fade-down` | Fade + slide down | 0.4s |
| `animate-scale-in` | Fade + scale up | 0.4s |
| `animate-slide-in-left` | Slide from left | 0.5s |
| `animate-slide-in-right` | Slide from right | 0.5s |
| `animate-float` | Gentle vertical bob | 3s infinite |
| `animate-glow-pulse` | Pulsing box shadow | 2.5s infinite |
| `animate-confetti` | Falling confetti piece | 3s |
| `gradient-text-animated` | Shimmer across text | 4s infinite |

### Stagger Grid
Auto-staggers children with increasing delays:
```tsx
<div className="stagger-grid">
  {items.map(item => <Card key={item.id}>...</Card>)}
</div>
```
Children get 60ms incremental delay, up to 12 items.

### Hover Transitions
Standard: `transition-all duration-300`
Cards: `transition-all duration-400` (slightly slower for polish)
Marketing: `transition-all duration-500` (more dramatic)

### Lift on Hover
```tsx
className="hover:-translate-y-1"   // Subtle (cards in lists)
className="hover:-translate-y-2"   // Medium (feature cards)
className="hover:scale-105"        // CTA buttons
className="hover:scale-[1.02]"     // Preview cards
```

---

## 8. Iconography <a name="iconography"></a>

### Library: Lucide React
All icons come from `lucide-react`. Standard sizes:

| Context | Size |
|---------|------|
| Card title icon | `h-3.5 w-3.5` inside a gradient `p-1.5 rounded-lg` container |
| Button icon | `h-3.5 w-3.5` with `mr-1.5` |
| Inline text icon | `h-3 w-3` |
| Large feature icon | `h-5 w-5` or `h-6 w-6` |
| Hero/empty state | `h-7 w-7` or `h-8 w-8` |
| Marketing feature cards | `h-5 w-5 text-amber-400` |

### Icon Containers (app)
```tsx
{/* Small — card titles */}
<div className="p-1.5 rounded-lg" style={{ background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))' }}>
  <Icon className="h-3.5 w-3.5 text-primary-foreground" />
</div>

{/* Medium — section headers */}
<div className="h-12 w-12 rounded-2xl flex items-center justify-center"
  style={{ background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))', boxShadow: '0 4px 20px var(--glow)' }}>
  <Icon className="h-6 w-6 text-primary-foreground" />
</div>
```

### Icon Containers (marketing)
```tsx
<div className="h-11 w-11 rounded-xl flex items-center justify-center"
  style={{ background: "linear-gradient(135deg, rgba(251,191,36,0.15), rgba(244,63,94,0.15))" }}>
  <Icon className="h-5 w-5 text-amber-400" />
</div>
```

---

## 9. Quick Reference Cheatsheet <a name="cheatsheet"></a>

### When creating a NEW marketing page:
1. Use `mkt-bg mkt-text` on outer div
2. Add `<MarketingNav />` and `<MarketingFooter />`
3. Init theme in useEffect: `document.documentElement.setAttribute("data-marketing-theme", stored || "dark")`
4. Use `mkt-*` classes for ALL colors — never `text-white`, `bg-gray-900`, etc.
5. Use the `<Reveal>` component for scroll animations
6. Brand gradient: `linear-gradient(135deg, #fbbf24, #fb923c, #f43f5e)`
7. Section label: `text-xs font-bold tracking-widest uppercase` with gradient text

### When creating a NEW app page:
1. Outer div: `className="page-enter max-w-{size} mx-auto space-y-6"`
2. Cards: `className="glass-card gradient-border-card rounded-2xl"`
3. Gradients: always use `var(--gradient-from)`, `var(--gradient-to)`, `var(--gradient-accent)`
4. Active states: use inline `style={{ background: 'linear-gradient(...)' }}`
5. Never hardcode color hues — always use CSS variables
6. Add stagger animations: `className="stagger-grid"` on grids

### When adding a NEW theme color:
1. Choose a hue number (OKLCH)
2. Add entry to `THEME_COLORS` array in `theme-colors.ts`
3. Add `light` and `dark` CSS strings to `THEME_CSS` object
4. Follow the pattern: primary at base hue, gradient-to at +35°, gradient-accent at -15°
5. Light mode: primary lightness ~0.55-0.72, dark mode: ~0.72-0.78
6. Add the color ID to the `theme_color` check constraint in `supabase/script.sql`

### File responsibilities:
| File | Controls |
|------|----------|
| `globals.css` | Default (zinc) CSS variables, animations, glass effects, marketing theme CSS |
| `theme-colors.ts` | Color definitions and CSS override strings per theme |
| `theme-provider.tsx` | Applies mode + color to `<html>` on authenticated pages |
| `marketing-nav.tsx` | Marketing dark/light toggle, nav links, footer |
| `globals.css [data-marketing-theme]` | Marketing page light/dark CSS rules |
