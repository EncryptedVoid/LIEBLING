"use client";

import { useState } from "react";
import Link from "next/link";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { MapPin, Pencil, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

import type { Event } from "@/lib/types";

type EventCardProps = {
  event: Event & { collection_name: string | null };
  onDelete?: (id: string) => void;
  onEdit?: (event: Event) => void;
};

export function EventCard({ event, onDelete, onEdit }: EventCardProps) {
  const supabase = createClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const eventDate = new Date(event.date);
  const past = isPast(eventDate);

  async function handleDelete() {
    setDeleting(true);
    const { error } = await supabase.from("events").delete().eq("id", event.id);
    if (error) {
      toast.error("Couldn't delete event.");
    } else {
      toast.success("Event deleted.");
      onDelete?.(event.id);
    }
    setDeleting(false);
    setShowDeleteDialog(false);
  }

  return (
    <>
      <Card className="hover:border-primary/40 transition-colors">
        {/* Clickable area — navigates to event detail */}
        <Link href={`/events/${event.id}`}>
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
        </Link>

        {/* Action buttons — outside the link so they don't navigate */}
        <div className="px-4 pb-4 pt-0 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5"
            onClick={() => onEdit?.(event)}
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </Card>

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{event.title}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the event. Items in the linked collection won&apos;t be
              affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}