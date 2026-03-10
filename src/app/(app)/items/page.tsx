"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ItemGrid } from "@/components/item-grid";
import { AddItemDialog } from "@/components/add-item-dialog";
import type { Item, Collection } from "@/lib/types";

export default function ItemsPage() {
  const supabase = createClient();
  const [items, setItems] = useState<Item[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  async function fetchData() {
    setLoading(true);
    const [itemsRes, collectionsRes] = await Promise.all([
      supabase
        .from("items_visible")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase.from("collections").select("*").order("name"),
    ]);
    setItems(itemsRes.data ?? []);
    setCollections(collectionsRes.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  function handleDelete(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Items</h1>
          <p className="text-muted-foreground mt-1">
            Everything on your wishlist.
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
          emptyMessage="No items yet. Add your first one!"
        />
      </div>

      <AddItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        collections={collections}
        onItemAdded={fetchData}
      />
    </div>
  );
}