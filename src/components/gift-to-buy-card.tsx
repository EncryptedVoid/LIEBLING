"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ExternalLink,
  ShoppingBag,
  Check,
  Undo2,
  X,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

import type { Item, User } from "@/lib/types";

type GiftToBuyCardProps = {
  item: Item & { owner?: User };
  onUpdate: () => void;
};

export function GiftToBuyCard({ item, onUpdate }: GiftToBuyCardProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const isBought = !!item.bought_at;
  const ownerInitials = item.owner?.display_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "?";

  async function handleMarkBought() {
    setLoading(true);
    const { error } = await supabase.rpc("mark_item_bought", { item_id: item.id });
    if (error) {
      toast.error("Couldn't mark as bought.");
    } else {
      toast.success("Marked as bought!");
      onUpdate();
    }
    setLoading(false);
  }

  async function handleUnmarkBought() {
    setLoading(true);
    const { error } = await supabase.rpc("unmark_item_bought", { item_id: item.id });
    if (error) {
      toast.error("Couldn't unmark item.");
    } else {
      toast.success("Unmarked as bought.");
      onUpdate();
    }
    setLoading(false);
  }

  async function handleUnclaim() {
    setLoading(true);
    const { error } = await supabase.rpc("unclaim_item", { item_id: item.id });
    if (error) {
      toast.error("Couldn't unclaim item.");
    } else {
      toast.success("Unclaimed.");
      onUpdate();
    }
    setLoading(false);
  }

  function openLink() {
    window.open(item.link, "_blank", "noopener,noreferrer");
  }

  return (
    <TooltipProvider>
      <Card
        className={`group relative overflow-hidden transition-all duration-400 rounded-2xl ${
          isBought
            ? "opacity-50 grayscale"
            : "glass-card gradient-border-card hover:-translate-y-1"
        }`}
      >
        {/* Owner Avatar Badge - Top Right */}
        {item.owner && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="absolute top-2 right-2 z-10">
                <Avatar className="h-8 w-8 ring-2 ring-background shadow-md">
                  <AvatarImage src={item.owner.avatar_url ?? undefined} />
                  <AvatarFallback className="text-[10px] font-medium bg-primary text-primary-foreground">
                    {ownerInitials}
                  </AvatarFallback>
                </Avatar>
              </div>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p className="text-xs">For {item.owner.display_name}</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Bought Indicator Overlay */}
        {isBought && (
          <div className="absolute inset-0 z-5 flex items-center justify-center" style={{ background: 'var(--glass)', backdropFilter: 'blur(8px)' }}>
            <div className="px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-lg text-primary-foreground" style={{ background: 'linear-gradient(135deg, oklch(0.65 0.20 150), oklch(0.55 0.18 160))' }}>
              <Check className="h-3.5 w-3.5" />
              Bought
            </div>
          </div>
        )}

        {/* Image */}
        <div
          className="aspect-square bg-muted/40 relative overflow-hidden cursor-pointer"
          onClick={openLink}
        >
          {item.image_url ? (
            <img
              src={item.image_url}
              alt=""
              className={`h-full w-full object-contain p-3 transition-transform duration-300 ${
                isBought ? "" : "group-hover:scale-105"
              }`}
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <ShoppingBag className="h-8 w-8 text-muted-foreground/30" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          {item.price && (
            <p className={`text-sm font-bold font-mono mb-0.5 ${
              isBought ? "text-muted-foreground" : "gradient-text"
            }`}>
              ${item.price.toFixed(2)}
            </p>
          )}
          <p className={`text-[11px] font-medium leading-snug line-clamp-2 ${
            isBought ? "text-muted-foreground" : "text-foreground/80"
          }`}>
            {item.name}
          </p>
        </div>

        {/* Actions */}
        <div className="px-3 pb-3 flex gap-1.5">
          {/* External Link */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon-sm"
                className="h-7 w-7"
                onClick={openLink}
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">View product</p>
            </TooltipContent>
          </Tooltip>

          {/* Mark/Unmark as Bought */}
          {isBought ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-7 text-[11px]"
                  onClick={handleUnmarkBought}
                  disabled={loading}
                >
                  <Undo2 className="h-3 w-3 mr-1" />
                  Undo
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Mark as not bought yet</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1 h-7 text-[11px]"
                  onClick={handleMarkBought}
                  disabled={loading}
                >
                  <Check className="h-3 w-3 mr-1" />
                  Bought
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Mark as purchased</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Unclaim */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-7 w-7 text-destructive hover:bg-destructive/10"
                onClick={handleUnclaim}
                disabled={loading}
              >
                <X className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Unclaim this item</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </Card>
    </TooltipProvider>
  );
}