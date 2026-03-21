"use client";

import { useState, useMemo, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { differenceInDays, format } from "date-fns";
import {
  ExternalLink,
  Check,
  Undo2,
  X,
  User as UserIcon,
  CalendarDays,
  Clock,
  ShoppingBag,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import type { Item, User, Event } from "@/lib/types";

type ClaimedItem = Item & { owner?: User };

type GiftsToBuyModalProps = {
  isOpen: boolean;
  onClose: () => void;
  items: ClaimedItem[];
  onUpdate: () => void;
};

type ViewMode = "by-person" | "by-event";

type PersonGroup = {
  user: User;
  items: ClaimedItem[];
};

type EventGroup = {
  event: Event;
  daysUntil: number;
  items: ClaimedItem[];
};

export function GiftsToBuyModal({
  isOpen,
  onClose,
  items,
  onUpdate,
}: GiftsToBuyModalProps) {
  const supabase = createClient();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("by-person");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [itemEventMap, setItemEventMap] = useState<Map<string, Event>>(new Map());

  // Fetch events linked to claimed items
  useEffect(() => {
    if (!isOpen || items.length === 0) return;
    async function fetchEvents() {
      const ownerIds = [...new Set(items.map((i) => i.user_id))];
      if (ownerIds.length === 0) return;

      const { data: eventsData } = await supabase
        .from("events")
        .select("*")
        .in("user_id", ownerIds)
        .not("collection_id", "is", null);

      if (!eventsData) return;
      setEvents(eventsData as Event[]);

      // Build item -> event map via collection_ids
      const map = new Map<string, Event>();
      for (const item of items) {
        if (!item.collection_ids) continue;
        for (const colId of item.collection_ids) {
          const evt = eventsData.find((e: any) => e.collection_id === colId);
          if (evt) {
            map.set(item.id, evt as Event);
            break;
          }
        }
      }
      setItemEventMap(map);
    }
    fetchEvents();
  }, [isOpen, items]);

  // Group by person
  const personGroups = useMemo<PersonGroup[]>(() => {
    const map = new Map<string, PersonGroup>();
    for (const item of items) {
      if (!item.owner) continue;
      const id = item.owner.id;
      if (!map.has(id)) {
        map.set(id, { user: item.owner, items: [] });
      }
      map.get(id)!.items.push(item);
    }
    return Array.from(map.values()).sort((a, b) =>
      a.user.display_name.localeCompare(b.user.display_name)
    );
  }, [items]);

  // Group by event
  const eventGroups = useMemo<EventGroup[]>(() => {
    const now = new Date();
    const map = new Map<string, EventGroup>();
    const unlinked: ClaimedItem[] = [];

    for (const item of items) {
      const evt = itemEventMap.get(item.id);
      if (evt) {
        if (!map.has(evt.id)) {
          map.set(evt.id, {
            event: evt,
            daysUntil: Math.max(0, differenceInDays(new Date(evt.date), now)),
            items: [],
          });
        }
        map.get(evt.id)!.items.push(item);
      } else {
        unlinked.push(item);
      }
    }

    const groups = Array.from(map.values()).sort(
      (a, b) => a.daysUntil - b.daysUntil
    );

    // Add "No Event" group for unlinked items
    if (unlinked.length > 0) {
      groups.push({
        event: {
          id: "__none__",
          user_id: "",
          collection_id: null,
          title: "No Event Linked",
          description: null,
          date: "",
          time: null,
          location: null,
          banner_url: null,
          visibility: "public",
          allowed_users: [],
          created_at: "",
        },
        daysUntil: -1,
        items: unlinked,
      });
    }

    return groups;
  }, [items, itemEventMap]);

  // Auto-select first group on open or mode switch
  useEffect(() => {
    if (!isOpen) { setSelectedId(null); return; }
    if (viewMode === "by-person" && personGroups.length > 0) {
      setSelectedId(personGroups[0].user.id);
    } else if (viewMode === "by-event" && eventGroups.length > 0) {
      setSelectedId(eventGroups[0].event.id);
    }
  }, [isOpen, viewMode, personGroups, eventGroups]);

  // Get active items for selected group
  const activeItems = useMemo(() => {
    if (!selectedId) return [];
    if (viewMode === "by-person") {
      return personGroups.find((g) => g.user.id === selectedId)?.items ?? [];
    }
    return eventGroups.find((g) => g.event.id === selectedId)?.items ?? [];
  }, [selectedId, viewMode, personGroups, eventGroups]);

  async function handleAction(
    action: "mark" | "unmark" | "unclaim",
    id: string
  ) {
    setLoadingId(id);
    const rpcName =
      action === "mark"
        ? "mark_item_bought"
        : action === "unmark"
        ? "unmark_item_bought"
        : "unclaim_item";

    const { error } = await supabase.rpc(rpcName, { item_id: id });
    if (error) {
      toast.error("Action failed.");
    } else {
      toast.success("Done!");
      onUpdate();
    }
    setLoadingId(null);
  }

  const unboughtCount = items.filter((i) => !i.bought_at).length;
  const boughtCount = items.filter((i) => i.bought_at).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[85vh] flex flex-col p-0 overflow-hidden bg-background/95 backdrop-blur-2xl border border-border/50 shadow-2xl rounded-2xl">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-border/40 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-heading font-bold gradient-text">
                Gifts to Buy
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {unboughtCount > 0 && (
                  <span className="font-medium">{unboughtCount} to buy</span>
                )}
                {unboughtCount > 0 && boughtCount > 0 && " · "}
                {boughtCount > 0 && (
                  <span>{boughtCount} bought</span>
                )}
              </p>
            </div>
            {eventGroups.some((g) => g.event.id !== "__none__") ? (
              <div className="flex ring-1 ring-foreground/10 rounded-xl overflow-hidden">
                <Button
                  variant={viewMode === "by-person" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-none gap-1.5 rounded-l-xl"
                  onClick={() => setViewMode("by-person")}
                >
                  <UserIcon className="h-3 w-3" />
                  By Person
                </Button>
                <Button
                  variant={viewMode === "by-event" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-none gap-1.5 rounded-r-xl"
                  onClick={() => setViewMode("by-event")}
                >
                  <CalendarDays className="h-3 w-3" />
                  By Event
                </Button>
              </div>
            ) : null}
          </div>
        </DialogHeader>

        {/* Body: Sidebar + Content */}
        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Left sidebar */}
          <div className="w-56 shrink-0 border-r border-border/40 overflow-y-auto scrollbar-thin bg-muted/10 p-2">
            {viewMode === "by-person" ? (
              <div className="flex flex-col gap-1">
                {personGroups.map((group) => {
                  const isActive = selectedId === group.user.id;
                  const unbought = group.items.filter((i) => !i.bought_at).length;
                  return (
                    <button
                      key={group.user.id}
                      onClick={() => setSelectedId(group.user.id)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200 ${
                        isActive
                          ? "text-primary-foreground shadow-lg"
                          : "hover:bg-muted/80"
                      }`}
                      style={
                        isActive
                          ? {
                              background:
                                "linear-gradient(135deg, var(--gradient-from), var(--gradient-to))",
                              boxShadow: "0 4px 12px var(--glow)",
                            }
                          : {}
                      }
                    >
                      <Avatar className="h-8 w-8 ring-2 ring-background shadow-sm shrink-0">
                        <AvatarImage
                          src={group.user.avatar_url ?? undefined}
                        />
                        <AvatarFallback className="text-[10px] font-semibold">
                          {group.user.display_name[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">
                          {group.user.display_name}
                        </p>
                        <p
                          className={`text-[10px] ${
                            isActive
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                          }`}
                        >
                          {group.items.length} gift
                          {group.items.length !== 1 ? "s" : ""}
                          {unbought > 0 && ` · ${unbought} left`}
                        </p>
                      </div>
                    </button>
                  );
                })}
                {personGroups.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    No gifts claimed yet.
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {eventGroups.map((group) => {
                  const isActive = selectedId === group.event.id;
                  const isNoEvent = group.event.id === "__none__";
                  const unbought = group.items.filter((i) => !i.bought_at).length;
                  return (
                    <button
                      key={group.event.id}
                      onClick={() => setSelectedId(group.event.id)}
                      className={`flex flex-col gap-1 rounded-xl px-3 py-2.5 text-left transition-all duration-200 ${
                        isActive
                          ? "text-primary-foreground shadow-lg"
                          : "hover:bg-muted/80"
                      }`}
                      style={
                        isActive
                          ? {
                              background:
                                "linear-gradient(135deg, var(--gradient-from), var(--gradient-to))",
                              boxShadow: "0 4px 12px var(--glow)",
                            }
                          : {}
                      }
                    >
                      <p className="text-xs font-medium truncate">
                        {group.event.title}
                      </p>
                      <div
                        className={`flex items-center gap-2 text-[10px] ${
                          isActive
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        }`}
                      >
                        {!isNoEvent && group.daysUntil >= 0 && (
                          <span className="flex items-center gap-0.5">
                            <Clock className="h-2.5 w-2.5" />
                            {group.daysUntil === 0
                              ? "Today"
                              : group.daysUntil === 1
                              ? "Tomorrow"
                              : `${group.daysUntil}d`}
                          </span>
                        )}
                        <span>
                          {group.items.length} gift
                          {group.items.length !== 1 ? "s" : ""}
                          {unbought > 0 && ` · ${unbought} left`}
                        </span>
                      </div>
                    </button>
                  );
                })}
                {eventGroups.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    No gifts claimed yet.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right content */}
          <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
            {/* Event countdown header (only in event view) */}
            {viewMode === "by-event" && selectedId && selectedId !== "__none__" && (
              (() => {
                const g = eventGroups.find((e) => e.event.id === selectedId);
                if (!g) return null;
                return (
                  <div className="mb-4 p-4 rounded-xl glass-card gradient-border-card flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-heading font-semibold">
                        {g.event.title}
                      </h3>
                      {g.event.date && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(new Date(g.event.date), "EEEE, MMMM d, yyyy")}
                        </p>
                      )}
                    </div>
                    {g.daysUntil >= 0 && (
                      <div className="text-center">
                        <p className="text-2xl font-heading font-bold gradient-text">
                          {g.daysUntil}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          days left
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()
            )}

            {/* Items grid */}
            {activeItems.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {activeItems.map((item) => {
                  const isBought = !!item.bought_at;
                  const owner = item.owner;
                  const initials =
                    owner?.display_name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2) ?? "?";

                  return (
                    <div
                      key={item.id}
                      className={`flex rounded-2xl overflow-hidden transition-all duration-300 glass-card gradient-border-card ${
                        isBought
                          ? "opacity-50"
                          : "hover:-translate-y-0.5 hover:shadow-lg"
                      }`}
                    >
                      {/* Image */}
                      <div
                        className="w-28 shrink-0 bg-muted/20 relative cursor-pointer group overflow-hidden"
                        onClick={() =>
                          window.open(item.link, "_blank", "noopener")
                        }
                      >
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt=""
                            className="h-full w-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <ShoppingBag className="h-6 w-6 text-muted-foreground/30" />
                          </div>
                        )}
                        {item.price && (
                          <div className="absolute top-2 left-2 bg-background/90 backdrop-blur-sm px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold shadow-sm border border-border/50 gradient-text">
                            ${item.price.toFixed(2)}
                          </div>
                        )}
                        {isBought && (
                          <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                            <Badge
                              variant="secondary"
                              className="gap-1 text-[10px]"
                            >
                              <Check className="h-2.5 w-2.5" /> Bought
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Info + Actions */}
                      <div className="flex-1 p-3 flex flex-col min-w-0">
                        {/* Owner (shown in event view) */}
                        {viewMode === "by-event" && owner && (
                          <div className="flex items-center gap-2 mb-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage
                                src={owner.avatar_url ?? undefined}
                              />
                              <AvatarFallback className="text-[8px]">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-[10px] text-muted-foreground">
                              For {owner.display_name}
                            </span>
                          </div>
                        )}

                        <p className="text-xs font-medium leading-snug line-clamp-2 flex-1">
                          {item.name}
                        </p>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-[10px] gap-1"
                            onClick={() =>
                              window.open(item.link, "_blank", "noopener")
                            }
                          >
                            <ExternalLink className="h-3 w-3" /> View
                          </Button>
                          {isBought ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-[10px] gap-1 flex-1"
                              onClick={() => handleAction("unmark", item.id)}
                              disabled={loadingId === item.id}
                            >
                              <Undo2 className="h-3 w-3" /> Undo
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              className="h-7 text-[10px] gap-1 flex-1 btn-gradient"
                              onClick={() => handleAction("mark", item.id)}
                              disabled={loadingId === item.id}
                            >
                              <Check className="h-3 w-3" /> Mark Bought
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="h-7 w-7 text-destructive hover:bg-destructive/10 shrink-0"
                            onClick={() => handleAction("unclaim", item.id)}
                            disabled={loadingId === item.id}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <ShoppingBag className="h-10 w-10 text-muted-foreground/20 mb-3" />
                <p className="text-sm text-muted-foreground">
                  {items.length === 0
                    ? "No gifts claimed yet."
                    : "Select a group from the sidebar."}
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}