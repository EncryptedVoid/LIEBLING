"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Pencil, Trash2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { toast } from "sonner";

import type { Item } from "@/lib/types";

type ItemCardProps =
  | {
      item: Item;
      variant: "owner";
      onDelete?: (id: string) => void;
      onEdit?: (item: Item) => void;
    }
  | {
      item: Item;
      variant: "friend";
      currentUserId: string;
      onClaimChange?: () => void;
    };

export function ItemCard(props: ItemCardProps) {
  const { item, variant } = props;
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // ── Owner actions ──────────────────────────────────────
  async function handleDelete() {
    if (variant !== "owner") return;
    setLoading(true);
    const { error } = await supabase.from("items").delete().eq("id", item.id);
    if (error) {
      toast.error("Couldn't delete item.");
    } else {
      toast.success("Item deleted.");
      props.onDelete?.(item.id);
    }
    setLoading(false);
    setShowDeleteDialog(false);
  }

  // ── Friend actions ─────────────────────────────────────
  async function handleClaim() {
    if (variant !== "friend") return;
    setLoading(true);
    const { error } = await supabase.rpc("claim_item", { item_id: item.id });
    if (error) {
      toast.error(
        error.message.includes("already claimed")
          ? "Someone just claimed this!"
          : "Couldn't claim item."
      );
    } else {
      toast.success("Claimed! They won't see who it's from.");
      props.onClaimChange?.();
    }
    setLoading(false);
  }

  async function handleUnclaim() {
    if (variant !== "friend") return;
    setLoading(true);
    const { error } = await supabase.rpc("unclaim_item", { item_id: item.id });
    if (error) {
      toast.error("Couldn't unclaim item.");
    } else {
      toast.success("Unclaimed.");
      props.onClaimChange?.();
    }
    setLoading(false);
  }

  // ── Derived state ──────────────────────────────────────
  const isClaimedByMe =
    variant === "friend" && item.claimed_by === props.currentUserId;
  const isClaimedByOther =
    variant === "friend" && item.is_claimed && !isClaimedByMe;

  function handleCardClick() {
    window.open(item.link, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      <Card className="overflow-hidden group transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:border-primary/40">
        {/* Clickable area — image + info */}
        <div
          onClick={handleCardClick}
          className="cursor-pointer"
        >
          {/* Image with padding */}
          <div className="p-3 pb-0">
            <div className="aspect-video bg-muted rounded-lg relative overflow-hidden">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="object-contain w-full h-full p-2"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  No image
                </div>
              )}

              {/* Claimed overlay for friends */}
              {variant === "friend" && item.is_claimed && (
                <div className="absolute inset-0 bg-background/60 flex items-center justify-center rounded-lg">
                  <Badge variant={isClaimedByMe ? "default" : "secondary"}>
                    {isClaimedByMe ? "You claimed this" : "Claimed"}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Name + price */}
          <CardContent className="p-4 pb-2">
            <h3 className="font-medium text-sm truncate">{item.name}</h3>
            {item.price && (
              <p className="text-sm text-muted-foreground mt-0.5">
                ${item.price.toFixed(2)}
              </p>
            )}
          </CardContent>
        </div>

        {/* Actions — NOT part of the clickable redirect area */}
        <div className="px-4 pb-4 pt-1">
          {variant === "owner" && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5"
                onClick={(e) => {
                  e.stopPropagation();
                  props.onEdit?.(item);
                }}
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteDialog(true);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            </div>
          )}

          {variant === "friend" && !item.is_claimed && (
            <Button
              size="sm"
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                handleClaim();
              }}
              disabled={loading}
            >
              {loading ? "Claiming..." : "Claim this item"}
            </Button>
          )}

          {variant === "friend" && isClaimedByMe && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                handleUnclaim();
              }}
              disabled={loading}
            >
              {loading ? "Unclaiming..." : "Unclaim"}
            </Button>
          )}
        </div>
      </Card>

      {/* Delete confirmation (owner only) */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{item.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This item may have been claimed by a friend. Deleting it can&apos;t be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={loading}>
              {loading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}