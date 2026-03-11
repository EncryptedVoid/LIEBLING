"use client";

import { cn } from "@/lib/utils";

type EmptyStateVariant =
  | "gifts"
  | "events"
  | "collections"
  | "items"
  | "friends"
  | "search"
  | "generic";

type EmptyStateProps = {
  variant?: EmptyStateVariant;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
};

function EmptyIllustration({ variant }: { variant: EmptyStateVariant }) {
  const shared = "w-full h-full";

  switch (variant) {
    case "gifts":
      return (
        <svg viewBox="0 0 200 160" fill="none" className={shared}>
          <defs>
            <linearGradient id="giftGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.15" />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <rect x="50" y="50" width="100" height="80" rx="8" fill="url(#giftGrad)" stroke="var(--color-primary)" strokeWidth="1.5" strokeOpacity="0.3" />
          <rect x="50" y="50" width="100" height="20" rx="8" fill="var(--color-primary)" fillOpacity="0.1" />
          <line x1="100" y1="50" x2="100" y2="130" stroke="var(--color-primary)" strokeWidth="1.5" strokeOpacity="0.25" />
          <path d="M100 50 C85 35, 65 40, 70 50" stroke="var(--color-primary)" strokeWidth="1.5" strokeOpacity="0.4" fill="none" strokeLinecap="round" />
          <path d="M100 50 C115 35, 135 40, 130 50" stroke="var(--color-primary)" strokeWidth="1.5" strokeOpacity="0.4" fill="none" strokeLinecap="round" />
          <circle cx="40" cy="40" r="3" fill="var(--color-primary)" fillOpacity="0.15" />
          <circle cx="165" cy="60" r="4" fill="var(--color-primary)" fillOpacity="0.1" />
          <circle cx="155" cy="35" r="2" fill="var(--color-primary)" fillOpacity="0.2" />
        </svg>
      );

    case "events":
      return (
        <svg viewBox="0 0 200 160" fill="none" className={shared}>
          <defs>
            <linearGradient id="calGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.15" />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <rect x="45" y="35" width="110" height="100" rx="10" fill="url(#calGrad)" stroke="var(--color-primary)" strokeWidth="1.5" strokeOpacity="0.3" />
          <rect x="45" y="35" width="110" height="28" rx="10" fill="var(--color-primary)" fillOpacity="0.12" />
          <line x1="75" y1="28" x2="75" y2="42" stroke="var(--color-primary)" strokeWidth="2" strokeOpacity="0.3" strokeLinecap="round" />
          <line x1="125" y1="28" x2="125" y2="42" stroke="var(--color-primary)" strokeWidth="2" strokeOpacity="0.3" strokeLinecap="round" />
          {[0, 1, 2].map((row) =>
            [0, 1, 2, 3].map((col) => (
              <rect
                key={`${row}-${col}`}
                x={60 + col * 24}
                y={75 + row * 18}
                width="16"
                height="10"
                rx="2"
                fill="var(--color-primary)"
                fillOpacity={row === 1 && col === 2 ? 0.2 : 0.06}
              />
            ))
          )}
        </svg>
      );

    case "collections":
      return (
        <svg viewBox="0 0 200 160" fill="none" className={shared}>
          <defs>
            <linearGradient id="colGrad" x1="0" y1="0" x2="0.8" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.12" />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.03" />
            </linearGradient>
          </defs>
          <rect x="35" y="55" width="55" height="70" rx="8" fill="url(#colGrad)" stroke="var(--color-primary)" strokeWidth="1.5" strokeOpacity="0.2" />
          <rect x="72" y="45" width="55" height="70" rx="8" fill="url(#colGrad)" stroke="var(--color-primary)" strokeWidth="1.5" strokeOpacity="0.25" />
          <rect x="110" y="35" width="55" height="70" rx="8" fill="url(#colGrad)" stroke="var(--color-primary)" strokeWidth="1.5" strokeOpacity="0.3" />
          <circle cx="137" cy="65" r="10" fill="var(--color-primary)" fillOpacity="0.1" />
          <line x1="132" y1="65" x2="142" y2="65" stroke="var(--color-primary)" strokeWidth="1.5" strokeOpacity="0.4" strokeLinecap="round" />
          <line x1="137" y1="60" x2="137" y2="70" stroke="var(--color-primary)" strokeWidth="1.5" strokeOpacity="0.4" strokeLinecap="round" />
        </svg>
      );

    case "items":
      return (
        <svg viewBox="0 0 200 160" fill="none" className={shared}>
          <defs>
            <linearGradient id="itemGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.12" />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.04" />
            </linearGradient>
          </defs>
          <rect x="30" y="40" width="60" height="80" rx="8" fill="url(#itemGrad)" stroke="var(--color-primary)" strokeWidth="1" strokeOpacity="0.2" strokeDasharray="4 3" />
          <rect x="70" y="40" width="60" height="80" rx="8" fill="url(#itemGrad)" stroke="var(--color-primary)" strokeWidth="1" strokeOpacity="0.2" strokeDasharray="4 3" />
          <rect x="110" y="40" width="60" height="80" rx="8" fill="url(#itemGrad)" stroke="var(--color-primary)" strokeWidth="1" strokeOpacity="0.2" strokeDasharray="4 3" />
          <circle cx="100" cy="80" r="14" fill="var(--color-primary)" fillOpacity="0.08" />
          <line x1="95" y1="80" x2="105" y2="80" stroke="var(--color-primary)" strokeWidth="1.5" strokeOpacity="0.35" strokeLinecap="round" />
          <line x1="100" y1="75" x2="100" y2="85" stroke="var(--color-primary)" strokeWidth="1.5" strokeOpacity="0.35" strokeLinecap="round" />
        </svg>
      );

    case "friends":
      return (
        <svg viewBox="0 0 200 160" fill="none" className={shared}>
          <circle cx="80" cy="70" r="20" fill="var(--color-primary)" fillOpacity="0.1" stroke="var(--color-primary)" strokeWidth="1.5" strokeOpacity="0.25" />
          <circle cx="120" cy="70" r="20" fill="var(--color-primary)" fillOpacity="0.08" stroke="var(--color-primary)" strokeWidth="1.5" strokeOpacity="0.2" />
          <path d="M80 95 C80 105, 70 115, 80 120 L120 120 C130 115, 120 105, 120 95" fill="var(--color-primary)" fillOpacity="0.06" />
          <circle cx="80" cy="65" r="4" fill="var(--color-primary)" fillOpacity="0.2" />
          <circle cx="120" cy="65" r="4" fill="var(--color-primary)" fillOpacity="0.15" />
        </svg>
      );

    case "search":
      return (
        <svg viewBox="0 0 200 160" fill="none" className={shared}>
          <circle cx="90" cy="72" r="30" fill="var(--color-primary)" fillOpacity="0.06" stroke="var(--color-primary)" strokeWidth="1.5" strokeOpacity="0.25" />
          <line x1="112" y1="94" x2="135" y2="117" stroke="var(--color-primary)" strokeWidth="3" strokeOpacity="0.25" strokeLinecap="round" />
          <line x1="80" y1="72" x2="100" y2="72" stroke="var(--color-primary)" strokeWidth="1.5" strokeOpacity="0.2" strokeLinecap="round" />
          <line x1="75" y1="80" x2="105" y2="80" stroke="var(--color-primary)" strokeWidth="1.5" strokeOpacity="0.15" strokeLinecap="round" />
        </svg>
      );

    default:
      return (
        <svg viewBox="0 0 200 160" fill="none" className={shared}>
          <circle cx="100" cy="80" r="35" fill="var(--color-primary)" fillOpacity="0.06" stroke="var(--color-primary)" strokeWidth="1.5" strokeOpacity="0.2" strokeDasharray="6 4" />
          <circle cx="100" cy="80" r="12" fill="var(--color-primary)" fillOpacity="0.1" />
        </svg>
      );
  }
}

export function EmptyState({
  variant = "generic",
  title,
  description,
  children,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center animate-in fade-in-50 duration-500",
        className
      )}
    >
      <div className="w-48 h-36 mb-4 opacity-80">
        <EmptyIllustration variant={variant} />
      </div>
      {title && (
        <h3 className="text-sm font-medium text-foreground/80 mt-1">{title}</h3>
      )}
      {description && (
        <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
          {description}
        </p>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}