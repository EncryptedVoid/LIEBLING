"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Gift } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ItemGrid } from "@/components/item-grid";
import type { User, Item, Collection, Event } from "@/lib/types";

export default function FriendProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
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

  const claimedCount = allItems.filter((i) => i.claimed_by === currentUserId).length;
  const totalCount = allItems.length;
  const claimedByOthersCount = allItems.filter((i) => i.is_claimed && i.claimed_by !== currentUserId).length;

  // Build tabs
  const tabs = [
    { id: "all", label: "All items", count: allItems.length },
    ...collections.map((c) => ({
      id: `col-${c.id}`,
      label: c.name,
      count: allItems.filter((i) => i.collection_ids?.includes(c.id)).length,
    })),
    ...events
      .filter((e) => e.collection_id)
      .map((e) => ({
        id: `evt-${e.id}`,
        label: e.title,
        count: allItems.filter((i) =>
          i.collection_ids?.includes(e.collection_id!)
        ).length,
      })),
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
    <div className="-mx-4 -mt-8">
      {/* ── Accent banner ────────────────────────────── */}
      <div className="bg-primary/10 border-b border-primary/20">
        <div className="container mx-auto max-w-6xl px-4 py-6">
          {/* Back button */}
          <Button
            variant="ghost"
            size="sm"
            className="mb-4 -ml-2 gap-1.5 text-muted-foreground"
            onClick={() => router.push("/friends")}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to friends
          </Button>

          {/* Profile header */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary/30">
              <AvatarImage src={profile?.avatar_url ?? undefined} />
              <AvatarFallback className="text-lg bg-primary/20 text-primary">
                {profile?.display_name[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">
                  {profile?.display_name ?? "Loading..."}
                </h1>
                <Badge variant="outline" className="border-primary/30 text-primary">
                  <Gift className="h-3 w-3 mr-1" />
                  Friend
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm mt-0.5">
                {totalCount} {totalCount === 1 ? "item" : "items"} on their wishlist
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex gap-4 mt-4">
            <div className="flex items-center gap-1.5 text-sm">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span>
                <strong>{claimedCount}</strong> claimed by you
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
              <span>
                <strong>{claimedByOthersCount}</strong> claimed by others
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>
                <strong>{totalCount - claimedCount - claimedByOthersCount}</strong> available
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Items area ───────────────────────────────── */}
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <Tabs defaultValue="all">
          <TabsList className="flex-wrap h-auto gap-1">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id}>
                {tab.label} ({tab.count})
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
    </div>
  );
}