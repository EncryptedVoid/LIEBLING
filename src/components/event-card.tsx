import Link from "next/link";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { MapPin } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import type { Event } from "@/lib/types";

type EventCardProps = {
  event: Event & {
    collection_name: string | null;
  };
};

export function EventCard({ event }: EventCardProps) {
  const eventDate = new Date(event.date);
  const past = isPast(eventDate);

  return (
    <Link href={`/events/${event.id}`}>
      <Card className="hover:border-foreground/20 transition-colors cursor-pointer">
        <CardContent className="p-4 flex flex-col gap-2">
          {/* Title row */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-sm">{event.title}</h3>
            {past ? (
              <Badge variant="outline">Past</Badge>
            ) : (
              <Badge>{formatDistanceToNow(eventDate, { addSuffix: true })}</Badge>
            )}
          </div>

          {/* Date */}
          <p className="text-sm text-muted-foreground">
            {format(eventDate, "EEEE, MMMM d, yyyy")}
            {event.time && ` at ${event.time}`}
          </p>

          {/* Location */}
          {event.location && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {event.location}
            </p>
          )}

          {/* Linked collection */}
          {event.collection_name && (
            <Badge variant="secondary" className="w-fit mt-1">
              {event.collection_name}
            </Badge>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}