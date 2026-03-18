"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Link2,
  Layers,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Check,
  Plus,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { Collection } from "@/lib/types";

type MassAddItemDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collections: Collection[];
  defaultCollectionId?: string;
  onItemsAdded?: () => void;
};

export function MassAddItemDialog({
  open,
  onOpenChange,
  collections,
  defaultCollectionId,
  onItemsAdded,
}: MassAddItemDialogProps) {
  const supabase = createClient();
  const [urlsText, setUrlsText] = useState("");
  const [status, setStatus] = useState<"idle" | "processing" | "done">("idle");
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState<
  { url: string; success: boolean; name?: string }[]
  >([]);

  // Collection selection
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>(
    []
  );
  const availableCollections = collections.filter((c) => !c.is_system);

  // Reset collection selection when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedCollectionIds(
        defaultCollectionId ? [defaultCollectionId] : []
      );
    }
  }, [open, defaultCollectionId]);

  function toggleCollection(colId: string) {
    setSelectedCollectionIds((prev) =>
      prev.includes(colId)
        ? prev.filter((id) => id !== colId)
        : [...prev, colId]
    );
  }

  const selectedNames = availableCollections
    .filter((c) => selectedCollectionIds.includes(c.id))
    .map((c) => c.name);

  async function handleMassAdd() {
    const lines = urlsText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l !== "");
    if (lines.length === 0) {
      toast.error("Please enter at least one URL.");
      return;
    }

    setStatus("processing");
    setProgress({ current: 0, total: lines.length });
    setResults([]);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in.");
      setStatus("idle");
      return;
    }

    let successCount = 0;
    const currentResults: { url: string; success: boolean; name?: string }[] =
      [];

    for (let i = 0; i < lines.length; i++) {
      const targetUrl = lines[i];

      try {
        // Check for duplicate
        const { data: existing } = await supabase
          .from("items")
          .select("id")
          .eq("link", targetUrl)
          .eq("user_id", user.id)
          .limit(1);

        if (existing && existing.length > 0) {
          currentResults.push({
            url: targetUrl,
            success: false,
            name: "Duplicate URL",
          });
        } else {
          // Scrape
          const res = await fetch("/api/scrape", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: targetUrl }),
          });

          if (!res.ok) throw new Error("Scrape failed");
          const data = await res.json();

          const itemName = data.title || targetUrl;
          const itemPrice = data.price ? parseFloat(data.price) : null;
          const itemImage = data.image || null;

          // Insert item
          const { data: newItem, error } = await supabase
            .from("items")
            .insert({
              user_id: user.id,
              name: itemName,
              link: targetUrl,
              price: itemPrice,
              image_url: itemImage,
            })
            .select("id")
            .single();

          if (error) throw error;

          // Link to ALL selected collections
          if (selectedCollectionIds.length > 0) {
            const links = selectedCollectionIds.map((cid) => ({
              item_id: newItem.id,
              collection_id: cid,
            }));
            await supabase.from("item_collections").insert(links);
          }

          successCount++;
          currentResults.push({
            url: targetUrl,
            success: true,
            name: itemName,
          });
        }
      } catch (err) {
        currentResults.push({ url: targetUrl, success: false });
      }

      setProgress({ current: i + 1, total: lines.length });
      setResults([...currentResults]);
    }

    if (successCount > 0) {
      toast.success(`Successfully added ${successCount} items!`);
      onItemsAdded?.();
    } else {
      toast.error("Failed to add any items.");
    }

    setStatus("done");
  }

  function handleClose() {
    setUrlsText("");
    setStatus("idle");
    setProgress({ current: 0, total: 0 });
    setResults([]);
    setSelectedCollectionIds([]);
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={status === "processing" ? undefined : handleClose}
    >
      <DialogContent className="sm:max-w-xl rounded-2xl bg-background/95 backdrop-blur-2xl border border-border/50 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Mass Add Items
          </DialogTitle>
          <DialogDescription>
            Paste multiple URLs (one per line). We'll automatically fetch
            details and add them to your selected collections.
          </DialogDescription>
        </DialogHeader>

        {status === "idle" ? (
          <div className="flex flex-col gap-4 mt-2">
            {/* Collection picker */}
            <div className="flex flex-col gap-1.5">
              <Label>Add to Collections</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="justify-start font-normal h-auto min-h-7"
                  >
                    {selectedNames.length === 0 ? (
                      <span className="text-muted-foreground">
                        Choose collections (optional)...
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {selectedNames.map((n) => (
                          <Badge
                            key={n}
                            variant="secondary"
                            className="text-[10px]"
                          >
                            {n}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2" align="start">
                  {availableCollections.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground text-center py-2">
                      No collections yet.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-0.5 max-h-40 overflow-y-auto">
                      {availableCollections.map((col) => {
                        const isSelected = selectedCollectionIds.includes(
                          col.id
                        );
                        return (
                          <button
                            key={col.id}
                            onClick={() => toggleCollection(col.id)}
                            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted transition-colors text-left"
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
                            {col.emoji && <span>{col.emoji}</span>}
                            {col.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </PopoverContent>
              </Popover>
              <p className="text-[10px] text-muted-foreground">
                All items will be added to these collections. Leave empty for
                "All Items" only.
              </p>
            </div>

            {/* URL input */}
            <Textarea
              placeholder={
                "https://amazon.com/item1\nhttps://target.com/item2\nhttps://etsy.com/item3"
              }
              className="min-h-[180px] resize-none font-mono text-xs rounded-xl border-border/50 bg-muted/20"
              value={urlsText}
              onChange={(e) => setUrlsText(e.target.value)}
            />

            <Button
              onClick={handleMassAdd}
              disabled={!urlsText.trim()}
              className="w-full btn-gradient rounded-xl shadow-lg mt-2 h-12 text-base font-semibold"
            >
              Start Adding Items
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-6 mt-4">
            <div className="flex flex-col items-center justify-center py-6 text-center">
              {status === "processing" ? (
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 relative">
                  <div className="absolute -inset-1 rounded-full animate-spin border-4 border-transparent border-t-primary" />
                  <Loader2 className="h-8 w-8 text-primary animate-pulse" />
                </div>
              ) : (
                <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4 shadow-sm border border-green-500/20">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
              )}

              <h3 className="text-xl font-heading font-bold">
                {status === "processing"
                  ? "Processing items..."
                  : "Mass add complete!"}
              </h3>
              <p className="text-muted-foreground mt-1">
                {progress.current} of {progress.total} URLs processed
              </p>
            </div>

            <div className="bg-muted/30 rounded-xl border border-border/40 p-4 max-h-[200px] overflow-y-auto space-y-2 scrollbar-thin">
              {results.map((r, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-2 rounded-lg bg-background/50 border border-border/50"
                >
                  {r.success ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {r.success
                        ? r.name || "Item added"
                        : r.name || "Failed to add"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate font-mono mt-0.5">
                      {r.url}
                    </p>
                  </div>
                </div>
              ))}

              {status === "processing" &&
                progress.current < progress.total && (
                  <div className="flex items-center gap-3 p-2">
                    <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
                    <p className="text-sm text-muted-foreground animate-pulse">
                      Scraping next URL...
                    </p>
                  </div>
                )}
            </div>

            {status === "done" && (
              <Button
                onClick={handleClose}
                className="w-full h-12 rounded-xl"
                variant="outline"
              >
                Done
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}