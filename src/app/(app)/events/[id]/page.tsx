"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { MapPin, CalendarDays, Link as LinkIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatTimeDisplay } from "@/lib/time-format";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SkeletonCard } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
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
  const [timeFormat, setTimeFormat] = useState<"12h" | "24h">("12h");

  async function fetchData() {
    setLoading(true);
    
    // Fetch user preferences
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("users")
        .select("time_format")
        .eq("id", user.id)
        .single();
      if (profile?.time_format) {
        setTimeFormat(profile.time_format);
      }
    }

    const { data: eventData } = await supabase.from("events").select("*").eq("id", id).single();
    setEvent(eventData);

    if (eventData?.collection_id) {
      const [itemsRes, colsRes] = await Promise.all([
        supabase.from("items_visible").select("*").eq("user_id", eventData.user_id).order("created_at", { ascending: false }),
        supabase.from("collections").select("*").order("name"),
      ]);
      const allItems = itemsRes.data ?? [];
      setItems(allItems.filter((i: any) => i.collection_ids?.includes(eventData.collection_id)));
      setAllCollections(colsRes.data ?? []);
    }
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, [id]);
  function handleDelete(itemId: string) { setItems((prev) => prev.filter((item) => item.id !== itemId)); }

  if (!loading && !event) {
    return (
      <EmptyState
        variant="events"
        title="Event not found"
        description="This event may have been deleted."
        className="py-24"
      />
    );
  }

  return (
    <div className="page-enter">
      {/* Event header */}
      <div className="flex items-start gap-4">
        {event && (
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex flex-col items-center justify-center shrink-0 shadow-inner text-primary">
            <span className="text-[10px] font-medium uppercase leading-none">{format(new Date(event.date), "MMM")}</span>
            <span className="text-lg font-bold leading-tight">{format(new Date(event.date), "d")}</span>
          </div>
        )}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {event?.title ?? <span className="skeleton-shimmer inline-block h-7 w-48 rounded" />}
          </h1>
          {event && (
            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                {format(new Date(event.date), "EEEE, MMMM d, yyyy")}
              </span>
              {event.time && <span>at {formatTimeDisplay(event.time, timeFormat)}</span>}
              {event.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {(() => {
                    try {
                      const p = JSON.parse(event.location);
                      return p.name || p.address || event.location;
                    } catch {
                      return event.location;
                    }
                  })()}
                </span>
              )}
            </div>
          )}
          {event?.description && (
            <p className="mt-3 text-xs text-muted-foreground max-w-2xl leading-relaxed">{event.description}</p>
          )}
          {event?.location && (() => {
            try {
              const p = JSON.parse(event.location);
              if (p.placeId) {
                return (
                  <div className="mt-4 rounded-lg overflow-hidden border max-w-md h-[200px]">
                    <iframe width="100%" height="100%" loading="lazy" src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}&q=place_id:${p.placeId}`} style={{ border: 0 }} />
                  </div>
                );
              }
            } catch { return null; }
            return null;
          })()}
          {event?.custom_links && event.custom_links.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {event.custom_links.map((link, idx) => (
                <Button key={idx} variant="outline" size="sm" asChild className="text-xs h-7 rounded-full bg-primary/5 border-primary/20 hover:bg-primary/10 text-primary">
                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                    <LinkIcon className="h-3 w-3 mr-1.5" />
                    {link.label}
                  </a>
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>

      <Separator className="my-6" />

      {event?.collection_id ? (
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium">Wishlist</h2>
            <Button size="sm" onClick={() => setDialogOpen(true)} className="shadow-sm">Add item</Button>
          </div>
          <div className="mt-4">
            <ItemGrid items={items} variant="owner" loading={loading} onDelete={handleDelete} emptyMessage="No items in this event's wishlist yet." />
          </div>
        </div>
      ) : (
        <EmptyState
          variant="collections"
          title="No collection linked"
          description="Link a wishlist collection to this event to start adding items."
        />
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