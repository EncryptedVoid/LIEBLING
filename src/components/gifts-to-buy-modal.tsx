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
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2 border-b">
          <DialogTitle className="text-xl">All Gifts to Buy</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {items.map((item) => {
              const isBought = !!item.bought_at;
              const owner = item.owner;
              const initials = owner?.display_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) ?? "?";

              return (
                <div
                  key={item.id}
                  className={`flex bg-card ring-1 ring-border rounded-xl overflow-hidden shadow-sm transition-all ${
                    isBought ? "opacity-60" : "hover:shadow-md"
                  }`}
                >
                  {/* LEFT SIDE: Info */}
                  <div className="flex-1 p-4 flex flex-col border-r bg-muted/10">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-10 w-10 border shadow-sm">
                        <AvatarImage src={owner?.avatar_url ?? undefined} />
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold">{owner?.display_name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">Gift for their wishlist</p>
                      </div>
                    </div>
                    <div className="mt-auto">
                      <p className="text-sm font-medium leading-snug line-clamp-2 mb-1">{item.name}</p>
                    </div>
                  </div>

                  {/* RIGHT SIDE: Preview & Actions */}
                  <div className="w-[180px] shrink-0 flex flex-col bg-card">
                    <div 
                      className="h-28 bg-muted/30 p-2 relative cursor-pointer group flex items-center justify-center"
                      onClick={() => window.open(item.link, "_blank")}
                    >
                      {item.image_url ? (
                         <img src={item.image_url} alt="" className="h-full w-full object-contain mix-blend-multiply flex-shrink-0 group-hover:scale-105 transition-transform" />
                      ) : (
                         <div className="text-xs text-muted-foreground flex flex-col items-center">
                           <ExternalLink className="h-4 w-4 mb-1" />
                           No Image
                         </div>
                      )}
                      {item.price && (
                        <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm px-1.5 py-0.5 rounded text-xs font-mono font-bold shadow-sm">
                          ${item.price.toFixed(2)}
                        </div>
                      )}
                    </div>
                    
                    <div className="p-2 flex flex-col gap-1.5 mt-auto bg-muted/10 border-t">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full text-xs h-7"
                        onClick={() => window.open(item.link, "_blank")}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" /> View Product
                      </Button>
                      
                      {isBought ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs h-7"
                          onClick={() => handleAction("unmark", item.id)}
                          disabled={loadingId === item.id}
                        >
                          <Undo2 className="h-3 w-3 mr-1" /> Undo Mark
                        </Button>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          className="w-full text-xs h-7 bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleAction("mark", item.id)}
                          disabled={loadingId === item.id}
                        >
                          <Check className="h-3 w-3 mr-1" /> Mark Bought
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
