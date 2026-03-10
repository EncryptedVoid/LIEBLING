"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Check } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";

import type { Collection, Item } from "@/lib/types";

type AddItemDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collections: Collection[];
  defaultCollectionId?: string;
  onItemAdded?: () => void;
  editingItem?: Item | null;
};

type ScrapedData = {
  title: string | null;
  image: string | null;
  price: string | null;
};

export function AddItemDialog({
  open,
  onOpenChange,
  collections,
  defaultCollectionId,
  onItemAdded,
  editingItem,
}: AddItemDialogProps) {
  const supabase = createClient();

  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([]);

  const [scraping, setScraping] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scraped, setScraped] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const isEditing = !!editingItem;

  // Populate form when editing
  useEffect(() => {
    if (editingItem) {
      setUrl(editingItem.link);
      setName(editingItem.name);
      setPrice(editingItem.price ? String(editingItem.price) : "");
      setImageUrl(editingItem.image_url ?? "");
      setSelectedCollectionIds(editingItem.collection_ids ?? []);
      setScraped(true);
    } else {
      resetForm();
    }
  }, [editingItem, open]);

  // ── Auto-fetch when URL changes ────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = url.trim();
    if (!trimmed || scraped) return;

    try {
      new URL(trimmed);
    } catch {
      return;
    }

    debounceRef.current = setTimeout(() => {
      handleScrape(trimmed);
    }, 600);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [url]);

  async function handleScrape(targetUrl: string) {
    setScraping(true);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl }),
      });
      if (!res.ok) throw new Error("Scrape failed");
      const data: ScrapedData = await res.json();
      if (data.title) setName(data.title);
      if (data.image) setImageUrl(data.image);
      if (data.price) setPrice(data.price);
      setScraped(true);
      toast.success("Got item details from the link.");
    } catch {
      toast.error("Couldn't fetch details. Fill them in manually.");
    } finally {
      setScraping(false);
    }
  }

  // ── Toggle a collection on/off ─────────────────────────
  function toggleCollection(colId: string) {
    setSelectedCollectionIds((prev) =>
      prev.includes(colId)
        ? prev.filter((id) => id !== colId)
        : [...prev, colId]
    );
  }

  // ── Save item (create or update) ───────────────────────
  async function handleSave() {
    if (!name.trim()) {
      toast.error("Item needs a name.");
      return;
    }
    if (!url.trim()) {
      toast.error("Item needs a link.");
      return;
    }

    setSaving(true);

    const itemData = {
      name: name.trim(),
      link: url.trim(),
      price: price ? parseFloat(price) : null,
      image_url: imageUrl.trim() || null,
    };

    try {
      if (isEditing) {
        // Update item fields
        const { error } = await supabase
          .from("items")
          .update(itemData)
          .eq("id", editingItem!.id);
        if (error) throw error;

        // Replace collection links: delete old, insert new
        await supabase
          .from("item_collections")
          .delete()
          .eq("item_id", editingItem!.id);

        if (selectedCollectionIds.length > 0) {
          const { error: linkErr } = await supabase
            .from("item_collections")
            .insert(
              selectedCollectionIds.map((cid) => ({
                item_id: editingItem!.id,
                collection_id: cid,
              }))
            );
          if (linkErr) throw linkErr;
        }

        toast.success(`"${name}" updated.`);
      } else {
        // Create new item
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          toast.error("You must be logged in.");
          setSaving(false);
          return;
        }

        const { data: newItem, error } = await supabase
          .from("items")
          .insert({ user_id: user.id, ...itemData })
          .select("id")
          .single();
        if (error) throw error;

        // Insert collection links
        if (selectedCollectionIds.length > 0) {
          const { error: linkErr } = await supabase
            .from("item_collections")
            .insert(
              selectedCollectionIds.map((cid) => ({
                item_id: newItem.id,
                collection_id: cid,
              }))
            );
          if (linkErr) throw linkErr;
        }

        toast.success(`"${name}" added.`);
      }

      resetForm();
      onOpenChange(false);
      onItemAdded?.();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setUrl("");
    setName("");
    setPrice("");
    setImageUrl("");
    setSelectedCollectionIds(defaultCollectionId ? [defaultCollectionId] : []);
    setScraped(false);
  }

  // Collection names for the trigger label
  const selectedNames = collections
    .filter((c) => selectedCollectionIds.includes(c.id))
    .map((c) => c.name);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit item" : "Add an item"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the details for this item."
              : "Paste a link and we'll try to fill in the details."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-2">
          {/* URL input — auto-fetches on paste/type */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="url">Link</Label>
            <div className="relative">
              <Input
                id="url"
                type="url"
                placeholder="Paste a product link..."
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setScraped(false);
                }}
              />
              {scraping && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="h-4 w-4 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
                </div>
              )}
            </div>
            {scraping && (
              <p className="text-xs text-muted-foreground">Fetching details...</p>
            )}
          </div>

          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Item name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Price */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>

          {/* Image URL */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input
              id="imageUrl"
              type="url"
              placeholder="https://..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>

          {/* Collection multi-select */}
          <div className="flex flex-col gap-1.5">
            <Label>Collections</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="justify-start font-normal h-auto min-h-10"
                >
                  {selectedNames.length === 0 ? (
                    <span className="text-muted-foreground">
                      Choose collections...
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {selectedNames.map((name) => (
                        <Badge key={name} variant="secondary" className="text-xs">
                          {name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2" align="start">
                {collections.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-3">
                    No collections yet.
                  </p>
                ) : (
                  <div className="flex flex-col gap-0.5">
                    {collections.map((col) => {
                      const isSelected = selectedCollectionIds.includes(col.id);
                      return (
                        <button
                          key={col.id}
                          onClick={() => toggleCollection(col.id)}
                          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted transition-colors text-left"
                        >
                          <div
                            className={`flex items-center justify-center h-4 w-4 rounded border transition-colors ${
                              isSelected
                                ? "bg-primary border-primary text-primary-foreground"
                                : "border-muted-foreground/30"
                            }`}
                          >
                            {isSelected && <Check className="h-3 w-3" />}
                          </div>
                          {col.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>

          {/* Image preview */}
          {imageUrl && (
            <div className="rounded-md overflow-hidden border bg-muted aspect-video">
              <img
                src={imageUrl}
                alt="Preview"
                className="object-contain w-full h-full p-2"
              />
            </div>
          )}

          {/* Save */}
          <Button onClick={handleSave} disabled={saving}>
            {saving
              ? isEditing ? "Saving..." : "Adding..."
              : isEditing ? "Save changes" : "Add item"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}