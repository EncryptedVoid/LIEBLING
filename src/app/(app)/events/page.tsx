"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { isPast, format } from "date-fns";
import { Plus, Users, Clock, Search, ArrowUpDown, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { SkeletonCard } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { EventCard } from "@/components/event-card";
import { EditEventDialog } from "@/components/edit-event-dialog";
import type { Event, Collection, User } from "@/lib/types";

type EventWithMeta = Event & {
  collection_name: string | null;
  owner?: User;
};

type ViewMode = "timeline" | "by-friend";
type SortOption = "date-asc" | "date-desc" | "name-asc" | "name-desc";

export default function EventsPage() {
  const supabase = createClient();
  const [currentUserId, setCurrentUserId] = useState("");
  const [events, setEvents] = useState<EventWithMeta[]>([]);
  const [friendEvents, setFriendEvents] = useState<EventWithMeta[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Search states for each tab
  const [myEventsSearch, setMyEventsSearch] = useState("");
  const [friendEventsSearch, setFriendEventsSearch] = useState("");
  const [pastEventsSearch, setPastEventsSearch] = useState("");

  // Sort states for each tab
  const [myEventsSort, setMyEventsSort] = useState<SortOption>("date-asc");
  const [friendEventsSort, setFriendEventsSort] = useState<SortOption>("date-asc");
  const [pastEventsSort, setPastEventsSort] = useState<SortOption>("date-desc");

  // View mode for friends' events
  const [friendViewMode, setFriendViewMode] = useState<ViewMode>("timeline");
  // View mode for past events
  const [pastViewMode, setPastViewMode] = useState<ViewMode>("timeline");

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

  // Sort function
  function sortEvents(events: EventWithMeta[], sortBy: SortOption): EventWithMeta[] {
    return [...events].sort((a, b) => {
      switch (sortBy) {
        case "date-asc":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "date-desc":
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "name-asc":
          return a.title.localeCompare(b.title);
        case "name-desc":
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });
  }

  // Filter function
  function filterEvents(events: EventWithMeta[], search: string): EventWithMeta[] {
    if (!search.trim()) return events;
    const q = search.toLowerCase();
    return events.filter((e) =>
      e.title.toLowerCase().includes(q) ||
      e.location?.toLowerCase().includes(q) ||
      e.description?.toLowerCase().includes(q) ||
      e.owner?.display_name.toLowerCase().includes(q)
    );
  }

  // Filtered and sorted lists
  const myUpcoming = useMemo(() => {
    const upcoming = events.filter((e) => !isPast(new Date(e.date)));
    const filtered = filterEvents(upcoming, myEventsSearch);
    return sortEvents(filtered, myEventsSort);
  }, [events, myEventsSearch, myEventsSort]);

  const friendUpcoming = useMemo(() => {
    const upcoming = friendEvents.filter((e) => !isPast(new Date(e.date)));
    const filtered = filterEvents(upcoming, friendEventsSearch);
    return sortEvents(filtered, friendEventsSort);
  }, [friendEvents, friendEventsSearch, friendEventsSort]);

  const allPast = useMemo(() => {
    const past = [...events, ...friendEvents].filter((e) => isPast(new Date(e.date)));
    const filtered = filterEvents(past, pastEventsSearch);
    return sortEvents(filtered, pastEventsSort);
  }, [events, friendEvents, pastEventsSearch, pastEventsSort]);

  // Group friend events by user
  const friendEventsByUser = useMemo(() => {
    return friendUpcoming.reduce((acc, event) => {
      const userId = event.user_id;
      if (!acc[userId]) {
        acc[userId] = {
          user: event.owner!,
          events: [],
        };
      }
      acc[userId].events.push(event);
      return acc;
    }, {} as Record<string, { user: User; events: EventWithMeta[] }>);
  }, [friendUpcoming]);

  // Sort groups by earliest event date
  const sortedUserGroups = useMemo(() => {
    return Object.values(friendEventsByUser).sort((a, b) => {
      const aDate = new Date(a.events[0]?.date ?? 0);
      const bDate = new Date(b.events[0]?.date ?? 0);
      return aDate.getTime() - bDate.getTime();
    });
  }, [friendEventsByUser]);

  // Group past events by user
  const pastEventsByUser = useMemo(() => {
    return allPast.reduce((acc, event) => {
      const userId = event.user_id;
      const owner = event.owner ?? { id: currentUserId, display_name: "You", avatar_url: null } as User;
      if (!acc[userId]) {
        acc[userId] = {
          user: owner,
          events: [],
          isCurrentUser: userId === currentUserId,
        };
      }
      acc[userId].events.push(event);
      return acc;
    }, {} as Record<string, { user: User; events: EventWithMeta[]; isCurrentUser: boolean }>);
  }, [allPast, currentUserId]);

  const sortedPastUserGroups = useMemo(() => {
    return Object.values(pastEventsByUser).sort((a, b) => {
      // Current user first, then alphabetically
      if (a.isCurrentUser) return -1;
      if (b.isCurrentUser) return 1;
      return a.user.display_name.localeCompare(b.user.display_name);
    });
  }, [pastEventsByUser]);

  const sortLabels: Record<SortOption, string> = {
    "date-asc": "Date (soonest)",
    "date-desc": "Date (latest)",
    "name-asc": "Name A-Z",
    "name-desc": "Name Z-A",
  };

  function SearchAndSort({
    search,
    onSearchChange,
    sort,
    onSortChange,
    placeholder = "Search events..."
  }: {
    search: string;
    onSearchChange: (v: string) => void;
    sort: SortOption;
    onSortChange: (v: SortOption) => void;
    placeholder?: string;
  }) {
    return (
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder={placeholder}
            className="pl-8"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="default" className="gap-1.5 shrink-0">
              <ArrowUpDown className="h-3 w-3" />
              <span className="hidden sm:inline text-xs">{sortLabels[sort]}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(Object.keys(sortLabels) as SortOption[]).map((key) => (
              <DropdownMenuItem
                key={key}
                onClick={() => onSortChange(key)}
                className={sort === key ? "font-medium" : ""}
              >
                {sortLabels[key]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  function ViewToggle({
    value,
    onChange
  }: {
    value: ViewMode;
    onChange: (v: ViewMode) => void;
  }) {
    return (
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-muted-foreground">View:</span>
        <div className="flex ring-1 ring-foreground/10 rounded-md overflow-hidden">
          <Button
            variant={value === "timeline" ? "default" : "ghost"}
            size="sm"
            className="rounded-none gap-1.5"
            onClick={() => onChange("timeline")}
          >
            <Clock className="h-3 w-3" />
            Timeline
          </Button>
          <Button
            variant={value === "by-friend" ? "default" : "ghost"}
            size="sm"
            className="rounded-none gap-1.5"
            onClick={() => onChange("by-friend")}
          >
            <Users className="h-3 w-3" />
            By Person
          </Button>
        </div>
      </div>
    );
  }

  function EventList({
    items,
    showOwner = false,
    editable = false,
    showOwnerBadge = false,
    emptyTitle = "No events here",
    emptyDescription = "No events to display."
  }: {
    items: EventWithMeta[]; 
    showOwner?: boolean; 
    editable?: boolean;
    showOwnerBadge?: boolean;
    emptyTitle?: string;
    emptyDescription?: string;
  }) {
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
          title={emptyTitle}
          description={emptyDescription}
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
          <div key={event.id} className="h-full">
            {showOwner && event.owner && !showOwnerBadge && (
              <div className="flex items-center gap-2 mb-2 px-1">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={event.owner.avatar_url ?? undefined} />
                  <AvatarFallback className="text-[8px]">{event.owner.display_name[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="text-[11px] text-muted-foreground">{event.owner.display_name}</span>
              </div>
            )}
            <EventCard 
              event={event} 
              onDelete={editable ? handleDelete : undefined} 
              onEdit={editable ? handleEdit : undefined}
              showOwnerBadge={showOwnerBadge}
            />
          </div>
        ))}
      </div>
    );
  }

  function GroupedEventsList({
    groups,
    showCurrentUserLabel = false
  }: {
    groups: { user: User; events: EventWithMeta[]; isCurrentUser?: boolean }[];
    showCurrentUserLabel?: boolean;
  }) {
    if (loading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger-grid">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      );
    }

    if (groups.length === 0) {
      return (
        <EmptyState
          variant="events"
          title="No events here"
          description="No events to display."
        />
      );
    }

    return (
      <div className="space-y-6">
        {groups.map(({ user, events: userEvents, isCurrentUser }) => (
          <div key={user.id}>
            {/* User header */}
            <div className="flex items-center gap-3 mb-3 pb-2 border-b">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar_url ?? undefined} />
                <AvatarFallback className="text-xs">{user.display_name[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">
                  {showCurrentUserLabel && isCurrentUser ? "Your Events" : user.display_name}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {userEvents.length} event{userEvents.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            {/* User's events */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-4 border-l-2 border-primary/20">
              {userEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onDelete={isCurrentUser ? handleDelete : undefined}
                  onEdit={isCurrentUser ? handleEdit : undefined}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  function FriendsEventsList() {
    if (loading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger-grid">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      );
    }

    if (friendUpcoming.length === 0) {
      return (
        <EmptyState
          variant="events"
          title={friendEventsSearch ? "No matching events" : "No events here"}
          description={friendEventsSearch ? "Try a different search term." : "Your friends haven't added any upcoming events yet."}
        />
      );
    }

    return (
      <div className="space-y-4">
        <ViewToggle value={friendViewMode} onChange={setFriendViewMode} />

        {friendViewMode === "timeline" ? (
          <EventList items={friendUpcoming} showOwnerBadge />
        ) : (
          <GroupedEventsList groups={sortedUserGroups} />
        )}
      </div>
    );
  }

  function PastEventsList() {
    if (loading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger-grid">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      );
    }

    if (allPast.length === 0) {
      return (
        <EmptyState
          variant="events"
          title={pastEventsSearch ? "No matching events" : "No past events"}
          description={pastEventsSearch ? "Try a different search term." : "Past events will appear here."}
        />
      );
    }

    return (
      <div className="space-y-4">
        <ViewToggle value={pastViewMode} onChange={setPastViewMode} />

        {pastViewMode === "timeline" ? (
          <EventList items={allPast} showOwner />
        ) : (
          <GroupedEventsList groups={sortedPastUserGroups} showCurrentUserLabel />
        )}
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
          <TabsTrigger value="mine">My Events ({events.filter(e => !isPast(new Date(e.date))).length})</TabsTrigger>
          <TabsTrigger value="friends">Friends&apos; Events ({friendEvents.filter(e => !isPast(new Date(e.date))).length})</TabsTrigger>
          <TabsTrigger value="past">Past ({[...events, ...friendEvents].filter(e => isPast(new Date(e.date))).length})</TabsTrigger>
        </TabsList>

        <TabsContent value="mine" className="mt-4">
          <SearchAndSort
            search={myEventsSearch}
            onSearchChange={setMyEventsSearch}
            sort={myEventsSort}
            onSortChange={setMyEventsSort}
            placeholder="Search your events..."
          />
          <EventList
            items={myUpcoming}
            editable
            emptyTitle={myEventsSearch ? "No matching events" : "No upcoming events"}
            emptyDescription={myEventsSearch ? "Try a different search term." : "Create your first event to get started."}
          />
        </TabsContent>

        <TabsContent value="friends" className="mt-4">
          <SearchAndSort
            search={friendEventsSearch}
            onSearchChange={setFriendEventsSearch}
            sort={friendEventsSort}
            onSortChange={setFriendEventsSort}
            placeholder="Search friends' events..."
          />
          <FriendsEventsList />
        </TabsContent>

        <TabsContent value="past" className="mt-4">
          <SearchAndSort
            search={pastEventsSearch}
            onSearchChange={setPastEventsSearch}
            sort={pastEventsSort}
            onSortChange={setPastEventsSort}
            placeholder="Search past events..."
          />
          <PastEventsList />
        </TabsContent>
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