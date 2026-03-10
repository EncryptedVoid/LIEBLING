"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { isPast } from "date-fns";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventCard } from "@/components/event-card";
import type { Event } from "@/lib/types";

type EventWithMeta = Event & { collection_name: string | null };

export default function EventsPage() {
  const supabase = createClient();
  const [events, setEvents] = useState<EventWithMeta[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchEvents() {
    setLoading(true);

    const { data } = await supabase
      .from("events")
      .select("*, collections(name)")
      .order("date", { ascending: true });

    const enriched: EventWithMeta[] = (data ?? []).map((e: any) => ({
      ...e,
      collection_name: e.collections?.name ?? null,
      collections: undefined,
    }));

    setEvents(enriched);
    setLoading(false);
  }

  useEffect(() => {
    fetchEvents();
  }, []);

  const upcoming = events.filter((e) => !isPast(new Date(e.date)));
  const past = events.filter((e) => isPast(new Date(e.date)));

  function EventList({ items }: { items: EventWithMeta[] }) {
    if (loading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      );
    }
    if (items.length === 0) {
      return (
        <p className="text-muted-foreground text-center py-16">
          No events here.
        </p>
      );
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Events</h1>
          <p className="text-muted-foreground mt-1">
            Birthdays, weddings, baby showers, and more.
          </p>
        </div>
        <Button asChild>
          <Link href="/events/new">New event</Link>
        </Button>
      </div>

      <Tabs defaultValue="upcoming" className="mt-8">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="mt-4">
          <EventList items={upcoming} />
        </TabsContent>
        <TabsContent value="past" className="mt-4">
          <EventList items={past} />
        </TabsContent>
      </Tabs>
    </div>
  );
}