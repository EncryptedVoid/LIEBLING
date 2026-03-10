"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Pencil, Trash2, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ItemGrid } from "@/components/item-grid";
import { AddItemDialog } from "@/components/add-item-dialog";
import { toast } from "sonner";

import type { Item, Collection } from "@/lib/types";

export default function WishlistPage() {
  const supabase = createClient();

  const [items, setItems] = useState<Item[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);

  const [addItemOpen, setAddItemOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  const [addCollectionOpen, setAddCollectionOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [savingCollection, setSavingCollection] = useState(false);

  const [editCollectionOpen, setEditCollectionOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [editCollectionName, setEditCollectionName] = useState("");
  const [savingEditCollection, setSavingEditCollection] = useState(false);

  const [deleteCollectionOpen, setDeleteCollectionOpen] = useState(false);
  const [deletingCollection, setDeletingCollection] = useState<Collection | null>(null);
  const [deletingCollectionLoading, setDeletingCollectionLoading] = useState(false);

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

  // ── Item helpers ──────────────────────────────────────
  const filteredItems =
    activeCollectionId === null
      ? items
      : items.filter((i) => i.collection_ids?.includes(activeCollectionId));

  function getCount(colId: string | null): number {
    if (colId === null) return items.length;
    return items.filter((i) => i.collection_ids?.includes(colId)).length;
  }

  function handleDeleteItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  function handleEditItem(item: Item) {
    setEditingItem(item);
    setAddItemOpen(true);
  }

  // ── Collection helpers ────────────────────────────────
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

  function openEditCollection(col: Collection) {
    setEditingCollection(col);
    setEditCollectionName(col.name);
    setEditCollectionOpen(true);
  }

  async function handleSaveEditCollection() {
    if (!editCollectionName.trim() || !editingCollection) return;
    setSavingEditCollection(true);

    const { error } = await supabase
      .from("collections")
      .update({ name: editCollectionName.trim() })
      .eq("id", editingCollection.id);

    if (error) {
      toast.error("Couldn't rename collection.");
    } else {
      toast.success("Collection renamed.");
      setEditCollectionOpen(false);
      setEditingCollection(null);
      fetchData();
    }
    setSavingEditCollection(false);
  }

  function openDeleteCollection(col: Collection) {
    setDeletingCollection(col);
    setDeleteCollectionOpen(true);
  }

  async function handleDeleteCollection() {
    if (!deletingCollection) return;
    setDeletingCollectionLoading(true);

    const { error } = await supabase
      .from("collections")
      .delete()
      .eq("id", deletingCollection.id);

    if (error) {
      toast.error("Couldn't delete collection.");
    } else {
      toast.success(`"${deletingCollection.name}" deleted.`);
      // If we were viewing the deleted collection, go back to all
      if (activeCollectionId === deletingCollection.id) {
        setActiveCollectionId(null);
      }
      setDeleteCollectionOpen(false);
      setDeletingCollection(null);
      fetchData();
    }
    setDeletingCollectionLoading(false);
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
                ? "bg-primary text-primary-foreground font-medium"
                : "hover:bg-muted"
            }`}
          >
            <span>All items</span>
            <span className={`text-xs ${activeCollectionId === null ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
              {getCount(null)}
            </span>
          </button>

          {/* Collection tabs with context menu */}
          {collections.map((col) => (
            <div
              key={col.id}
              className={`group flex items-center rounded-md transition-colors ${
                activeCollectionId === col.id
                  ? "bg-primary text-primary-foreground font-medium"
                  : "hover:bg-muted"
              }`}
            >
              <button
                onClick={() => setActiveCollectionId(col.id)}
                className="flex-1 flex items-center justify-between px-3 py-2 text-sm text-left min-w-0"
              >
                <span className="truncate">{col.name}</span>
                <span className={`text-xs shrink-0 ml-2 ${
                  activeCollectionId === col.id ? "text-primary-foreground/70" : "text-muted-foreground"
                }`}>
                  {getCount(col.id)}
                </span>
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 mr-1 rounded hover:bg-black/10 ${
                      activeCollectionId === col.id ? "hover:bg-white/20" : ""
                    }`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36">
                  <DropdownMenuItem onClick={() => openEditCollection(col)}>
                    <Pencil className="h-3.5 w-3.5 mr-2" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => openDeleteCollection(col)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
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

        {/* Mobile collection picker */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2 md:hidden">
          <Button
            variant={activeCollectionId === null ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveCollectionId(null)}
          >
            All ({getCount(null)})
          </Button>
          {collections.map((col) => (
            <Button
              key={col.id}
              variant={activeCollectionId === col.id ? "default" : "outline"}
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
            items={filteredItems}
            variant="owner"
            loading={loading}
            onDelete={handleDeleteItem}
            onEdit={handleEditItem}
            emptyMessage={
              activeCollectionId === null
                ? "No items yet. Add your first one!"
                : "No items in this collection."
            }
          />
        </div>
      </div>

      {/* ── Dialogs ─────────────────────────────────── */}

      {/* Add/Edit item */}
      <AddItemDialog
        open={addItemOpen}
        onOpenChange={(open) => {
          setAddItemOpen(open);
          if (!open) setEditingItem(null);
        }}
        collections={collections}
        defaultCollectionId={activeCollectionId ?? undefined}
        onItemAdded={fetchData}
        editingItem={editingItem}
      />

      {/* New collection */}
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

      {/* Rename collection */}
      <Dialog open={editCollectionOpen} onOpenChange={(open) => {
        setEditCollectionOpen(open);
        if (!open) setEditingCollection(null);
      }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename collection</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="editColName">Name</Label>
              <Input
                id="editColName"
                value={editCollectionName}
                onChange={(e) => setEditCollectionName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveEditCollection()}
              />
            </div>
            <Button
              onClick={handleSaveEditCollection}
              disabled={savingEditCollection || !editCollectionName.trim()}
            >
              {savingEditCollection ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete collection confirmation */}
      <AlertDialog open={deleteCollectionOpen} onOpenChange={(open) => {
        setDeleteCollectionOpen(open);
        if (!open) setDeletingCollection(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete &quot;{deletingCollection?.name}&quot;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This removes the collection. Items in it won&apos;t be deleted — they&apos;ll
              just no longer be in this collection.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCollection}
              disabled={deletingCollectionLoading}
            >
              {deletingCollectionLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}