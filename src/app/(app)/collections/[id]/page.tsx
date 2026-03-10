"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ItemGrid } from "@/components/item-grid";
import { AddItemDialog } from "@/components/add-item-dialog";
import type { Item, Collection } from "@/lib/types";

export default function CollectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const supabase = createClient();

  const [collection, setCollection] = useState<Collection | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [allCollections, setAllCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  async function fetchData() {
    setLoading(true);

    const [colRes, itemsRes, allColsRes] = await Promise.all([
      supabase.from("collections").select("*").eq("id", id).single(),
      supabase
        .from("items_visible")
        .select("*")
        .eq("collection_id", id)
        .order("created_at", { ascending: false }),
      supabase.from("collections").select("*").order("name"),
    ]);

    setCollection(colRes.data);
    setItems(itemsRes.data ?? []);
    setAllCollections(allColsRes.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, [id]);

  function handleDelete(itemId: string) {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  }

  if (!loading && !collection) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-muted-foreground">Collection not found.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {collection?.name ?? "Loading..."}
          </h1>
          <p className="text-muted-foreground mt-1">
            {items.length} {items.length === 1 ? "item" : "items"}
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>Add item</Button>
      </div>

      <div className="mt-8">
        <ItemGrid
          items={items}
          variant="owner"
          loading={loading}
          onDelete={handleDelete}
          emptyMessage="This collection is empty. Add an item to get started."
        />
      </div>

      <AddItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        collections={allCollections}
        defaultCollectionId={id}
        onItemAdded={fetchData}
      />
    </div>
  );
}