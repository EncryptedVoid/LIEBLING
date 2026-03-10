"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ItemGrid } from "@/components/item-grid";
import { AddItemDialog } from "@/components/add-item-dialog";
import type { Event, Item, Collection } from "@/lib/types";

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const supabase = createClient();

  const [event, setEvent] = useState<Event | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [allCollections, setAllCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  async function fetchData() {
    setLoading(true);

    const { data: eventData } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();

    setEvent(eventData);

    if (eventData?.collection_id) {
      const [itemsRes, colsRes] = await Promise.all([
        supabase
          .from("items_visible")
          .select("*")
          .eq("user_id", eventData.user_id)
          .order("created_at", { ascending: false }),
        supabase.from("collections").select("*").order("name"),
      ]);
      // Filter to items that belong to this event's collection
      const allItems = itemsRes.data ?? [];
      setItems(
        allItems.filter((i: any) =>
          i.collection_ids?.includes(eventData.collection_id)
        )
      );
      setAllCollections(colsRes.data ?? []);
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, [id]);

  function handleDelete(itemId: string) {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  }

  if (!loading && !event) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-muted-foreground">Event not found.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Event header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {event?.title ?? "Loading..."}
        </h1>
        {event && (
          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
            <span>{format(new Date(event.date), "EEEE, MMMM d, yyyy")}</span>
            {event.time && <span>at {event.time}</span>}
            {event.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {event.location}
              </span>
            )}
          </div>
        )}
        {event?.description && (
          <p className="mt-3 text-sm text-muted-foreground max-w-2xl">
            {event.description}
          </p>
        )}
      </div>

      <Separator className="my-6" />

      {/* Items in linked collection */}
      {event?.collection_id ? (
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Wishlist</h2>
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              Add item
            </Button>
          </div>
          <div className="mt-4">
            <ItemGrid
              items={items}
              variant="owner"
              loading={loading}
              onDelete={handleDelete}
              emptyMessage="No items in this event's wishlist yet."
            />
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No collection linked to this event.
          </p>
        </div>
      )}

      <AddItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        collections={allCollections}
        defaultCollectionId={event?.collection_id ?? undefined}
        onItemAdded={fetchData}
      />
    </div>
  );
}