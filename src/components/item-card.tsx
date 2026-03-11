"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Pencil, Trash2, ExternalLink, ShoppingBag } from "lucide-react";

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

  const isClaimedByMe =
    variant === "friend" && item.claimed_by === props.currentUserId;
  const isClaimedByOther =
    variant === "friend" && item.is_claimed && !isClaimedByMe;

  function handleCardClick() {
    window.open(item.link, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      <Card className="overflow-hidden group transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1.5 hover:border-primary/30 relative">
        {/* Gradient accent line at top */}
        <div className="h-0.5 bg-gradient-to-r from-primary/60 via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div onClick={handleCardClick} className="cursor-pointer">
          {/* Image */}
          <div className="p-3 pb-0">
            <div className="aspect-[4/3] bg-muted/50 rounded-xl relative overflow-hidden">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="object-contain w-full h-full p-3 transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                  <ShoppingBag className="h-8 w-8 opacity-30" />
                  <span className="text-[10px] opacity-50">No image</span>
                </div>
              )}

              {/* External link icon on hover */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">
                <div className="h-7 w-7 rounded-full bg-background/90 backdrop-blur-sm shadow-sm flex items-center justify-center">
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </div>
              </div>

              {/* Claimed overlay */}
              {variant === "friend" && item.is_claimed && (
                <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px] flex items-center justify-center rounded-xl">
                  <Badge
                    variant={isClaimedByMe ? "default" : "secondary"}
                    className="shadow-sm"
                  >
                    {isClaimedByMe ? "You claimed this" : "Claimed"}
                  </Badge>
                </div>
              )}

              {/* Price tag */}
              {item.price && (
                <div className="absolute bottom-2 left-2">
                  <Badge
                    variant="secondary"
                    className="bg-background/90 backdrop-blur-sm shadow-sm font-mono"
                  >
                    ${item.price.toFixed(2)}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Name */}
          <CardContent className="p-3 pt-2.5">
            <h3 className="font-medium text-xs leading-snug line-clamp-2 group-hover:text-primary transition-colors duration-200">
              {item.name}
            </h3>
          </CardContent>
        </div>

        {/* Actions */}
        <div className="px-3 pb-3 pt-0">
          {variant === "owner" && (
            <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1 h-7 text-[11px]"
                onClick={(e) => {
                  e.stopPropagation();
                  props.onEdit?.(item);
                }}
              >
                <Pencil className="h-3 w-3" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1 h-7 text-[11px] text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteDialog(true);
                }}
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </Button>
            </div>
          )}

          {variant === "friend" && !item.is_claimed && (
            <Button
              size="sm"
              className="w-full h-7 text-[11px] shadow-sm"
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
              className="w-full h-7 text-[11px]"
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

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{item.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This item may have been claimed by a friend. Deleting it
              can&apos;t be undone.
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