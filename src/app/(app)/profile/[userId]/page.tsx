"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ItemGrid } from "@/components/item-grid";
import type { User, Item, Collection, Event } from "@/lib/types";

export default function FriendProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const supabase = createClient();

  const [currentUserId, setCurrentUserId] = useState("");
  const [profile, setProfile] = useState<User | null>(null);
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    setCurrentUserId(user?.id ?? "");

    const [profileRes, itemsRes, colsRes, eventsRes] = await Promise.all([
      supabase.from("users").select("*").eq("id", userId).single(),
      supabase
        .from("items_visible")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase.from("collections").select("*").eq("user_id", userId).order("name"),
      supabase
        .from("events")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: true }),
    ]);

    setProfile(profileRes.data);
    setAllItems(itemsRes.data ?? []);
    setCollections(colsRes.data ?? []);
    setEvents(eventsRes.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, [userId]);

  if (!loading && !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-muted-foreground">User not found.</p>
      </div>
    );
  }

  // Build tabs: "All", then one per collection, then one per upcoming event
  const tabs = [
    { id: "all", label: "All items" },
    ...collections.map((c) => ({ id: `col-${c.id}`, label: c.name })),
    ...events
      .filter((e) => e.collection_id)
      .map((e) => ({ id: `evt-${e.id}`, label: e.title })),
  ];

  function getItemsForTab(tabId: string): Item[] {
    if (tabId === "all") return allItems;
    if (tabId.startsWith("col-")) {
      const colId = tabId.replace("col-", "");
      return allItems.filter((i) => i.collection_ids?.includes(colId));
    }
    if (tabId.startsWith("evt-")) {
      const evtId = tabId.replace("evt-", "");
      const event = events.find((e) => e.id === evtId);
      if (!event?.collection_id) return [];
      return allItems.filter((i) =>
        i.collection_ids?.includes(event.collection_id!)
      );
    }
    return [];
  }

  return (
    <div>
      {/* Profile header */}
      <div className="flex items-center gap-4">
        <Avatar className="h-14 w-14">
          <AvatarImage src={profile?.avatar_url ?? undefined} />
          <AvatarFallback className="text-lg">
            {profile?.display_name[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {profile?.display_name ?? "Loading..."}
          </h1>
          <p className="text-muted-foreground text-sm">
            {allItems.length} {allItems.length === 1 ? "item" : "items"} on
            their wishlist
          </p>
        </div>
      </div>

      {/* Tabbed item view */}
      <Tabs defaultValue="all" className="mt-8">
        <TabsList className="flex-wrap h-auto gap-1">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="mt-4">
            <ItemGrid
              items={getItemsForTab(tab.id)}
              variant="friend"
              currentUserId={currentUserId}
              loading={loading}
              onClaimChange={fetchData}
              emptyMessage="Nothing here yet."
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}