"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  differenceInDays,
  differenceInYears,
  format,
  isBefore,
  setYear,
  addYears,
  isToday,
} from "date-fns";
import {
  Cake,
  CalendarDays,
  Gift,
  ExternalLink,
  X,
  Sparkles,
  PartyPopper,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SkeletonStat, SkeletonCard } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { toast } from "sonner";

import type { User, Item, Event } from "@/lib/types";

type ClaimedItem = Item & { owner?: User };
type UpcomingEvent = Event & { owner?: User; daysAway: number };

export default function DashboardPage() {
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [birthdayCountdown, setBirthdayCountdown] = useState<number | null>(null);
  const [userAge, setUserAge] = useState<number | null>(null);
  const [isBirthdayToday, setIsBirthdayToday] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [claimedItems, setClaimedItems] = useState<ClaimedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  // Confetti effect on birthday
  useEffect(() => {
    if (isBirthdayToday) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isBirthdayToday]);

  async function fetchDashboard() {
    setLoading(true);
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;

    const { data: profile } = await supabase.from("users").select("*").eq("id", authUser.id).single();
    setUser(profile as User);

    if (profile?.birthday) {
      const bday = new Date(profile.birthday);
      const now = new Date();

      // Check if today is the birthday
      const todayMonth = now.getMonth();
      const todayDay = now.getDate();
      const bdayMonth = bday.getMonth();
      const bdayDay = bday.getDate();

      if (todayMonth === bdayMonth && todayDay === bdayDay) {
        setIsBirthdayToday(true);
        setBirthdayCountdown(0);
        // Calculate age
        const age = differenceInYears(now, bday);
        setUserAge(age);
      } else {
        setIsBirthdayToday(false);
        let nextBday = setYear(bday, now.getFullYear());
        if (isBefore(nextBday, now)) nextBday = addYears(nextBday, 1);
        setBirthdayCountdown(differenceInDays(nextBday, now));
      }
    }

    const { data: friendships } = await supabase.from("friendships").select("requester_id, addressee_id").or(`requester_id.eq.${authUser.id},addressee_id.eq.${authUser.id}`).eq("status", "accepted");
    const friendIds = (friendships ?? []).map((f) => f.requester_id === authUser.id ? f.addressee_id : f.requester_id);

    let profileMap = new Map<string, User>();
    if (friendIds.length > 0) {
      const { data: friendProfiles } = await supabase.from("users").select("*").in("id", friendIds);
      profileMap = new Map((friendProfiles ?? []).map((p: any) => [p.id, p as User]));
    }

    const allUserIds = [authUser.id, ...friendIds];
    const now = new Date();
    const { data: eventsData } = await supabase.from("events").select("*").in("user_id", allUserIds).gte("date", format(now, "yyyy-MM-dd")).order("date", { ascending: true }).limit(10);
    const events: UpcomingEvent[] = (eventsData ?? []).map((e: any) => ({ ...e, owner: e.user_id === authUser.id ? (profile as User) : profileMap.get(e.user_id), daysAway: differenceInDays(new Date(e.date), now) }));
    setUpcomingEvents(events);

    if (friendIds.length > 0) {
      const { data: claimedData } = await supabase.from("items_visible").select("*").in("user_id", friendIds).eq("claimed_by", authUser.id);
      const claimed: ClaimedItem[] = (claimedData ?? []).map((i: any) => ({ ...i, owner: profileMap.get(i.user_id) }));
      setClaimedItems(claimed);
    }

    setLoading(false);
  }

  async function handleUnclaim(itemId: string) {
    const { error } = await supabase.rpc("unclaim_item", { item_id: itemId });
    if (error) { toast.error("Couldn't unclaim."); } else { toast.success("Unclaimed."); setClaimedItems((prev) => prev.filter((i) => i.id !== itemId)); }
  }

  if (loading) {
    return (
      <div className="space-y-4 page-enter">
        <div className="h-8 w-48 rounded skeleton-shimmer" />
        <div className="h-24 rounded-xl skeleton-shimmer" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-48 rounded-xl skeleton-shimmer" />
          <div className="h-48 rounded-xl skeleton-shimmer" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter flex flex-col gap-4 relative">
      {/* Confetti overlay */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                backgroundColor: ['#f43f5e', '#8b5cf6', '#3b82f6', '#22c55e', '#f97316', '#eab308'][Math.floor(Math.random() * 6)],
                width: `${Math.random() * 10 + 5}px`,
                height: `${Math.random() * 10 + 5}px`,
                borderRadius: Math.random() > 0.5 ? '50%' : '0',
              }}
            />
          ))}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Hey, {user?.display_name?.split(" ")[0]}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Here&apos;s what&apos;s happening with your wishlists.
          </p>
        </div>
      </div>

      {/* Birthday Card - Redesigned */}
      {(birthdayCountdown !== null || isBirthdayToday) && (
        <Card className={`overflow-hidden shadow-sm transition-all ${isBirthdayToday ? 'ring-2 ring-pink-500/50 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20' : 'card-gradient-accent'}`}>
          <div className={`h-1 ${isBirthdayToday ? 'bg-gradient-to-r from-pink-500 via-rose-400 to-orange-400' : 'bg-gradient-to-r from-pink-500 to-rose-400'}`} />
          <CardContent className="py-4">
            {isBirthdayToday ? (
              // Birthday today view
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-pink-200 to-rose-200 dark:from-pink-900/50 dark:to-rose-900/50 flex items-center justify-center shrink-0 shadow-inner">
                  <PartyPopper className="h-7 w-7 text-pink-600 dark:text-pink-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold bg-gradient-to-r from-pink-600 to-rose-500 bg-clip-text text-transparent">
                    🎉 Happy Birthday! 🎉
                  </h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    You are <span className="font-semibold text-foreground">{userAge} years young</span> today!
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-1 text-2xl">
                  🎂🎈🎁
                </div>
              </div>
            ) : (
              // Countdown view
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-pink-100 to-pink-50 dark:from-pink-950/30 dark:to-pink-900/10 flex items-center justify-center shrink-0 shadow-inner">
                  <Cake className="h-7 w-7 text-pink-500" />
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-3xl font-bold tracking-tight bg-gradient-to-r from-pink-600 to-rose-500 bg-clip-text text-transparent">
                    {birthdayCountdown}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    days until<br />your birthday
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* No birthday set */}
      {birthdayCountdown === null && !isBirthdayToday && user && !user.birthday && (
        <Card className="overflow-hidden shadow-sm card-gradient-accent">
          <div className="h-1 bg-gradient-to-r from-pink-500 to-rose-400" />
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-pink-100 to-pink-50 dark:from-pink-950/30 dark:to-pink-900/10 flex items-center justify-center shrink-0 shadow-inner">
                <Cake className="h-7 w-7 text-pink-500 opacity-50" />
              </div>
              <div>
                <p className="text-sm font-medium">No birthday set</p>
                <Link href="/settings" className="text-xs text-primary hover:underline">Add in settings →</Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Two-column layout: Events + Gifts ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
        {/* Upcoming Events - Scrollable */}
        <Card className="shadow-sm flex flex-col min-h-[280px] max-h-[400px]">
          <CardHeader className="pb-2 shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Upcoming Events ({upcomingEvents.length})
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/events">View all</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
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
              <div className="overflow-y-auto h-full pr-1 scrollbar-thin">
                <div className="space-y-2">
                  {upcomingEvents.map((event) => (
                    <Link
                      key={event.id}
                      href={`/events/${event.id}`}
                      className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-muted/60 hover:shadow-sm transition-all group"
                    >
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 flex flex-col items-center justify-center shrink-0 group-hover:from-primary/20 group-hover:to-primary/10 transition-colors shadow-inner text-primary">
                        <span className="text-[8px] font-medium uppercase leading-none">{format(new Date(event.date), "MMM")}</span>
                        <span className="text-sm font-bold leading-tight">{format(new Date(event.date), "d")}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">{event.title}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {format(new Date(event.date), "EEE, MMM d")}
                          {event.owner && event.user_id !== user?.id && <span> · {event.owner.display_name}</span>}
                        </p>
                      </div>
                      <Badge variant={event.daysAway <= 7 ? "default" : "secondary"} className="shrink-0 text-[10px] shadow-sm">
                        {event.daysAway === 0 ? "Today" : event.daysAway === 1 ? "Tomorrow" : `${event.daysAway}d`}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gifts to Buy - Compact grid */}
        <Card className="shadow-sm flex flex-col min-h-[280px] max-h-[400px]">
          <CardHeader className="pb-2 shrink-0">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Gifts to Buy ({claimedItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            {claimedItems.length === 0 ? (
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
              <div className="overflow-y-auto h-full pr-1 scrollbar-thin">
                <div className="grid grid-cols-3 gap-2">
                  {claimedItems.map((item) => (
                    <div
                      key={item.id}
                      className={`group rounded-lg ring-1 ring-foreground/5 overflow-hidden bg-card hover:shadow-md hover:ring-primary/20 transition-all ${item.gifted_at ? "opacity-50" : ""}`}
                    >
                      {/* Image */}
                      <div className="aspect-square bg-muted/40 relative overflow-hidden">
                        {item.image_url ? (
                          <img src={item.image_url} alt="" className={`h-full w-full object-contain p-1.5 transition-transform duration-300 group-hover:scale-105 ${item.gifted_at ? "grayscale" : ""}`} />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Gift className="h-4 w-4 text-muted-foreground/30" />
                          </div>
                        )}
                        {/* Gifted overlay */}
                        {item.gifted_at && (
                          <div className="absolute inset-0 bg-background/40 flex items-center justify-center">
                            <Gift className="h-3 w-3 text-muted-foreground/50" />
                          </div>
                        )}
                        {/* Quick actions on hover */}
                        <div className="absolute top-0.5 right-0.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
                          <Button variant="secondary" size="icon-xs" className="h-5 w-5 bg-background/90 backdrop-blur-sm shadow-sm" onClick={(e) => { e.stopPropagation(); window.open(item.link, "_blank", "noopener,noreferrer"); }}>
                            <ExternalLink className="h-2.5 w-2.5" />
                          </Button>
                          <Button variant="secondary" size="icon-xs" className="h-5 w-5 bg-background/90 backdrop-blur-sm shadow-sm text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); handleUnclaim(item.id); }}>
                            <X className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                      </div>
                      {/* Info - minimal */}
                      <div className="p-1.5">
                        {item.price && (
                          <p className="text-xs font-bold text-primary font-mono">${item.price.toFixed(0)}</p>
                        )}
                        <p className="text-[9px] text-muted-foreground truncate">
                          for {item.owner?.display_name?.split(" ")[0] ?? "friend"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}