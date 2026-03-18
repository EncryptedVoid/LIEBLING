"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ExternalLink, Check, Undo2, X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import type { Item, User } from "@/lib/types";

type ClaimedItem = Item & { owner?: User };

type GiftsToBuyModalProps = {
  isOpen: boolean;
  onClose: () => void;
  items: ClaimedItem[];
  onUpdate: () => void;
};

export function GiftsToBuyModal({ isOpen, onClose, items, onUpdate }: GiftsToBuyModalProps) {
  const supabase = createClient();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleAction(action: "mark" | "unmark" | "unclaim", id: string) {
    setLoadingId(id);
    let rpcName = "";
    if (action === "mark") rpcName = "mark_item_bought";
    if (action === "unmark") rpcName = "unmark_item_bought";
    if (action === "unclaim") rpcName = "unclaim_item";

    const { error } = await supabase.rpc(rpcName, { item_id: id });
    if (error) {
      toast.error(`Action failed.`);
    } else {
      toast.success("Success!");
      onUpdate();
    }
    setLoadingId(null);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-background/95 backdrop-blur-2xl border border-border/50 shadow-2xl rounded-2xl">
        <DialogHeader className="p-8 pb-4 border-b border-border/40">
          <DialogTitle className="text-3xl font-heading font-bold gradient-text">Outstanding Gifts to Buy</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">Review the gifts you need to purchase for your friends and family.</p>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-8 scrollbar-thin">
          <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
            {items.map((item) => {
              const isBought = !!item.bought_at;
              const owner = item.owner;
              const initials = owner?.display_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) ?? "?";

              return (
                <div
                  key={item.id}
                  className={`flex flex-col sm:flex-row bg-card rounded-2xl overflow-hidden transition-all duration-300 glass-card gradient-border-card hover:-translate-y-1 ${
                    isBought ? "opacity-60" : "hover:shadow-lg"
                  }`}
                >
                  {/* LEFT SIDE: Info */}
                  <div className="flex-1 p-5 flex flex-col border-r border-border/10 bg-muted/10">
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar className="h-12 w-12 border shadow-sm ring-2 ring-primary/10">
                        <AvatarImage src={owner?.avatar_url ?? undefined} />
                        <AvatarFallback className="text-xs bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-bold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-lg font-semibold tracking-tight">{owner?.display_name}</p>
                        <p className="text-sm text-muted-foreground">Gift for their wishlist</p>
                      </div>
                    </div>
                    <div className="mt-auto pt-4 border-t border-border/20">
                      <p className="text-base font-semibold leading-snug line-clamp-2">{item.name}</p>
                    </div>
                  </div>

                  {/* RIGHT SIDE: Preview & Actions */}
                  <div className="w-full sm:w-[220px] shrink-0 flex flex-col bg-muted/5 border-l border-border/40">
                    <div 
                      className="h-32 p-3 relative cursor-pointer group flex items-center justify-center overflow-hidden"
                      onClick={() => window.open(item.link, "_blank")}
                    >
                      {item.image_url ? (
                         <img src={item.image_url} alt="" className="h-full w-full object-contain mix-blend-multiply flex-shrink-0 group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                         <div className="text-sm text-muted-foreground flex flex-col items-center opacity-70">
                           <ExternalLink className="h-6 w-6 mb-2 text-primary/40" />
                           No Image
                         </div>
                      )}
                      {item.price && (
                        <div className="absolute top-3 right-3 bg-background/95 backdrop-blur-md px-2 py-1 rounded-md text-sm font-mono font-bold shadow-md border border-border/50 text-primary">
                          ${item.price.toFixed(2)}
                        </div>
                      )}
                    </div>
                    
                    <div className="p-3 flex flex-col gap-2 mt-auto pb-4">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full h-9 rounded-lg"
                        onClick={() => window.open(item.link, "_blank")}
                      >
                        <ExternalLink className="h-4 w-4 mr-1.5" /> View Product
                      </Button>
                      
                      {isBought ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full h-9 rounded-lg"
                          onClick={() => handleAction("unmark", item.id)}
                          disabled={loadingId === item.id}
                        >
                          <Undo2 className="h-4 w-4 mr-1.5" /> Undo Mark
                        </Button>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          className="w-full h-9 rounded-lg btn-gradient shadow-md"
                          onClick={() => handleAction("mark", item.id)}
                          disabled={loadingId === item.id}
                        >
                          <Check className="h-4 w-4 mr-1.5" /> Mark Bought
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {items.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground">
                <p>No gifts to buy right now.</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
