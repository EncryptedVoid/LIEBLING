"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { isPast } from "date-fns";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SkeletonCard } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { EventCard } from "@/components/event-card";
import { EditEventDialog } from "@/components/edit-event-dialog";
import type { Event, Collection, User } from "@/lib/types";

type EventWithMeta = Event & {
  collection_name: string | null;
  owner?: User;
};

export default function EventsPage() {
  const supabase = createClient();
  const [currentUserId, setCurrentUserId] = useState("");
  const [events, setEvents] = useState<EventWithMeta[]>([]);
  const [friendEvents, setFriendEvents] = useState<EventWithMeta[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  async function fetchData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUserId(user.id);

    const [eventsRes, colsRes] = await Promise.all([
      supabase.from("events").select("*, collections(name)").eq("user_id", user.id).order("date", { ascending: true }),
      supabase.from("collections").select("*").order("name"),
    ]);

    const myEvents: EventWithMeta[] = (eventsRes.data ?? []).map((e: any) => ({
      ...e, collection_name: e.collections?.name ?? null, collections: undefined,
    }));
    setEvents(myEvents);
    setCollections(colsRes.data ?? []);

    const { data: friendships } = await supabase.from("friendships").select("requester_id, addressee_id").or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`).eq("status", "accepted");
    if (friendships && friendships.length > 0) {
      const friendIds = friendships.map((f) => f.requester_id === user.id ? f.addressee_id : f.requester_id);
      const [fEventsRes, fProfilesRes] = await Promise.all([
        supabase.from("events").select("*, collections(name)").in("user_id", friendIds).order("date", { ascending: true }),
        supabase.from("users").select("*").in("id", friendIds),
      ]);
      const profileMap = new Map((fProfilesRes.data ?? []).map((p: any) => [p.id, p]));
      const fEvents: EventWithMeta[] = (fEventsRes.data ?? []).map((e: any) => ({
        ...e, collection_name: e.collections?.name ?? null, collections: undefined, owner: profileMap.get(e.user_id) ?? undefined,
      }));
      setFriendEvents(fEvents);
    }
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  function handleDelete(id: string) { setEvents((prev) => prev.filter((e) => e.id !== id)); }
  function handleEdit(event: Event) { setEditingEvent(event); setEditDialogOpen(true); }

  const myUpcoming = events.filter((e) => !isPast(new Date(e.date)));
  const friendUpcoming = friendEvents.filter((e) => !isPast(new Date(e.date)));
  const allPast = [...events, ...friendEvents].filter((e) => isPast(new Date(e.date))).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  function EventList({ items, showOwner = false, editable = false }: { items: EventWithMeta[]; showOwner?: boolean; editable?: boolean; }) {
    if (loading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger-grid">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      );
    }
    if (items.length === 0) {
      return (
        <EmptyState
          variant="events"
          title="No events here"
          description={editable ? "Create your first event to get started." : "Your friends haven't added any events yet."}
        >
          {editable && (
            <Button asChild size="sm">
              <Link href="/events/new"><Plus className="h-3 w-3 mr-1" />New event</Link>
            </Button>
          )}
        </EmptyState>
      );
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger-grid">
        {items.map((event) => (
          <div key={event.id}>
            {showOwner && event.owner && (
              <div className="flex items-center gap-2 mb-2 px-1">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={event.owner.avatar_url ?? undefined} />
                  <AvatarFallback className="text-[8px]">{event.owner.display_name[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="text-[11px] text-muted-foreground">{event.owner.display_name}</span>
              </div>
            )}
            <EventCard event={event} onDelete={editable ? handleDelete : undefined} onEdit={editable ? handleEdit : undefined} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Events</h1>
          <p className="text-muted-foreground mt-0.5 text-xs">Your occasions and your friends&apos; too.</p>
        </div>
        <Button asChild className="shadow-sm">
          <Link href="/events/new"><Plus className="h-3.5 w-3.5 mr-1.5" />New event</Link>
        </Button>
      </div>

      <Tabs defaultValue="mine" className="mt-6">
        <TabsList>
          <TabsTrigger value="mine">My Events ({myUpcoming.length})</TabsTrigger>
          <TabsTrigger value="friends">Friends&apos; Events ({friendUpcoming.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({allPast.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="mine" className="mt-4"><EventList items={myUpcoming} editable /></TabsContent>
        <TabsContent value="friends" className="mt-4"><EventList items={friendUpcoming} showOwner /></TabsContent>
        <TabsContent value="past" className="mt-4"><EventList items={allPast} showOwner /></TabsContent>
      </Tabs>

      <EditEventDialog
        open={editDialogOpen}
        onOpenChange={(open) => { setEditDialogOpen(open); if (!open) setEditingEvent(null); }}
        event={editingEvent}
        collections={collections}
        onSaved={fetchData}
      />
    </div>
  );
}