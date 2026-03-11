import { SkeletonCard } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import type { Item } from "@/lib/types";
import { ItemCard } from "@/components/item-card";

type ItemGridProps =
  | {
      items: Item[];
      variant: "owner";
      loading?: boolean;
      onDelete?: (id: string) => void;
      onEdit?: (item: Item) => void;
      emptyMessage?: string;
      emptyVariant?: "items" | "search" | "gifts";
    }
  | {
      items: Item[];
      variant: "friend";
      loading?: boolean;
      currentUserId: string;
      onClaimChange?: () => void;
      emptyMessage?: string;
      emptyVariant?: "items" | "search" | "gifts";
    };

export function ItemGrid(props: ItemGridProps) {
  const { items, variant, loading, emptyMessage } = props;
  const emptyVariant =
    "emptyVariant" in props ? props.emptyVariant : "items";

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        variant={emptyVariant ?? "items"}
        title={emptyMessage ?? "No items yet"}
        description={
          variant === "owner"
            ? "Add your first item to get started."
            : "Nothing here yet — check back later!"
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-grid">
      {items.map((item) =>
        variant === "owner" ? (
          <ItemCard
            key={item.id}
            item={item}
            variant="owner"
            onDelete={props.onDelete}
            onEdit={props.onEdit}
          />
        ) : (
          <ItemCard
            key={item.id}
            item={item}
            variant="friend"
            currentUserId={props.currentUserId}
            onClaimChange={props.onClaimChange}
          />
        )
      )}
    </div>
  );
}