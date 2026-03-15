"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  differenceInDays,
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
  QrCode,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [claimedItems, setClaimedItems] = useState<ClaimedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrOpen, setQrOpen] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    setLoading(true);
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;

    const { data: profile } = await supabase.from("users").select("*").eq("id", authUser.id).single();
    setUser(profile as User);

    if (profile?.birthday) {
      const bday = new Date(profile.birthday);
      const now = new Date();
      let nextBday = setYear(bday, now.getFullYear());
      if (isBefore(nextBday, now)) nextBday = addYears(nextBday, 1);
      setBirthdayCountdown(differenceInDays(nextBday, now));
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

  function copyFriendCode() {
    if (!user?.friend_code) return;
    navigator.clipboard.writeText(user.friend_code);
    toast.success("Friend code copied!");
  }

  const inviteUrl = typeof window !== "undefined" ? `${window.location.origin}/invite/${user?.friend_code}` : "";

  if (loading) {
    return (
      <div className="space-y-4 page-enter">
        <div className="h-8 w-48 rounded skeleton-shimmer" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-grid">
          {[1, 2].map((i) => <SkeletonStat key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-48 rounded-xl skeleton-shimmer" />
          <div className="h-48 rounded-xl skeleton-shimmer" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter flex flex-col gap-4">
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

      {/* ── Top stats row (2 cards only) ─────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Birthday */}
        <Card className="overflow-hidden card-gradient-accent shadow-sm hover:shadow-md transition-shadow">
          <div className="h-1 bg-gradient-to-r from-pink-500 to-rose-400" />
          <CardContent className="pt-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-pink-100 to-pink-50 dark:from-pink-950/30 dark:to-pink-900/10 flex items-center justify-center shrink-0 shadow-inner">
              <Cake className="h-6 w-6 text-pink-500" />
            </div>
            <div>
              {birthdayCountdown !== null ? (
                <>
                  <p className="text-3xl font-bold tracking-tight bg-gradient-to-r from-pink-600 to-rose-500 bg-clip-text text-transparent">
                    {birthdayCountdown}
                  </p>
                  <p className="text-xs text-muted-foreground">days until your birthday</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium">No birthday set</p>
                  <Link href="/settings" className="text-xs text-primary hover:underline">Add in settings →</Link>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Friend code + QR */}
        <Card className="overflow-hidden card-gradient-accent shadow-sm hover:shadow-md transition-shadow">
          <div className="h-1 bg-gradient-to-r from-violet-500 to-purple-400" />
          <CardContent className="pt-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-100 to-violet-50 dark:from-violet-950/30 dark:to-violet-900/10 flex items-center justify-center shrink-0 shadow-inner">
              <Gift className="h-6 w-6 text-violet-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-1">Your friend code</p>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold tracking-wider text-sm">{user?.friend_code}</span>
                <Button variant="ghost" size="icon-xs" onClick={copyFriendCode}>
                  <Copy className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon-xs" onClick={() => setQrOpen(true)}>
                  <QrCode className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Two-column layout: Events + Gifts ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
        {/* Upcoming Events - Scrollable */}
        <Card className="shadow-sm flex flex-col min-h-[280px] max-h-[360px]">
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

        {/* Gifts to Buy - Scrollable horizontal grid */}
        <Card className="shadow-sm flex flex-col min-h-[280px] max-h-[360px]">
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
                <div className="grid grid-cols-2 gap-2">
                  {claimedItems.map((item) => (
                    <div
                      key={item.id}
                      className={`group rounded-lg ring-1 ring-foreground/5 overflow-hidden bg-card hover:shadow-md hover:shadow-primary/5 transition-all card-gradient-accent ${item.gifted_at ? "opacity-60" : ""}`}
                    >
                      {/* Image */}
                      <div className="aspect-square bg-muted/40 relative overflow-hidden">
                        {item.image_url ? (
                          <img src={item.image_url} alt="" className={`h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-105 ${item.gifted_at ? "grayscale" : ""}`} />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Gift className="h-6 w-6 text-muted-foreground/30" />
                          </div>
                        )}
                        {/* Price badge */}
                        {item.price && (
                          <div className="absolute bottom-1.5 left-1.5">
                            <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm shadow-sm font-mono text-[10px] px-1.5 py-0">
                              ${item.price.toFixed(2)}
                            </Badge>
                          </div>
                        )}
                        {/* Gifted overlay */}
                        {item.gifted_at && (
                          <div className="absolute inset-0 bg-background/40 flex items-center justify-center">
                            <Badge variant="outline" className="shadow-sm gap-1 bg-background/80 backdrop-blur-sm text-[9px]">
                              <Gift className="h-2 w-2" /> Delivered
                            </Badge>
                          </div>
                        )}
                        {/* Quick actions on hover */}
                        <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                          <Button variant="secondary" size="icon-xs" className="h-6 w-6 bg-background/90 backdrop-blur-sm shadow-sm" onClick={() => window.open(item.link, "_blank", "noopener,noreferrer")}>
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                          <Button variant="secondary" size="icon-xs" className="h-6 w-6 bg-background/90 backdrop-blur-sm shadow-sm text-destructive hover:bg-destructive/10" onClick={() => handleUnclaim(item.id)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      {/* Info */}
                      <div className="p-2">
                        <p className="text-[11px] font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors">{item.name}</p>
                        {item.owner && (
                          <p className="text-[9px] text-muted-foreground mt-0.5 flex items-center gap-1">
                            for {item.owner.display_name.split(" ")[0]}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── QR Code Modal ─────────────────────────────── */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="sm:max-w-xs text-center">
          <DialogHeader>
            <DialogTitle>Share your code</DialogTitle>
            <DialogDescription>Have a friend scan this to connect with you.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 mt-2">
            <div className="rounded-2xl border p-5 bg-white shadow-lg">
              <QRCodeSVG value={inviteUrl} size={180} />
            </div>
            <div className="flex items-center gap-2 bg-muted rounded-lg px-4 py-2">
              <span className="font-mono font-bold tracking-wider text-sm">{user?.friend_code}</span>
              <Button variant="ghost" size="icon-xs" onClick={copyFriendCode}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              or share this link:
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => {
                navigator.clipboard.writeText(inviteUrl);
                toast.success("Link copied!");
              }}
            >
              <Copy className="h-3 w-3 mr-1.5" />
              Copy invite link
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}