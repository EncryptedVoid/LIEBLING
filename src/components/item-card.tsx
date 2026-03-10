"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ExternalLink } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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

  return (
    <>
      <Card className="overflow-hidden group">
        {/* Image */}
        <div className="aspect-video bg-muted relative overflow-hidden">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              No image
            </div>
          )}

          {/* Claimed overlay for friends */}
          {variant === "friend" && item.is_claimed && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
              <Badge variant={isClaimedByMe ? "default" : "secondary"}>
                {isClaimedByMe ? "You claimed this" : "Claimed"}
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-4">
          {/* Name + price row */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-medium text-sm truncate">{item.name}</h3>
              {item.price && (
                <p className="text-sm text-muted-foreground">
                  ${item.price.toFixed(2)}
                </p>
              )}
            </div>

            {/* External link */}
            <Button variant="ghost" size="icon" className="shrink-0" asChild>
              <a href={item.link} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>

          {/* Actions based on variant */}
          <div className="mt-3">
            {variant === "owner" && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full">
                    Manage
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => props.onEdit?.(item)}>
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive"
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {variant === "friend" && !item.is_claimed && (
              <Button
                size="sm"
                className="w-full"
                onClick={handleClaim}
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
                onClick={handleUnclaim}
                disabled={loading}
              >
                {loading ? "Unclaiming..." : "Unclaim"}
              </Button>
            )}

            {/* isClaimedByOther: no button rendered, just the overlay badge */}
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation (owner only) */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{item.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This item may have been claimed by a friend. Deleting it can't be
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