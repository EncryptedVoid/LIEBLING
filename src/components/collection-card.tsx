import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import type { Collection } from "@/lib/types";

type CollectionCardProps = {
  collection: Collection & {
    item_count: number;
    preview_images: string[]; // first 3 item image_urls
  };
};

export function CollectionCard({ collection }: CollectionCardProps) {
  return (
    <Link href={`/collections/${collection.id}`}>
      <Card className="hover:border-foreground/20 transition-colors cursor-pointer">
        {/* Preview thumbnails */}
        <div className="flex h-24 overflow-hidden rounded-t-lg bg-muted">
          {collection.preview_images.length > 0 ? (
            collection.preview_images.map((src, i) => (
              <div key={i} className="flex-1 border-r last:border-r-0">
                <img
                  src={src}
                  alt=""
                  className="object-cover w-full h-full"
                />
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center w-full text-muted-foreground text-xs">
              No items yet
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-medium text-sm truncate">
              {collection.name}
            </h3>
            <Badge variant="secondary">
              {collection.item_count} {collection.item_count === 1 ? "item" : "items"}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}