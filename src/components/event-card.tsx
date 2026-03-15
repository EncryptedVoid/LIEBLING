"use client";

import { useState } from "react";
import Link from "next/link";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { MapPin, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

import type { Event, User } from "@/lib/types";

type EventCardProps = {
  event: Event & { collection_name?: string | null; owner?: User };
  onDelete?: (id: string) => void;
  onEdit?: (event: Event) => void;
  showOwnerBadge?: boolean;
};

export function EventCard({ event, onDelete, onEdit, showOwnerBadge = false }: EventCardProps) {
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

  // Format time display (this would ideally use user's preference)
  function formatTime(time: string) {
    const [hours, minutes] = time.split(":").map(Number);
    const ampm = hours >= 12 ? "PM" : "AM";
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes.toString().padStart(2, "0")} ${ampm}`;
  }

  return (
    <>
      <Card className="overflow-hidden group transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 card-gradient-accent relative h-full flex flex-col">
        {/* Banner image */}
        {event.banner_url && (
          <div className="h-20 overflow-hidden shrink-0">
            <img
              src={event.banner_url}
              alt=""
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        )}

        {/* Color accent bar (only if no banner) */}
        {!event.banner_url && (
          <div className={`h-1 shrink-0 ${past ? "bg-muted-foreground/20" : "bg-gradient-to-r from-primary/60 via-primary/20 to-transparent"}`} />
        )}

        {/* Owner badge (for timeline view) */}
        {showOwnerBadge && event.owner && (
          <div className="absolute top-2 right-2 z-10">
            <div className="flex items-center gap-1.5 bg-background/90 backdrop-blur-sm rounded-full pl-1 pr-2 py-0.5 shadow-sm ring-1 ring-foreground/10">
              <Avatar className="h-5 w-5">
                <AvatarImage src={event.owner.avatar_url ?? undefined} />
                <AvatarFallback className="text-[8px]">{event.owner.display_name[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="text-[10px] font-medium truncate max-w-[80px]">{event.owner.display_name.split(" ")[0]}</span>
            </div>
          </div>
        )}

        <Link href={`/events/${event.id}`} className="flex-1 flex flex-col">
          <CardContent className="p-4 flex gap-3 flex-1">
            {/* Date block */}
            <div className={`h-14 w-14 rounded-xl flex flex-col items-center justify-center shrink-0 transition-colors shadow-inner ${
              past ? "bg-muted text-muted-foreground" : "bg-gradient-to-br from-primary/15 to-primary/5 text-primary group-hover:from-primary/20 group-hover:to-primary/10"
            }`}>
              <span className="text-[10px] font-medium uppercase leading-none">{format(eventDate, "MMM")}</span>
              <span className="text-lg font-bold leading-tight">{format(eventDate, "d")}</span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2 flex-1">
                  {showOwnerBadge && event.owner ? `${event.owner.display_name.split(" ")[0]}'s ${event.title}` : event.title}
                </h3>
                <div className="flex items-center gap-1 shrink-0">
                  {!past && (
                    <Badge className="text-[10px] shadow-sm whitespace-nowrap">{formatDistanceToNow(eventDate, { addSuffix: true })}</Badge>
                  )}
                  {past && <Badge variant="outline" className="text-[10px]">Past</Badge>}
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">
                {format(eventDate, "EEEE, MMMM d, yyyy")}
                {event.time && ` at ${formatTime(event.time)}`}
              </p>

              {event.location && (
                <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5 line-clamp-1">
                  <MapPin className="h-2.5 w-2.5 shrink-0" />
                  <span className="truncate">{event.location}</span>
                </p>
              )}

              {/* Spacer to push collection badge to bottom */}
              <div className="flex-1 min-h-1" />

              {event.collection_name && (
                <Badge variant="secondary" className="mt-2 text-[10px] shadow-sm w-fit max-w-full truncate">{event.collection_name}</Badge>
              )}
            </div>

            {/* Three-dot menu */}
            {editable && (
              <div onClick={(e) => e.preventDefault()} className="shrink-0">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-32">
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(event)}>
                        <Pencil className="h-3 w-3 mr-2" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem
                        onClick={() => setShowDeleteDialog(true)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-3 w-3 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </CardContent>
        </Link>
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