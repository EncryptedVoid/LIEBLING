"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Pencil,
  Trash2,
  ExternalLink,
  ShoppingBag,
  Gift,
  Undo2,
  FolderOpen,
} from "lucide-react";

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
import { getOrCreateGiftedCollection } from "@/lib/gifted-collection";

import type { Item, Collection } from "@/lib/types";

type ItemCardProps =
  | {
      item: Item;
      variant: "owner";
      viewMode?: "grid" | "list";
      collections?: Collection[];
      onDelete?: (id: string) => void;
      onEdit?: (item: Item) => void;
      onGiftedToggle?: () => void;
      onMoveGifted?: (item: Item) => void;
    }
  | {
      item: Item;
      variant: "friend";
      viewMode?: "grid" | "list";
      currentUserId: string;
      onClaimChange?: () => void;
    };

// Confetti component for celebration
function Confetti({ show }: { show: boolean }) {
  if (!show) return null;

  const colors = ['#f43f5e', '#3b82f6', '#22c55e', '#f97316', '#8b5cf6', '#eab308'];
  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: Math.random() * 8 + 4,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute animate-confetti"
          style={{
            left: `${piece.left}%`,
            top: '-20px',
            animationDelay: `${piece.delay}s`,
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        />
      ))}
    </div>
  );
}

export function ItemCard(props: ItemCardProps) {
  const { item, variant } = props;
  const viewMode = props.viewMode ?? "grid";
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const isGifted = !!item.gifted_at;

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

  async function handleMarkGifted() {
    if (variant !== "owner") return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in.");
      const giftedColId = await getOrCreateGiftedCollection(supabase, user.id);
      const { error: updateErr } = await supabase
        .from("items")
        .update({ gifted_at: new Date().toISOString() })
        .eq("id", item.id);
      if (updateErr) throw updateErr;
      if (!item.collection_ids?.includes(giftedColId)) {
        const { error: linkErr } = await supabase
          .from("item_collections")
          .insert({ item_id: item.id, collection_id: giftedColId });
        if (linkErr && !linkErr.message.includes("duplicate")) throw linkErr;
      }

      // Show confetti and celebratory toast
      setShowConfetti(true);
      toast.success("🎉 Congrats on receiving this gift! Enjoy!", {
        duration: 4000,
      });
      setTimeout(() => setShowConfetti(false), 3000);

      props.onGiftedToggle?.();
    } catch (err: any) {
      toast.error(err.message || "Couldn't mark as gifted.");
    }
    setLoading(false);
  }

  async function handleUnmarkGifted() {
    if (variant !== "owner") return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in.");
      const { error: updateErr } = await supabase
        .from("items")
        .update({ gifted_at: null })
        .eq("id", item.id);
      if (updateErr) throw updateErr;
      const { data: giftedCol } = await supabase
        .from("collections")
        .select("id")
        .eq("user_id", user.id)
        .eq("is_system", true)
        .single();
      if (giftedCol) {
        await supabase
          .from("item_collections")
          .delete()
          .eq("item_id", item.id)
          .eq("collection_id", giftedCol.id);
      }
      toast.success("Restored to wishlist.");
      props.onGiftedToggle?.();
    } catch (err: any) {
      toast.error(err.message || "Couldn't restore item.");
    }
    setLoading(false);
  }

  function handleMoveClick() {
    if (variant === "owner" && props.onMoveGifted) {
      props.onMoveGifted(item);
    }
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

  const isClaimedByMe = variant === "friend" && item.claimed_by === props.currentUserId;

  function openLink() {
    window.open(item.link, "_blank", "noopener,noreferrer");
  }

  // ── LIST VIEW ──────────────────────────────────────────
  if (viewMode === "list") {
    return (
      <>
        <Confetti show={showConfetti} />
        <div
          onClick={openLink}
          className={`group flex items-center gap-3 rounded-xl p-2.5 cursor-pointer ring-1 ring-foreground/5 bg-card hover:shadow-md hover:shadow-primary/5 hover:ring-primary/20 transition-all duration-200 ${
            isGifted ? "opacity-50" : ""
          }`}
        >
          {/* Thumbnail */}
          <div className="h-14 w-14 rounded-lg bg-muted/50 overflow-hidden shrink-0 relative">
            {item.image_url ? (
              <img
                src={item.image_url}
                alt=""
                className={`h-full w-full object-contain p-1.5 ${isGifted ? "grayscale" : ""}`}
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <ShoppingBag className="h-5 w-5 text-muted-foreground/30" />
              </div>
            )}
            {variant === "friend" && item.is_claimed && (
              <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] flex items-center justify-center">
                <Badge
                  variant={isClaimedByMe ? "default" : "secondary"}
                  className="text-[9px] px-1.5 py-0"
                >
                  {isClaimedByMe ? "Yours" : "Taken"}
                </Badge>
              </div>
            )}
            {isGifted && (
              <div className="absolute inset-0 bg-background/40 flex items-center justify-center">
                <Gift className="h-4 w-4 text-muted-foreground/50" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p
                className={`text-xs font-medium truncate group-hover:text-primary transition-colors ${
                  isGifted ? "line-through text-muted-foreground" : ""
                }`}
              >
                {item.name}
              </p>
              {isGifted && (
                <Badge variant="outline" className="text-[9px] shrink-0 gap-0.5">
                  <Gift className="h-2 w-2" /> Received
                </Badge>
              )}
            </div>
            {item.price && (
              <p
                className={`text-sm font-bold mt-0.5 font-mono ${
                  isGifted ? "text-muted-foreground" : "text-primary"
                }`}
              >
                ${item.price.toFixed(2)}
              </p>
            )}
          </div>

          {/* Actions - LARGER BUTTONS */}
          <div
            className="flex items-center gap-1.5 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            {variant === "owner" && (
              <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                {!isGifted && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="h-8 w-8"
                    onClick={() => props.onEdit?.(item)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
                {isGifted && props.onMoveGifted && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="h-8 w-8"
                    onClick={handleMoveClick}
                    title="Move to collection"
                  >
                    <FolderOpen className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-8 w-8"
                  onClick={isGifted ? handleUnmarkGifted : handleMarkGifted}
                  disabled={loading}
                  title={isGifted ? "Mark as not received" : "Mark as received"}
                >
                  {isGifted ? (
                    <Undo2 className="h-4 w-4" />
                  ) : (
                    <Gift className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
            {variant === "friend" && !item.is_claimed && !isGifted && (
              <Button size="sm" onClick={handleClaim} disabled={loading}>
                {loading ? "..." : "Claim"}
              </Button>
            )}
            {variant === "friend" && isClaimedByMe && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleUnclaim}
                disabled={loading}
              >
                Unclaim
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ExternalLink className="h-4 w-4" />
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
              <AlertDialogAction onClick={handleDelete} disabled={loading}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // ── GRID VIEW ──────────────────────────────────────────
  return (
    <>
      <Confetti show={showConfetti} />
      <Card
        className={`overflow-hidden group transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 hover:ring-primary/20 relative card-gradient-accent ${
          isGifted ? "opacity-60" : ""
        }`}
      >
        <div onClick={openLink} className="cursor-pointer">
          {/* Image */}
          <div className="relative overflow-hidden bg-muted/30">
            <div className="aspect-[4/3]">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className={`object-contain w-full h-full p-4 transition-transform duration-300 group-hover:scale-105 ${
                    isGifted ? "grayscale" : ""
                  }`}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground/30 gap-1.5">
                  <ShoppingBag className="h-8 w-8" />
                </div>
              )}
            </div>

            {/* Claimed overlay */}
            {variant === "friend" && item.is_claimed && !isGifted && (
              <div className="absolute inset-0 bg-background/65 backdrop-blur-[2px] flex items-center justify-center">
                <Badge
                  variant={isClaimedByMe ? "default" : "secondary"}
                  className="shadow-sm"
                >
                  {isClaimedByMe ? "You claimed this" : "Claimed"}
                </Badge>
              </div>
            )}

            {/* Gifted overlay */}
            {isGifted && (
              <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                <Badge variant="outline" className="shadow-sm gap-1.5 text-xs">
                  <Gift className="h-3 w-3" /> Received
                </Badge>
              </div>
            )}

            {/* Owner hover actions — top right - LARGER BUTTONS */}
            {variant === "owner" && (
              <div
                className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0"
                onClick={(e) => e.stopPropagation()}
              >
                {!isGifted && (
                  <Button
                    variant="secondary"
                    size="icon-sm"
                    className="h-8 w-8 bg-background/95 backdrop-blur-sm shadow-md hover:bg-background"
                    onClick={() => props.onEdit?.(item)}
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
                {isGifted && props.onMoveGifted && (
                  <Button
                    variant="secondary"
                    size="icon-sm"
                    className="h-8 w-8 bg-background/95 backdrop-blur-sm shadow-md hover:bg-background"
                    onClick={handleMoveClick}
                    title="Move to collection"
                  >
                    <FolderOpen className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="icon-sm"
                  className="h-8 w-8 bg-background/95 backdrop-blur-sm shadow-md hover:bg-background"
                  onClick={isGifted ? handleUnmarkGifted : handleMarkGifted}
                  disabled={loading}
                  title={isGifted ? "Mark as not received" : "Mark as received"}
                >
                  {isGifted ? (
                    <Undo2 className="h-4 w-4" />
                  ) : (
                    <Gift className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="secondary"
                  size="icon-sm"
                  className="h-8 w-8 bg-background/95 backdrop-blur-sm shadow-md text-destructive hover:bg-destructive/10"
                  onClick={() => setShowDeleteDialog(true)}
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* External link icon — friends */}
            {variant === "friend" && (
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">
                <div className="h-8 w-8 rounded-full bg-background/95 backdrop-blur-sm shadow-md flex items-center justify-center">
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            )}
          </div>

          {/* Info */}
          <CardContent className="p-3">
            {item.price && (
              <p
                className={`text-base font-bold font-mono mb-0.5 ${
                  isGifted ? "text-muted-foreground line-through" : "text-primary"
                }`}
              >
                ${item.price.toFixed(2)}
              </p>
            )}
            <h3
              className={`text-xs font-medium leading-snug line-clamp-2 transition-colors duration-200 ${
                isGifted
                  ? "text-muted-foreground line-through"
                  : "group-hover:text-primary"
              }`}
            >
              {item.name}
            </h3>
          </CardContent>
        </div>

        {/* Friend claim button */}
        {variant === "friend" && !item.is_claimed && !isGifted && (
          <div className="px-3 pb-3 pt-0" onClick={(e) => e.stopPropagation()}>
            <Button
              size="sm"
              className="w-full shadow-sm"
              onClick={handleClaim}
              disabled={loading}
            >
              {loading ? "Claiming..." : "Claim this item"}
            </Button>
          </div>
        )}
        {variant === "friend" && isClaimedByMe && !isGifted && (
          <div className="px-3 pb-3 pt-0" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
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
            <AlertDialogDescription>
              This item may have been claimed. Deleting can&apos;t be undone.
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