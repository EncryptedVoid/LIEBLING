"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  differenceInDays,
  format,
} from "date-fns";
import {
  CalendarDays,
  Gift,
  Sparkles,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { BirthdayCountdownSection } from "@/components/birthday-countdown-section";
import { GiftToBuyCard } from "@/components/gift-to-buy-card";
import { GiftsToBuyModal } from "@/components/gifts-to-buy-modal";
import { toast } from "sonner";

import type { User, Item, Event } from "@/lib/types";

type ClaimedItem = Item & { owner?: User };
type UpcomingEvent = Event & { owner?: User; daysAway: number };

export default function DashboardPage() {
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [friends, setFriends] = useState<User[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [claimedItems, setClaimedItems] = useState<ClaimedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [giftsModalOpen, setGiftsModalOpen] = useState(false);

  const timeBasedGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    setLoading(true);
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;

    const { data: profile } = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .single();
    setUser(profile as User);

    // Fetch friendships
    const { data: friendships } = await supabase
      .from("friendships")
      .select("requester_id, addressee_id")
      .or(`requester_id.eq.${authUser.id},addressee_id.eq.${authUser.id}`)
      .eq("status", "accepted");

    const friendIds = (friendships ?? []).map((f) =>
      f.requester_id === authUser.id ? f.addressee_id : f.requester_id
    );

    let profileMap = new Map<string, User>();
    let friendProfiles: User[] = [];

    if (friendIds.length > 0) {
      const { data: friendData } = await supabase
        .from("users")
        .select("*")
        .in("id", friendIds);
      friendProfiles = (friendData ?? []) as User[];
      profileMap = new Map(friendProfiles.map((p) => [p.id, p]));
    }

    setFriends(friendProfiles);

    // Fetch events
    const allUserIds = [authUser.id, ...friendIds];
    const now = new Date();
    const { data: eventsData } = await supabase
      .from("events")
      .select("*")
      .in("user_id", allUserIds)
      .gte("date", format(now, "yyyy-MM-dd"))
      .order("date", { ascending: true })
      .limit(10);

    const events: UpcomingEvent[] = (eventsData ?? []).map((e: any) => ({
      ...e,
      owner: e.user_id === authUser.id ? (profile as User) : profileMap.get(e.user_id),
      daysAway: differenceInDays(new Date(e.date), now),
    }));
    setUpcomingEvents(events);

    // Fetch claimed items
    if (friendIds.length > 0) {
      const { data: claimedData } = await supabase
        .from("items_visible")
        .select("*")
        .in("user_id", friendIds)
        .eq("claimed_by", authUser.id);

      const claimed: ClaimedItem[] = (claimedData ?? []).map((i: any) => ({
        ...i,
        owner: profileMap.get(i.user_id),
      }));
      setClaimedItems(claimed);
    }

    setLoading(false);
  }

  // Sort claimed items: unbought first, then bought (sorted by bought_at desc)
  const sortedClaimedItems = useMemo(() => {
    const unbought = claimedItems
      .filter((i) => !i.bought_at && !i.gifted_at)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const bought = claimedItems
      .filter((i) => i.bought_at && !i.gifted_at)
      .sort((a, b) => new Date(b.bought_at!).getTime() - new Date(a.bought_at!).getTime());

    // Filter out gifted items entirely - they're done
    return [...unbought, ...bought];
  }, [claimedItems]);

  const unboughtCount = sortedClaimedItems.filter((i) => !i.bought_at).length;
  const boughtCount = sortedClaimedItems.filter((i) => i.bought_at).length;

  if (loading) {
    return (
      <div className="space-y-6 page-enter">
        <div className="h-10 w-56 rounded-xl skeleton-shimmer" />
        <div className="h-28 rounded-2xl skeleton-shimmer" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-[400px] rounded-2xl skeleton-shimmer" />
          <div className="h-[400px] rounded-2xl skeleton-shimmer" />
          <div className="h-[400px] rounded-2xl skeleton-shimmer" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4 animate-fade-up">
        <div className="h-12 w-12 rounded-2xl flex items-center justify-center animate-float" style={{ background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))', boxShadow: '0 4px 20px var(--glow)' }}>
          <Sparkles className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight">
            <span className="gradient-text">{timeBasedGreeting}</span>, {user?.display_name?.split(" ")[0]}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Here&apos;s what&apos;s happening with your wishlists.
          </p>
        </div>
      </div>

      {/* 3-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[400px] stagger-grid">
        {/* Birthday Countdowns */}
        <div className="flex flex-col">
          <BirthdayCountdownSection currentUser={user} friends={friends} />
        </div>

        {/* Upcoming Events */}
        <Card className="glass-card gradient-border-card flex flex-col h-[400px] rounded-2xl">
          <CardHeader className="pb-2 shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <div className="p-1.5 rounded-lg" style={{ background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))' }}>
                  <CalendarDays className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
                Upcoming Events
                <Badge variant="secondary" className="text-[10px] font-mono">{upcomingEvents.length}</Badge>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden flex flex-col pt-2">
            {upcomingEvents.length === 0 ? (
              <EmptyState
                variant="events"
                title="No upcoming events"
                description="Create an event to get started."
                className="py-6"
              >
                <Button variant="outline" size="sm" asChild>
                  <Link href="/events/new">Create event</Link>
                </Button>
              </EmptyState>
            ) : (
              <div 
                className="overflow-hidden flex-1 relative"
                style={{
                  maskImage: upcomingEvents.length > 3 ? 'linear-gradient(to bottom, black 50%, transparent 100%)' : 'none',
                  WebkitMaskImage: upcomingEvents.length > 3 ? 'linear-gradient(to bottom, black 50%, transparent 100%)' : 'none'
                }}
              >
                <div className="space-y-2">
                  {upcomingEvents.slice(0, 3).map((event) => (
                    <Link
                      key={event.id}
                      href={`/events/${event.id}`}
                      className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-primary/5 transition-all duration-300 group hover:shadow-md hover:shadow-primary/5"
                    >
                      <div className="h-10 w-10 rounded-xl flex flex-col items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-105" style={{ background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))', color: 'var(--primary-foreground)' }}>
                        <span className="text-[8px] font-medium uppercase leading-none">
                          {format(new Date(event.date), "MMM")}
                        </span>
                        <span className="text-sm font-bold leading-tight">
                          {format(new Date(event.date), "d")}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">
                          {event.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {format(new Date(event.date), "EEE, MMM d")}
                          {event.owner && event.user_id !== user?.id && (
                            <span> · {event.owner.display_name}</span>
                          )}
                        </p>
                      </div>
                      <Badge
                        variant={event.daysAway <= 7 ? "default" : "secondary"}
                        className="shrink-0 text-[10px] shadow-sm"
                      >
                        {event.daysAway === 0
                          ? "Today"
                          : event.daysAway === 1
                          ? "Tomorrow"
                          : `${event.daysAway}d`}
                      </Badge>
                    </Link>
                  ))}
                  
                  {/* Padding to push down content so mask doesn't hide last item fully */}
                  {upcomingEvents.length > 3 && <div className="h-8" />}
                </div>
              </div>
            )}
            {upcomingEvents.length > 0 && (
              <Button variant="outline" className="w-full mt-4 shrink-0 transition-all active:scale-95 hover:bg-primary/5 hover:border-primary/30 hover:shadow-md hover:shadow-primary/10 rounded-xl" asChild>
                <Link href="/events?tab=friends&sort=date-asc">View all events</Link>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Gifts to Buy */}
        <Card className="glass-card gradient-border-card flex flex-col h-[400px] rounded-2xl">
          <CardHeader className="pb-2 shrink-0">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <div className="p-1.5 rounded-lg" style={{ background: 'linear-gradient(135deg, var(--gradient-to), var(--gradient-accent))' }}>
                <Gift className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              Gifts to Buy
              {unboughtCount > 0 && (
                <Badge className="text-[10px] font-mono btn-gradient border-0">
                  {unboughtCount} to buy
                </Badge>
              )}
              {boughtCount > 0 && (
                <Badge variant="secondary" className="text-[10px] font-mono">
                  {boughtCount} bought
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden flex flex-col pt-2">
            {sortedClaimedItems.length === 0 ? (
              <EmptyState
                variant="gifts"
                title="No gifts to buy yet"
                description="Browse your friends' wishlists to claim gifts."
                className="py-6"
              >
                <Button variant="outline" size="sm" asChild>
                  <Link href="/wishlist">Go to wishlists</Link>
                </Button>
              </EmptyState>
            ) : (
              <>
                <div 
                  className="flex-1 overflow-hidden relative"
                  style={{
                    maskImage: sortedClaimedItems.length > 3 ? 'linear-gradient(to bottom, black 55%, transparent 100%)' : 'none',
                    WebkitMaskImage: sortedClaimedItems.length > 3 ? 'linear-gradient(to bottom, black 55%, transparent 100%)' : 'none'
                  }}
                >
                  <div className="grid grid-cols-1 gap-2 pb-6">
                    {sortedClaimedItems.slice(0, 3).map((item) => (
                      <GiftToBuyCard
                        key={item.id}
                        item={item}
                        onUpdate={fetchDashboard}
                      />
                    ))}
                  </div>
                </div>
                {sortedClaimedItems.length > 0 && (
                  <Button 
                    variant="outline" 
                    className="w-full mt-4 shrink-0 transition-all active:scale-95 hover:bg-primary/5 hover:border-primary/30 hover:shadow-md hover:shadow-primary/10 rounded-xl"
                    onClick={() => setGiftsModalOpen(true)}
                  >
                    View all items to buy
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <GiftsToBuyModal 
        isOpen={giftsModalOpen} 
        onClose={() => setGiftsModalOpen(false)} 
        items={sortedClaimedItems} 
        onUpdate={fetchDashboard} 
      />
    </div>
  );
}