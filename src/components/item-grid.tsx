import { Skeleton } from "@/components/ui/skeleton";
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
    }
  | {
      items: Item[];
      variant: "friend";
      loading?: boolean;
      currentUserId: string;
      onClaimChange?: () => void;
      emptyMessage?: string;
    };

export function ItemGrid(props: ItemGridProps) {
  const { items, variant, loading, emptyMessage } = props;

  // Loading skeletons
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-lg" />
        ))}
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground">
          {emptyMessage ?? "No items yet."}
        </p>
      </div>
    );
  }

  // Grid
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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