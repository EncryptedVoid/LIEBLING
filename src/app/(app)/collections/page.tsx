"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CollectionCard } from "@/components/collection-card";
import { toast } from "sonner";

type CollectionWithMeta = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  item_count: number;
  preview_images: string[];
};

export default function CollectionsPage() {
  const supabase = createClient();
  const [collections, setCollections] = useState<CollectionWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  async function fetchCollections() {
    setLoading(true);

    // Fetch collections with item count and preview images
    const { data: cols } = await supabase
      .from("collections")
      .select("*")
      .order("name");

    if (!cols) {
      setLoading(false);
      return;
    }

    // For each collection, get item count and first 3 images
    const enriched = await Promise.all(
      cols.map(async (col) => {
        const { count } = await supabase
          .from("items")
          .select("*", { count: "exact", head: true })
          .eq("collection_id", col.id);

        const { data: previewItems } = await supabase
          .from("items")
          .select("image_url")
          .eq("collection_id", col.id)
          .not("image_url", "is", null)
          .limit(3);

        return {
          ...col,
          item_count: count ?? 0,
          preview_images: (previewItems ?? []).map((i) => i.image_url!),
        };
      })
    );

    setCollections(enriched);
    setLoading(false);
  }

  useEffect(() => {
    fetchCollections();
  }, []);

  async function handleCreate() {
    if (!newName.trim()) return;
    setSaving(true);
    const { error } = await supabase
      .from("collections")
      .insert({ name: newName.trim() });
    if (error) {
      toast.error("Couldn't create collection.");
    } else {
      toast.success(`"${newName.trim()}" created.`);
      setNewName("");
      setDialogOpen(false);
      fetchCollections();
    }
    setSaving(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Collections</h1>
          <p className="text-muted-foreground mt-1">
            Organize your items into groups.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>New collection</Button>
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-40 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : collections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-muted-foreground">
              No collections yet. Create one to organize your items.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {collections.map((col) => (
              <CollectionCard key={col.id} collection={col} />
            ))}
          </div>
        )}
      </div>

      {/* New collection dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New collection</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="collectionName">Name</Label>
              <Input
                id="collectionName"
                placeholder="e.g. Kitchen, Books, Baby Stuff"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
            </div>
            <Button onClick={handleCreate} disabled={saving || !newName.trim()}>
              {saving ? "Creating..." : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}