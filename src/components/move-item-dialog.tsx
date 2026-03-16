"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Check, FolderOpen } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

import type { Item, Collection } from "@/lib/types";

type MoveItemDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Item | null;
  collections: Collection[];
  onMoved?: () => void;
};

export function MoveItemDialog({
  open,
  onOpenChange,
  item,
  collections,
  onMoved,
}: MoveItemDialogProps) {
  const supabase = createClient();
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Filter out system collections (Gifted) from selection
  const availableCollections = collections.filter((c) => !c.is_system);

  // Reset selection when dialog opens
  useEffect(() => {
    if (open && item) {
      // Pre-select collections the item is already in (excluding Gifted)
      const currentNonSystem = item.collection_ids?.filter(
        (id) => !collections.find((c) => c.id === id && c.is_system)
      ) ?? [];
      setSelectedCollectionIds(currentNonSystem);
    }
  }, [open, item, collections]);

  function toggleCollection(colId: string) {
    setSelectedCollectionIds((prev) =>
      prev.includes(colId)
        ? prev.filter((id) => id !== colId)
        : [...prev, colId]
    );
  }

  async function handleMove() {
    if (!item || selectedCollectionIds.length === 0) {
      toast.error("Please select at least one collection.");
      return;
    }

    setSaving(true);
    try {
      // Get the Gifted collection ID
      const giftedCol = collections.find((c) => c.is_system);

      // Remove from Gifted collection and add to selected collections
      // First, delete all current collection links
      await supabase
        .from("item_collections")
        .delete()
        .eq("item_id", item.id);

      // Add to selected collections only (not including Gifted)
      const links = selectedCollectionIds.map((cid) => ({
        item_id: item.id,
        collection_id: cid,
      }));

      const { error: linkErr } = await supabase
        .from("item_collections")
        .insert(links);

      if (linkErr) throw linkErr;

      toast.success(`Moved to ${selectedCollectionIds.length} collection${selectedCollectionIds.length > 1 ? "s" : ""}!`);
      onOpenChange(false);
      onMoved?.();
    } catch (err: any) {
      toast.error(err.message || "Couldn't move item.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-primary" />
            Move to Collection
          </DialogTitle>
          <DialogDescription>
            {item?.name && (
              <span>
                Choose where to move <strong>"{item.name}"</strong>.
                It will be removed from the Gifted collection.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-2">
          {availableCollections.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">
                No collections available.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Create a collection first to move items.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
                {availableCollections.map((col) => {
                  const isSelected = selectedCollectionIds.includes(col.id);
                  return (
                    <button
                      key={col.id}
                      onClick={() => toggleCollection(col.id)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all ${
                        isSelected
                          ? "bg-primary/10 ring-1 ring-primary/30"
                          : "hover:bg-muted/80"
                      }`}
                    >
                      <div
                        className={`flex items-center justify-center h-5 w-5 rounded border-2 transition-colors ${
                          isSelected
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-muted-foreground/30"
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {col.emoji && (
                          <span className="text-base">{col.emoji}</span>
                        )}
                        <span className="text-sm font-medium truncate">
                          {col.name}
                        </span>
                      </div>
                      {col.banner_url && (
                        <div className="h-8 w-12 rounded overflow-hidden shrink-0">
                          <img
                            src={col.banner_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {selectedCollectionIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 px-1">
                  <span className="text-xs text-muted-foreground">Selected:</span>
                  {selectedCollectionIds.map((id) => {
                    const col = availableCollections.find((c) => c.id === id);
                    return col ? (
                      <Badge key={id} variant="secondary" className="text-[10px]">
                        {col.emoji && <span className="mr-0.5">{col.emoji}</span>}
                        {col.name}
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}

              <Button
                onClick={handleMove}
                disabled={saving || selectedCollectionIds.length === 0}
                className="shadow-sm"
              >
                {saving
                  ? "Moving..."
                  : `Move to ${selectedCollectionIds.length} collection${selectedCollectionIds.length !== 1 ? "s" : ""}`}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}