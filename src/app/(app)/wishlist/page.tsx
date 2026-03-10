"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ItemGrid } from "@/components/item-grid";
import { AddItemDialog } from "@/components/add-item-dialog";
import { toast } from "sonner";

import type { Item, Collection } from "@/lib/types";

export default function WishlistPage() {
  const supabase = createClient();

  const [items, setItems] = useState<Item[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  // Which collection is selected — null means "All items"
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);

  const [addItemOpen, setAddItemOpen] = useState(false);
  const [addCollectionOpen, setAddCollectionOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [savingCollection, setSavingCollection] = useState(false);

  async function fetchData() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const [itemsRes, colsRes] = await Promise.all([
      supabase
        .from("items_visible")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("collections")
        .select("*")
        .eq("user_id", user!.id)
        .order("name"),
    ]);

    setItems(itemsRes.data ?? []);
    setCollections(colsRes.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered items based on selected collection
  const filteredItems =
    activeCollectionId === null
      ? items
      : items.filter((i) => i.collection_id === activeCollectionId);

  // Item counts per collection
  function getCount(colId: string | null): number {
    if (colId === null) return items.length;
    return items.filter((i) => i.collection_id === colId).length;
  }

  function handleDelete(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  async function handleCreateCollection() {
    if (!newCollectionName.trim()) return;
    setSavingCollection(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("collections")
      .insert({ user_id: user!.id, name: newCollectionName.trim() });

    if (error) {
      toast.error("Couldn't create collection.");
    } else {
      toast.success(`"${newCollectionName.trim()}" created.`);
      setNewCollectionName("");
      setAddCollectionOpen(false);
      fetchData();
    }
    setSavingCollection(false);
  }

  const activeLabel =
    activeCollectionId === null
      ? "All items"
      : collections.find((c) => c.id === activeCollectionId)?.name ?? "Collection";

  return (
    <div className="flex gap-8">
      {/* ── Sidebar ─────────────────────────────────── */}
      <aside className="w-56 shrink-0 hidden md:block">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-muted-foreground">Collections</h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setAddCollectionOpen(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex flex-col gap-0.5">
          {/* All items tab */}
          <button
            onClick={() => setActiveCollectionId(null)}
            className={`flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors text-left ${
              activeCollectionId === null
                ? "bg-secondary font-medium"
                : "hover:bg-muted"
            }`}
          >
            <span>All items</span>
            <span className="text-xs text-muted-foreground">{getCount(null)}</span>
          </button>

          {collections.map((col) => (
            <button
              key={col.id}
              onClick={() => setActiveCollectionId(col.id)}
              className={`flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors text-left ${
                activeCollectionId === col.id
                  ? "bg-secondary font-medium"
                  : "hover:bg-muted"
              }`}
            >
              <span className="truncate">{col.name}</span>
              <span className="text-xs text-muted-foreground">{getCount(col.id)}</span>
            </button>
          ))}

          {/* Uncategorized */}
          <button
            onClick={() => setActiveCollectionId("uncategorized")}
            className={`flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors text-left ${
              activeCollectionId === "uncategorized"
                ? "bg-secondary font-medium"
                : "hover:bg-muted"
            }`}
          >
            <span className="text-muted-foreground">Uncategorized</span>
            <span className="text-xs text-muted-foreground">
              {items.filter((i) => !i.collection_id).length}
            </span>
          </button>
        </nav>
      </aside>

      {/* ── Main content ────────────────────────────── */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{activeLabel}</h1>
            <p className="text-muted-foreground mt-1">
              {filteredItems.length} {filteredItems.length === 1 ? "item" : "items"}
            </p>
          </div>
          <Button onClick={() => setAddItemOpen(true)}>Add item</Button>
        </div>

        {/* Mobile collection picker (shown on small screens) */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2 md:hidden">
          <Button
            variant={activeCollectionId === null ? "secondary" : "outline"}
            size="sm"
            onClick={() => setActiveCollectionId(null)}
          >
            All ({getCount(null)})
          </Button>
          {collections.map((col) => (
            <Button
              key={col.id}
              variant={activeCollectionId === col.id ? "secondary" : "outline"}
              size="sm"
              onClick={() => setActiveCollectionId(col.id)}
              className="whitespace-nowrap"
            >
              {col.name} ({getCount(col.id)})
            </Button>
          ))}
        </div>

        <div className="mt-6">
          <ItemGrid
            items={
              activeCollectionId === "uncategorized"
                ? items.filter((i) => !i.collection_id)
                : filteredItems
            }
            variant="owner"
            loading={loading}
            onDelete={handleDelete}
            emptyMessage={
              activeCollectionId === null
                ? "No items yet. Add your first one!"
                : "No items in this collection."
            }
          />
        </div>
      </div>

      {/* ── Dialogs ─────────────────────────────────── */}
      <AddItemDialog
        open={addItemOpen}
        onOpenChange={setAddItemOpen}
        collections={collections}
        defaultCollectionId={
          activeCollectionId && activeCollectionId !== "uncategorized"
            ? activeCollectionId
            : undefined
        }
        onItemAdded={fetchData}
      />

      <Dialog open={addCollectionOpen} onOpenChange={setAddCollectionOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New collection</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-2">
            <Input
              placeholder="e.g. Kitchen, Books, Baby Stuff"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateCollection()}
            />
            <Button
              onClick={handleCreateCollection}
              disabled={savingCollection || !newCollectionName.trim()}
            >
              {savingCollection ? "Creating..." : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}