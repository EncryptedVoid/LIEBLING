import { SkeletonCard, SkeletonRow } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import type { Item } from "@/lib/types";
import { ItemCard } from "@/components/item-card";

type ItemGridProps =
  | {
      items: Item[];
      variant: "owner";
      viewMode?: "grid" | "list";
      loading?: boolean;
      onDelete?: (id: string) => void;
      onEdit?: (item: Item) => void;
      onGiftedToggle?: () => void;
      emptyMessage?: string;
      emptyVariant?: "items" | "search" | "gifts";
    }
  | {
      items: Item[];
      variant: "friend";
      viewMode?: "grid" | "list";
      loading?: boolean;
      currentUserId: string;
      onClaimChange?: () => void;
      emptyMessage?: string;
      emptyVariant?: "items" | "search" | "gifts";
    };

export function ItemGrid(props: ItemGridProps) {
  const { items, variant, loading, emptyMessage } = props;
  const viewMode = props.viewMode ?? "grid";
  const emptyVariant = "emptyVariant" in props ? props.emptyVariant : "items";

  if (loading) {
    if (viewMode === "list") {
      return (
        <div className="space-y-2 stagger-grid">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      );
    }
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 stagger-grid">
        {Array.from({ length: 8 }).map((_, i) => (
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

  if (viewMode === "list") {
    return (
      <div className="space-y-1.5 stagger-grid">
        {items.map((item) =>
          variant === "owner" ? (
            <ItemCard
              key={item.id}
              item={item}
              variant="owner"
              viewMode="list"
              onDelete={props.onDelete}
              onEdit={props.onEdit}
              onGiftedToggle={props.onGiftedToggle}
            />
          ) : (
            <ItemCard
              key={item.id}
              item={item}
              variant="friend"
              viewMode="list"
              currentUserId={props.currentUserId}
              onClaimChange={props.onClaimChange}
            />
          )
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 stagger-grid">
      {items.map((item) =>
        variant === "owner" ? (
          <ItemCard
            key={item.id}
            item={item}
            variant="owner"
            viewMode="grid"
            onDelete={props.onDelete}
            onEdit={props.onEdit}
            onGiftedToggle={props.onGiftedToggle}
          />
        ) : (
          <ItemCard
            key={item.id}
            item={item}
            variant="friend"
            viewMode="grid"
            currentUserId={props.currentUserId}
            onClaimChange={props.onClaimChange}
          />
        )
      )}
    </div>
  );
}