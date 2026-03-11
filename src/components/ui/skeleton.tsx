import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("rounded-md skeleton-shimmer", className)}
      {...props}
    />
  )
}

/** Card-shaped skeleton with image area + text lines */
function SkeletonCard({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-xl ring-1 ring-foreground/5 overflow-hidden",
        className
      )}
      {...props}
    >
      <div className="aspect-[4/3] skeleton-shimmer" />
      <div className="p-3 space-y-2">
        <div className="h-3 w-3/4 rounded skeleton-shimmer" />
        <div className="h-2.5 w-1/2 rounded skeleton-shimmer" />
      </div>
    </div>
  )
}

/** Row-shaped skeleton */
function SkeletonRow({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex items-center gap-3 p-2", className)}
      {...props}
    >
      <div className="h-10 w-10 rounded-lg skeleton-shimmer shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 w-2/3 rounded skeleton-shimmer" />
        <div className="h-2 w-1/3 rounded skeleton-shimmer" />
      </div>
    </div>
  )
}

/** Stat card skeleton */
function SkeletonStat({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-xl ring-1 ring-foreground/5 overflow-hidden",
        className
      )}
      {...props}
    >
      <div className="h-1 skeleton-shimmer" />
      <div className="p-4 flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl skeleton-shimmer shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-12 rounded skeleton-shimmer" />
          <div className="h-2.5 w-24 rounded skeleton-shimmer" />
        </div>
      </div>
    </div>
  )
}

export { Skeleton, SkeletonCard, SkeletonRow, SkeletonStat }