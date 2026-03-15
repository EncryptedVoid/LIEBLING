"use client";

import { useMemo } from "react";
import Link from "next/link";
import { differenceInDays, format, isPast } from "date-fns";
import { CalendarDays, ArrowRight, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Event } from "@/lib/types";

type CollectionEventBannerProps = {
  event: Event;
  bannerUrl?: string | null;
};

export function CollectionEventBanner({
  event,
  bannerUrl,
}: CollectionEventBannerProps) {
  const eventDate = new Date(event.date);
  const isPastEvent = isPast(eventDate);

  const countdown = useMemo(() => {
    if (isPastEvent) return null;
    const days = differenceInDays(eventDate, new Date());
    if (days === 0) return "Today!";
    if (days === 1) return "Tomorrow";
    return `${days} days away`;
  }, [eventDate, isPastEvent]);

  return (
    <div className="relative h-40 -mx-4 mb-4 rounded-xl overflow-hidden group">
      {/* Background Image or Gradient */}
      {bannerUrl ? (
        <img
          src={bannerUrl}
          alt=""
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-background" />
      )}

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-4">
        {/* Event Badge */}
        <div className="flex items-center gap-2 mb-2">
          <Badge
            variant={isPastEvent ? "secondary" : "default"}
            className="shadow-lg text-xs"
          >
            <CalendarDays className="h-3 w-3 mr-1" />
            {isPastEvent ? "Past Event" : "Linked Event"}
          </Badge>

          {countdown && !isPastEvent && (
            <Badge variant="outline" className="bg-background/80 backdrop-blur-sm shadow-lg text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {countdown}
            </Badge>
          )}
        </div>

        {/* Event Title & Details */}
        <div className="flex items-end justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold tracking-tight text-foreground drop-shadow-sm truncate">
              {event.title}
            </h2>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                {format(eventDate, "EEEE, MMMM d, yyyy")}
              </span>
              {event.location && (
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="h-3 w-3" />
                  {event.location}
                </span>
              )}
            </div>
          </div>

          {/* View Event Button */}
          <Button
            asChild
            size="sm"
            variant="secondary"
            className="shrink-0 shadow-lg bg-background/90 backdrop-blur-sm hover:bg-background"
          >
            <Link href={`/events/${event.id}`}>
              View Event
              <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Countdown Accent Line */}
      {!isPastEvent && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/50 to-transparent" />
      )}
    </div>
  );
}