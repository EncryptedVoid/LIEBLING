"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

import type { Collection } from "@/lib/types";

type AddItemDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collections: Collection[];
  defaultCollectionId?: string; // pre-select when opened from a collection/event page
  onItemAdded?: () => void;
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
}: AddItemDialogProps) {
  const supabase = createClient();

  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [collectionId, setCollectionId] = useState(defaultCollectionId ?? "none");

  const [scraping, setScraping] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── Step 1: Paste URL and scrape metadata ──────────────
  async function handleScrape() {
    if (!url.trim()) return;
    setScraping(true);

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!res.ok) throw new Error("Scrape failed");

      const data: ScrapedData = await res.json();

      // Auto-fill fields — user can override any of these
      if (data.title) setName(data.title);
      if (data.image) setImageUrl(data.image);
      if (data.price) setPrice(data.price);

      toast.success("Got item details from the link.");
    } catch {
      toast.error("Couldn't fetch details. Fill them in manually.");
    } finally {
      setScraping(false);
    }
  }

  // ── Step 2: Save item ──────────────────────────────────
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

    // Get current user id for the insert
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error("You must be logged in.");
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("items").insert({
      user_id: user.id,
      name: name.trim(),
      link: url.trim(),
      price: price ? parseFloat(price) : null,
      image_url: imageUrl.trim() || null,
      collection_id: collectionId !== "none" ? collectionId : null,
    });

    if (error) {
      toast.error("Couldn't save item.");
    } else {
      toast.success(`"${name}" added.`);
      resetForm();
      onOpenChange(false);
      onItemAdded?.();
    }

    setSaving(false);
  }

  function resetForm() {
    setUrl("");
    setName("");
    setPrice("");
    setImageUrl("");
    setCollectionId(defaultCollectionId ?? "none");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add an item</DialogTitle>
          <DialogDescription>
            Paste a link and we'll try to fill in the details.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-2">
          {/* URL input + scrape button */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="url">Link</Label>
            <div className="flex gap-2">
              <Input
                id="url"
                type="url"
                placeholder="https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={handleScrape}
                disabled={scraping || !url.trim()}
              >
                {scraping ? "Fetching..." : "Fetch"}
              </Button>
            </div>
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

          {/* Image URL (auto-filled, but editable) */}
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

          {/* Collection picker */}
          <div className="flex flex-col gap-1.5">
            <Label>Collection</Label>
            <Select value={collectionId} onValueChange={setCollectionId}>
              <SelectTrigger>
                <SelectValue placeholder="No collection" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No collection</SelectItem>
                {collections.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Image preview */}
          {imageUrl && (
            <div className="rounded-md overflow-hidden border bg-muted aspect-video">
              <img
                src={imageUrl}
                alt="Preview"
                className="object-cover w-full h-full"
              />
            </div>
          )}

          {/* Save */}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Add item"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}