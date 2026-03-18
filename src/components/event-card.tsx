"use client";

import { useState } from "react";
import Link from "next/link";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { MapPin, MoreHorizontal, Pencil, Trash2, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  const [deleteCollectionToo, setDeleteCollectionToo] = useState(false);

  const eventDate = new Date(event.date);
  const past = isPast(eventDate);
  const editable = !!onDelete || !!onEdit;

  async function handleDelete() {
    setDeleting(true);
    if (deleteCollectionToo && event.collection_id) {
      const { error: colErr } = await supabase.from("collections").delete().eq("id", event.collection_id);
      if (colErr) toast.error("Couldn't delete linked wishlist.");
    }
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
      <Card className="overflow-hidden group transition-all duration-400 glass-card gradient-border-card rounded-2xl relative h-full flex flex-col hover:-translate-y-1">
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
          <div className="h-1.5 shrink-0" style={{ background: past ? 'var(--muted)' : 'linear-gradient(90deg, var(--gradient-from), var(--gradient-to), var(--gradient-accent))' }} />
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
            <div className={`h-14 w-14 rounded-2xl flex flex-col items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-105 ${
              past ? "bg-muted text-muted-foreground" : ""
            }`} style={past ? {} : { background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))', color: 'var(--primary-foreground)', boxShadow: '0 4px 12px var(--glow)' }}>
              <span className="text-[10px] font-medium uppercase leading-none">{format(eventDate, "MMM")}</span>
              <span className="text-lg font-bold leading-tight">{format(eventDate, "d")}</span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-heading font-semibold text-base leading-snug group-hover:text-primary transition-colors line-clamp-2 flex-1">
                  {showOwnerBadge && event.owner ? `${event.owner.display_name.split(" ")[0]}'s ${event.title}` : event.title}
                </h3>
                <div className="flex items-center gap-1 shrink-0">
                  {event.visibility === "exclusive" && (
                    <Badge variant="secondary" className="gap-1 bg-muted/80 ml-1 text-[10px]"><Lock className="h-3 w-3" /> Exclusive</Badge>
                  )}
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
                <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5 max-w-full">
                  <MapPin className="h-2.5 w-2.5 shrink-0" />
                  <span className="truncate">
                    {(() => {
                      try {
                        const parsed = JSON.parse(event.location);
                        return parsed.name || parsed.address || event.location;
                      } catch {
                        return event.location;
                      }
                    })()}
                  </span>
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
            <AlertDialogDescription asChild>
              <div className="flex flex-col gap-4 mt-2">
                <p>This action cannot be undone.</p>
                {event.collection_id && event.collection_name && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="deleteCollection"
                      checked={deleteCollectionToo}
                      onCheckedChange={(c: boolean | string) => setDeleteCollectionToo(c === true)}
                    />
                    <label
                      htmlFor="deleteCollection"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Also delete linked wishlist &quot;{event.collection_name}&quot;
                    </label>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
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