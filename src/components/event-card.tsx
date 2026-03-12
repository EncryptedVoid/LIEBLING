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
  event: Event & { collection_name?: string | null };
  onDelete?: (id: string) => void;
  onEdit?: (event: Event) => void;
};

export function EventCard({ event, onDelete, onEdit }: EventCardProps) {
  const supabase = createClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const eventDate = new Date(event.date);
  const past = isPast(eventDate);
  const editable = !!onDelete || !!onEdit;

  async function handleDelete() {
    setDeleting(true);
    const { error } = await supabase.from("events").delete().eq("id", event.id);
    if (error) { toast.error("Couldn't delete event."); } else { toast.success("Event deleted."); onDelete?.(event.id); }
    setDeleting(false);
    setShowDeleteDialog(false);
  }

  return (
    <>
      <Card className="overflow-hidden group transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 hover:ring-primary/20 card-gradient-accent">
        {/* Color accent */}
        <div className={`h-0.5 ${past ? "bg-muted-foreground/20" : "bg-gradient-to-r from-primary/60 via-primary/20 to-transparent"}`} />

        <Link href={`/events/${event.id}`}>
          <CardContent className="p-4 flex gap-3">
            {/* Date block */}
            <div className={`h-14 w-14 rounded-xl flex flex-col items-center justify-center shrink-0 transition-colors shadow-inner ${
              past ? "bg-muted text-muted-foreground" : "bg-gradient-to-br from-primary/15 to-primary/5 text-primary group-hover:from-primary/20 group-hover:to-primary/10"
            }`}>
              <span className="text-[10px] font-medium uppercase leading-none">{format(eventDate, "MMM")}</span>
              <span className="text-lg font-bold leading-tight">{format(eventDate, "d")}</span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium text-xs leading-snug group-hover:text-primary transition-colors">{event.title}</h3>
                {!past && (
                  <Badge className="shrink-0 text-[10px] shadow-sm">{formatDistanceToNow(eventDate, { addSuffix: true })}</Badge>
                )}
                {past && <Badge variant="outline" className="shrink-0 text-[10px]">Past</Badge>}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                {format(eventDate, "EEEE, MMMM d, yyyy")}{event.time && ` at ${event.time}`}
              </p>
              {event.location && (
                <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="h-2.5 w-2.5" />{event.location}
                </p>
              )}
              {event.collection_name && (
                <Badge variant="secondary" className="mt-1.5 text-[10px] shadow-sm">{event.collection_name}</Badge>
              )}
            </div>
          </CardContent>
        </Link>

        {/* Actions */}
        {editable && (
          <div className="px-4 pb-3 pt-0 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">
            {onEdit && (
              <Button variant="outline" size="sm" className="flex-1 gap-1 h-6 text-[10px]" onClick={() => onEdit(event)}>
                <Pencil className="h-2.5 w-2.5" />Edit
              </Button>
            )}
            {onDelete && (
              <Button variant="outline" size="sm" className="flex-1 gap-1 h-6 text-[10px] text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30" onClick={() => setShowDeleteDialog(true)}>
                <Trash2 className="h-2.5 w-2.5" />Delete
              </Button>
            )}
          </div>
        )}
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{event.title}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>Items in the linked collection won&apos;t be affected.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>{deleting ? "Deleting..." : "Delete"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}