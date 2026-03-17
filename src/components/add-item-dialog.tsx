"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Check, Plus, ShoppingBag, ChevronDown, ChevronUp, Sparkles, AlertCircle } from "lucide-react";

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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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

type ScrapeStatus = "idle" | "scraping" | "success" | "partial" | "failed";

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

  const [scrapeStatus, setScrapeStatus] = useState<ScrapeStatus>("idle");
  const [scrapedFields, setScrapedFields] = useState<{ name: boolean; price: boolean; image: boolean }>({
    name: false,
    price: false,
    image: false,
  });
  const [showAllFields, setShowAllFields] = useState(false);
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Inline new collection
  const [newColName, setNewColName] = useState("");
  const [creatingCol, setCreatingCol] = useState(false);
  const [localCollections, setLocalCollections] = useState<Collection[]>([]);

  const isEditing = !!editingItem;

  // Sync collections prop — exclude system collections from manual selection
  useEffect(() => {
    setLocalCollections(collections.filter((c) => !c.is_system));
  }, [collections]);

  useEffect(() => {
    if (editingItem) {
      setUrl(editingItem.link);
      setName(editingItem.name);
      setPrice(editingItem.price ? String(editingItem.price) : "");
      setImageUrl(editingItem.image_url ?? "");
      setSelectedCollectionIds(editingItem.collection_ids ?? []);
      setScrapeStatus("success");
      setScrapedFields({ name: true, price: true, image: true });
      setShowAllFields(true); // Show all fields when editing
    } else {
      resetForm();
    }
  }, [editingItem, open]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = url.trim();
    if (!trimmed || scrapeStatus !== "idle") return;
    try { new URL(trimmed); } catch { return; }
    debounceRef.current = setTimeout(() => handleScrape(trimmed), 600);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [url]);

  async function handleScrape(targetUrl: string) {
    setScrapeStatus("scraping");
    try {
      const res = await fetch("/api/scrape", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: targetUrl }) });
      if (!res.ok) throw new Error("Scrape failed");
      const data: ScrapedData = await res.json();

      const foundFields = {
        name: !!data.title,
        price: !!data.price,
        image: !!data.image,
      };

      if (data.title) setName(data.title);
      if (data.image) setImageUrl(data.image);
      if (data.price) setPrice(data.price);

      setScrapedFields(foundFields);

      const allFound = foundFields.name && foundFields.price && foundFields.image;
      const noneFound = !foundFields.name && !foundFields.price && !foundFields.image;

      if (allFound) {
        setScrapeStatus("success");
        toast.success("✨ Got all item details from the link!");
      } else if (noneFound) {
        setScrapeStatus("failed");
        setShowAllFields(true);
        toast.error("Couldn't fetch details. Fill them in manually.");
      } else {
        setScrapeStatus("partial");
        setShowAllFields(true);
        const missing = [];
        if (!foundFields.name) missing.push("name");
        if (!foundFields.price) missing.push("price");
        if (!foundFields.image) missing.push("image");
        toast.info(`Got some details! Please add: ${missing.join(", ")}`);
      }
    } catch {
      setScrapeStatus("failed");
      setShowAllFields(true);
      toast.error("Couldn't fetch details. Fill them in manually.");
    }
  }

  function toggleCollection(colId: string) {
    setSelectedCollectionIds((prev) => prev.includes(colId) ? prev.filter((id) => id !== colId) : [...prev, colId]);
  }

  async function handleCreateInlineCollection() {
    if (!newColName.trim()) return;
    setCreatingCol(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setCreatingCol(false); return; }

    const { data, error } = await supabase.from("collections").insert({ user_id: user.id, name: newColName.trim() }).select("*").single();
    if (error) {
      toast.error("Couldn't create collection.");
    } else {
      setLocalCollections((prev) => [...prev, data]);
      setSelectedCollectionIds((prev) => [...prev, data.id]);
      setNewColName("");
      toast.success(`"${data.name}" created and selected.`);
    }
    setCreatingCol(false);
  }

  async function handleSave() {
    if (!name.trim()) { toast.error("Item needs a name."); return; }
    if (!url.trim()) { toast.error("Item needs a link."); return; }

    // Duplicate check
    if (!isEditing) {
      const { data: existing } = await supabase.from("items").select("id").eq("link", url.trim()).eq("user_id", (await supabase.auth.getUser()).data.user!.id).limit(1);
      if (existing && existing.length > 0) {
        toast.error("You already have an item with this link.");
        return;
      }
    }

    setSaving(true);
    const itemData = { name: name.trim(), link: url.trim(), price: price ? parseFloat(price) : null, image_url: imageUrl.trim() || null };
    try {
      if (isEditing) {
        const { error } = await supabase.from("items").update(itemData).eq("id", editingItem!.id);
        if (error) throw error;
        await supabase.from("item_collections").delete().eq("item_id", editingItem!.id);
        if (selectedCollectionIds.length > 0) {
          const { error: linkErr } = await supabase.from("item_collections").insert(selectedCollectionIds.map((cid) => ({ item_id: editingItem!.id, collection_id: cid })));
          if (linkErr) throw linkErr;
        }
        toast.success(`"${name}" updated.`);
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { toast.error("You must be logged in."); setSaving(false); return; }
        const { data: newItem, error } = await supabase.from("items").insert({ user_id: user.id, ...itemData }).select("id").single();
        if (error) throw error;
        if (selectedCollectionIds.length > 0) {
          const { error: linkErr } = await supabase.from("item_collections").insert(selectedCollectionIds.map((cid) => ({ item_id: newItem.id, collection_id: cid })));
          if (linkErr) throw linkErr;
        }
        toast.success(`"${name}" added.`);
      }
      resetForm();
      onOpenChange(false);
      onItemAdded?.();
    } catch (err: any) { toast.error(err.message || "Something went wrong."); }
    finally { setSaving(false); }
  }

  function resetForm() {
    setUrl(""); setName(""); setPrice(""); setImageUrl("");
    setSelectedCollectionIds(defaultCollectionId ? [defaultCollectionId] : []);
    setScrapeStatus("idle");
    setScrapedFields({ name: false, price: false, image: false });
    setShowAllFields(false);
    setNewColName("");
  }

  const selectedNames = localCollections.filter((c) => selectedCollectionIds.includes(c.id)).map((c) => c.name);

  // Determine which fields need to be shown
  const needsManualEntry = scrapeStatus === "partial" || scrapeStatus === "failed" || showAllFields;
  const showNameField = needsManualEntry && (!scrapedFields.name || showAllFields);
  const showPriceField = needsManualEntry && (!scrapedFields.price || showAllFields);
  const showImageField = needsManualEntry && (!scrapedFields.image || showAllFields);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl rounded-2xl bg-background/95 backdrop-blur-2xl border border-border/50 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading">{isEditing ? "Edit item" : "Add an item"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update the details for this item." : "Paste a link and we'll try to fill in the details automatically."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-5 mt-2">
          {/* Left: Fields */}
          <div className="flex-1 flex flex-col gap-3.5 min-w-0">
            {/* URL - Always visible */}
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
                    setScrapeStatus("idle");
                    setScrapedFields({ name: false, price: false, image: false });
                  }}
                />
                {scrapeStatus === "scraping" && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="h-4 w-4 rounded-full animate-spin" style={{ border: '2px solid var(--glass-border)', borderTopColor: 'var(--gradient-from)' }} />
                  </div>
                )}
              </div>
              {scrapeStatus === "scraping" && (
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Sparkles className="h-3 w-3 animate-pulse" />
                  Fetching details...
                </p>
              )}
              {scrapeStatus === "success" && !showAllFields && (
                <p className="text-[11px] text-green-600 dark:text-green-400 flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  All details found! Ready to add.
                </p>
              )}
              {scrapeStatus === "partial" && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Some details found. Please fill in the rest below.
                </p>
              )}
            </div>

            {/* Collections - Always visible */}
            <div className="flex flex-col gap-1.5">
              <Label>Collections</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start font-normal h-auto min-h-7">
                    {selectedNames.length === 0 ? (
                      <span className="text-muted-foreground">Choose collections...</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {selectedNames.map((n) => (
                          <Badge key={n} variant="secondary" className="text-[10px]">{n}</Badge>
                        ))}
                      </div>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2" align="start">
                  {localCollections.length === 0 && !newColName && (
                    <p className="text-[11px] text-muted-foreground text-center py-2">No collections yet.</p>
                  )}
                  <div className="flex flex-col gap-0.5 max-h-40 overflow-y-auto">
                    {localCollections.map((col) => {
                      const isSelected = selectedCollectionIds.includes(col.id);
                      return (
                        <button key={col.id} onClick={() => toggleCollection(col.id)} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted transition-colors text-left">
                          <div className={`flex items-center justify-center h-4 w-4 rounded border transition-colors ${isSelected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30"}`}>
                            {isSelected && <Check className="h-3 w-3" />}
                          </div>
                          {col.emoji && <span>{col.emoji}</span>}
                          {col.name}
                        </button>
                      );
                    })}
                  </div>
                  {/* Inline create */}
                  <div className="mt-2 pt-2 border-t flex gap-1.5">
                    <Input
                      placeholder="New collection..."
                      className="h-6 text-[11px]"
                      value={newColName}
                      onChange={(e) => setNewColName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCreateInlineCollection()}
                    />
                    <Button
                      size="icon-xs"
                      disabled={!newColName.trim() || creatingCol}
                      onClick={handleCreateInlineCollection}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Success state - show toggle to reveal fields */}
            {scrapeStatus === "success" && !showAllFields && (
              <Button
                variant="ghost"
                size="sm"
                className="justify-start text-muted-foreground"
                onClick={() => setShowAllFields(true)}
              >
                <ChevronDown className="h-3 w-3 mr-1.5" />
                Show all fields to edit
              </Button>
            )}

            {/* Collapsible fields section */}
            {(needsManualEntry || showAllFields) && (
              <div className="flex flex-col gap-3.5 animate-in fade-in-50 slide-in-from-top-2 duration-200">
                {showAllFields && scrapeStatus === "success" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start text-muted-foreground"
                    onClick={() => setShowAllFields(false)}
                  >
                    <ChevronUp className="h-3 w-3 mr-1.5" />
                    Hide fields
                  </Button>
                )}

                {/* Name */}
                {(showNameField || isEditing) && (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="name">
                      Name
                      {!scrapedFields.name && scrapeStatus !== "idle" && (
                        <Badge variant="outline" className="ml-2 text-[9px]">Required</Badge>
                      )}
                    </Label>
                    <Input id="name" placeholder="Item name" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                )}

                {/* Price */}
                {(showPriceField || isEditing) && (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="price">Price</Label>
                    <Input id="price" type="number" step="0.01" placeholder="0.00" value={price} onChange={(e) => setPrice(e.target.value)} />
                  </div>
                )}

                {/* Image URL */}
                {(showImageField || isEditing) && (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="imageUrl">Image URL</Label>
                    <Input id="imageUrl" type="url" placeholder="https://..." value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
                  </div>
                )}
              </div>
            )}

            <Button onClick={handleSave} disabled={saving || !url.trim() || !name.trim()} className="mt-1 btn-gradient rounded-xl shadow-lg">
              {saving ? (isEditing ? "Saving..." : "Adding...") : (isEditing ? "Save changes" : "Add item")}
            </Button>
          </div>

          {/* Right: Preview - Always visible */}
          <div className="hidden sm:flex w-48 shrink-0 flex-col items-center justify-start">
            <p className="text-[10px] text-muted-foreground mb-2">Preview</p>
            <div className="w-full rounded-2xl overflow-hidden glass-card">
              <div className="aspect-square bg-muted/30 flex items-center justify-center overflow-hidden">
                {imageUrl ? (
                  <img src={imageUrl} alt="Preview" className="object-contain w-full h-full p-3" />
                ) : (
                  <div className="flex flex-col items-center gap-1.5 text-muted-foreground/30">
                    <ShoppingBag className="h-8 w-8" />
                    <span className="text-[10px]">No image</span>
                  </div>
                )}
              </div>
              <div className="p-2.5">
                {price && (
                  <p className="text-sm font-bold gradient-text font-mono mb-0.5">
                    ${parseFloat(price || "0").toFixed(2)}
                  </p>
                )}
                <p className="text-[11px] font-medium leading-snug line-clamp-2 text-foreground/70">
                  {name || "Item name"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}