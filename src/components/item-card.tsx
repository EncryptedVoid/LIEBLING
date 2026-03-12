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
      viewMode?: "grid" | "list";
      onDelete?: (id: string) => void;
      onEdit?: (item: Item) => void;
    }
  | {
      item: Item;
      variant: "friend";
      viewMode?: "grid" | "list";
      currentUserId: string;
      onClaimChange?: () => void;
    };

export function ItemCard(props: ItemCardProps) {
  const { item, variant } = props;
  const viewMode = props.viewMode ?? "grid";
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
      toast.error(error.message.includes("already claimed") ? "Someone just claimed this!" : "Couldn't claim item.");
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

  const isClaimedByMe = variant === "friend" && item.claimed_by === props.currentUserId;
  const isClaimedByOther = variant === "friend" && item.is_claimed && !isClaimedByMe;

  function openLink() {
    window.open(item.link, "_blank", "noopener,noreferrer");
  }

  // ── LIST VIEW ──────────────────────────────────────────
  if (viewMode === "list") {
    return (
      <>
        <div
          onClick={openLink}
          className="group flex items-center gap-3 rounded-xl p-2.5 cursor-pointer ring-1 ring-foreground/5 bg-card hover:shadow-md hover:shadow-primary/5 hover:ring-primary/20 transition-all duration-200"
        >
          {/* Thumbnail */}
          <div className="h-14 w-14 rounded-lg bg-muted/50 overflow-hidden shrink-0 relative">
            {item.image_url ? (
              <img src={item.image_url} alt="" className="h-full w-full object-contain p-1.5" />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <ShoppingBag className="h-5 w-5 text-muted-foreground/30" />
              </div>
            )}
            {variant === "friend" && item.is_claimed && (
              <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] flex items-center justify-center">
                <Badge variant={isClaimedByMe ? "default" : "secondary"} className="text-[9px] px-1.5 py-0">
                  {isClaimedByMe ? "Yours" : "Taken"}
                </Badge>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">{item.name}</p>
            {item.price && (
              <p className="text-sm font-bold text-primary mt-0.5 font-mono">${item.price.toFixed(2)}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            {variant === "owner" && (
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon-xs" onClick={() => props.onEdit?.(item)}>
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon-xs" className="text-destructive hover:bg-destructive/10" onClick={() => setShowDeleteDialog(true)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}
            {variant === "friend" && !item.is_claimed && (
              <Button size="xs" onClick={handleClaim} disabled={loading}>
                {loading ? "..." : "Claim"}
              </Button>
            )}
            {variant === "friend" && isClaimedByMe && (
              <Button variant="outline" size="xs" onClick={handleUnclaim} disabled={loading}>
                Unclaim
              </Button>
            )}
            <Button variant="ghost" size="icon-xs" className="opacity-0 group-hover:opacity-100 transition-opacity">
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete &quot;{item.name}&quot;?</AlertDialogTitle>
              <AlertDialogDescription>This can&apos;t be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={loading}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // ── GRID VIEW ──────────────────────────────────────────
  return (
    <>
      <Card className="overflow-hidden group transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 hover:ring-primary/20 relative card-gradient-accent">
        <div onClick={openLink} className="cursor-pointer">
          {/* Image */}
          <div className="relative overflow-hidden bg-muted/30">
            <div className="aspect-[4/3]">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="object-contain w-full h-full p-4 transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground/30 gap-1.5">
                  <ShoppingBag className="h-8 w-8" />
                </div>
              )}
            </div>

            {/* Claimed overlay */}
            {variant === "friend" && item.is_claimed && (
              <div className="absolute inset-0 bg-background/65 backdrop-blur-[2px] flex items-center justify-center">
                <Badge variant={isClaimedByMe ? "default" : "secondary"} className="shadow-sm">
                  {isClaimedByMe ? "You claimed this" : "Claimed"}
                </Badge>
              </div>
            )}

            {/* Owner hover actions — top right, no reserved space */}
            {variant === "owner" && (
              <div
                className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  variant="secondary"
                  size="icon-xs"
                  className="bg-background/90 backdrop-blur-sm shadow-sm hover:bg-background"
                  onClick={() => props.onEdit?.(item)}
                >
                  <Pencil className="h-2.5 w-2.5" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon-xs"
                  className="bg-background/90 backdrop-blur-sm shadow-sm text-destructive hover:bg-destructive/10"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-2.5 w-2.5" />
                </Button>
              </div>
            )}

            {/* External link icon — top right for friends */}
            {variant === "friend" && (
              <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">
                <div className="h-6 w-6 rounded-full bg-background/90 backdrop-blur-sm shadow-sm flex items-center justify-center">
                  <ExternalLink className="h-2.5 w-2.5 text-muted-foreground" />
                </div>
              </div>
            )}
          </div>

          {/* Info — compact */}
          <CardContent className="p-3">
            {/* Price — prominent */}
            {item.price && (
              <p className="text-base font-bold text-primary font-mono mb-0.5">
                ${item.price.toFixed(2)}
              </p>
            )}
            <h3 className="text-xs font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors duration-200">
              {item.name}
            </h3>
          </CardContent>
        </div>

        {/* Friend claim button — bottom, no empty space when not needed */}
        {variant === "friend" && !item.is_claimed && (
          <div className="px-3 pb-3 pt-0" onClick={(e) => e.stopPropagation()}>
            <Button
              size="sm"
              className="w-full h-7 text-[11px] shadow-sm"
              onClick={handleClaim}
              disabled={loading}
            >
              {loading ? "Claiming..." : "Claim this item"}
            </Button>
          </div>
        )}
        {variant === "friend" && isClaimedByMe && (
          <div className="px-3 pb-3 pt-0" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="outline"
              size="sm"
              className="w-full h-7 text-[11px]"
              onClick={handleUnclaim}
              disabled={loading}
            >
              {loading ? "..." : "Unclaim"}
            </Button>
          </div>
        )}
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{item.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>This item may have been claimed. Deleting can&apos;t be undone.</AlertDialogDescription>
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