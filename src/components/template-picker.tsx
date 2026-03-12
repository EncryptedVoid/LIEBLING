"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Sparkles, Check } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import {
  COLLECTION_TEMPLATES,
  type CollectionTemplate,
} from "@/lib/collection-templates";

type TemplatePickerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
};

export function TemplatePicker({
  open,
  onOpenChange,
  onCreated,
}: TemplatePickerProps) {
  const supabase = createClient();
  const [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    if (!selected) return;
    const template = COLLECTION_TEMPLATES.find((t) => t.id === selected);
    if (!template) return;

    setCreating(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in.");

      const { data: col, error: colErr } = await supabase
        .from("collections")
        .insert({ user_id: user.id, name: template.name })
        .select("id")
        .single();
      if (colErr) throw colErr;

      const itemInserts = template.items.map((ti) => ({
        user_id: user.id,
        name: ti.name,
        link: "#",
        price: ti.placeholder_price ?? null,
      }));

      const { data: newItems, error: itemErr } = await supabase
        .from("items")
        .insert(itemInserts)
        .select("id");
      if (itemErr) throw itemErr;

      if (newItems && newItems.length > 0) {
        const links = newItems.map((item) => ({
          item_id: item.id,
          collection_id: col.id,
        }));
        const { error: linkErr } = await supabase
          .from("item_collections")
          .insert(links);
        if (linkErr) throw linkErr;
      }

      toast.success(`"${template.name}" collection created with ${template.items.length} items.`);
      setSelected(null);
      onOpenChange(false); // Close this dialog
      onCreated?.();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setSelected(null); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Start from a template
          </DialogTitle>
          <DialogDescription>
            Pick a template to create a collection with placeholder items.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2 mt-2 max-h-[50vh] overflow-y-auto pr-1 scrollbar-thin">
          {COLLECTION_TEMPLATES.map((template) => {
            const isSelected = selected === template.id;
            return (
              <button
                key={template.id}
                onClick={() => setSelected(template.id)}
                className={`flex flex-col items-start gap-1.5 rounded-xl border-2 p-3 text-left transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-muted hover:border-muted-foreground/20 hover:bg-muted/30"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xl">{template.emoji}</span>
                  {isSelected && (
                    <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <span className="text-xs font-medium">{template.name}</span>
                <span className="text-[10px] text-muted-foreground leading-snug">
                  {template.description}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {template.items.length} items
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex gap-2 mt-2">
          <Button variant="outline" className="flex-1" onClick={() => { setSelected(null); onOpenChange(false); }}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleCreate} disabled={!selected || creating}>
            {creating ? "Creating..." : "Create collection"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}