"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  differenceInDays,
  differenceInHours,
  format,
  isBefore,
  setYear,
  addYears,
} from "date-fns";
import {
  Cake,
  CalendarDays,
  Gift,
  ExternalLink,
  X,
  Copy,
  Sparkles,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

import type { User, Item, Event } from "@/lib/types";

type ClaimedItem = Item & { owner?: User };
type UpcomingEvent = Event & { owner?: User; daysAway: number };

export default function DashboardPage() {
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [birthdayCountdown, setBirthdayCountdown] = useState<number | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [claimedItems, setClaimedItems] = useState<ClaimedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    setLoading(true);

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) return;

    // Get profile
    const { data: profile } = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .single();
    setUser(profile as User);

    // Birthday countdown
    if (profile?.birthday) {
      const bday = new Date(profile.birthday);
      const now = new Date();
      let nextBday = setYear(bday, now.getFullYear());
      if (isBefore(nextBday, now)) {
        nextBday = addYears(nextBday, 1);
      }
      setBirthdayCountdown(differenceInDays(nextBday, now));
    }

    // Get friends
    const { data: friendships } = await supabase
      .from("friendships")
      .select("requester_id, addressee_id")
      .or(`requester_id.eq.${authUser.id},addressee_id.eq.${authUser.id}`)
      .eq("status", "accepted");

    const friendIds = (friendships ?? []).map((f) =>
      f.requester_id === authUser.id ? f.addressee_id : f.requester_id
    );

    // Friend profiles
    let profileMap = new Map<string, User>();
    if (friendIds.length > 0) {
      const { data: friendProfiles } = await supabase
        .from("users")
        .select("*")
        .in("id", friendIds);
      profileMap = new Map(
        (friendProfiles ?? []).map((p: any) => [p.id, p as User])
      );
    }

    // Upcoming events (mine + friends')
    const allUserIds = [authUser.id, ...friendIds];
    const now = new Date();
    const { data: eventsData } = await supabase
      .from("events")
      .select("*")
      .in("user_id", allUserIds)
      .gte("date", format(now, "yyyy-MM-dd"))
      .order("date", { ascending: true })
      .limit(6);

    const events: UpcomingEvent[] = (eventsData ?? []).map((e: any) => ({
      ...e,
      owner:
        e.user_id === authUser.id ? (profile as User) : profileMap.get(e.user_id),
      daysAway: differenceInDays(new Date(e.date), now),
    }));
    setUpcomingEvents(events);

    // Items I've claimed from friends
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

  async function handleUnclaim(itemId: string) {
    const { error } = await supabase.rpc("unclaim_item", { item_id: itemId });
    if (error) {
      toast.error("Couldn't unclaim.");
    } else {
      toast.success("Unclaimed.");
      setClaimedItems((prev) => prev.filter((i) => i.id !== itemId));
    }
  }

  function copyFriendCode() {
    if (!user?.friend_code) return;
    navigator.clipboard.writeText(user.friend_code);
    toast.success("Friend code copied!");
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 rounded bg-muted animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
        <div className="h-64 rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Sparkles className="h-5 w-5 text-primary" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Hey, {user?.display_name?.split(" ")[0]}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Here&apos;s what&apos;s happening with your wishlists.
          </p>
        </div>
      </div>

      {/* ── Top cards row ─────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Birthday countdown */}
        <Card className="overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-pink-500 to-rose-400" />
          <CardContent className="pt-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-pink-100 dark:bg-pink-950/30 flex items-center justify-center shrink-0">
              <Cake className="h-6 w-6 text-pink-500" />
            </div>
            <div>
              {birthdayCountdown !== null ? (
                <>
                  <p className="text-2xl font-bold tracking-tight">
                    {birthdayCountdown}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    days until your birthday
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium">No birthday set</p>
                  <Link
                    href="/settings"
                    className="text-xs text-primary hover:underline"
                  >
                    Add in settings →
                  </Link>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Next event */}
        <Card className="overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-blue-500 to-cyan-400" />
          <CardContent className="pt-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center shrink-0">
              <CalendarDays className="h-6 w-6 text-blue-500" />
            </div>
            <div className="min-w-0">
              {upcomingEvents.length > 0 ? (
                <>
                  <p className="text-sm font-medium truncate">
                    {upcomingEvents[0].title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    in {upcomingEvents[0].daysAway} days
                    {upcomingEvents[0].owner &&
                      upcomingEvents[0].user_id !== user?.id && (
                        <span>
                          {" "}
                          · {upcomingEvents[0].owner.display_name.split(" ")[0]}
                        </span>
                      )}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No upcoming events
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Friend code */}
        <Card className="overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-violet-500 to-purple-400" />
          <CardContent className="pt-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-violet-100 dark:bg-violet-950/30 flex items-center justify-center shrink-0">
              <Gift className="h-6 w-6 text-violet-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-1">
                Your friend code
              </p>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold tracking-wider text-sm">
                  {user?.friend_code}
                </span>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={copyFriendCode}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Upcoming events list ──────────────────────── */}
      {upcomingEvents.length > 0 && (
        <Card className="mt-6">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Upcoming Events</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/events">View all</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="flex items-center gap-3 rounded-lg p-2 -mx-2 hover:bg-muted/60 transition-colors"
                >
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <CalendarDays className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">
                      {event.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {format(new Date(event.date), "MMM d, yyyy")}
                      {event.owner && event.user_id !== user?.id && (
                        <span>
                          {" "}
                          · {event.owner.display_name}
                        </span>
                      )}
                    </p>
                  </div>
                  <Badge
                    variant={event.daysAway <= 7 ? "default" : "secondary"}
                    className="shrink-0"
                  >
                    {event.daysAway === 0
                      ? "Today"
                      : event.daysAway === 1
                        ? "Tomorrow"
                        : `${event.daysAway}d`}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Claimed items (gifts to buy) ─────────────── */}
      <Card className="mt-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Gift className="h-4 w-4" />
            Gifts to Buy ({claimedItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {claimedItems.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-xs text-muted-foreground">
                No claimed items yet. Browse your friends&apos; wishlists to
                claim gifts.
              </p>
              <Button variant="outline" size="sm" className="mt-3" asChild>
                <Link href="/wishlist">Go to wishlists</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {claimedItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-lg p-2 -mx-2 hover:bg-muted/40 transition-colors group"
                >
                  {/* Image */}
                  <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden shrink-0">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt=""
                        className="h-full w-full object-contain p-1"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Gift className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{item.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {item.price && (
                        <span className="text-[11px] text-muted-foreground">
                          ${item.price.toFixed(2)}
                        </span>
                      )}
                      {item.owner && (
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <span>·</span>
                          for {item.owner.display_name.split(" ")[0]}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() =>
                        window.open(item.link, "_blank", "noopener,noreferrer")
                      }
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleUnclaim(item.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}