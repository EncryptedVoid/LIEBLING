"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { Info, Plus, Calendar, Link2, Sparkles } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { EmojiPicker } from "@/components/emoji-picker";
import { toast } from "sonner";

import type { Event } from "@/lib/types";

type NewCollectionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
};

export function NewCollectionDialog({
  open,
  onOpenChange,
  onCreated,
}: NewCollectionDialogProps) {
  const supabase = createClient();

  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState<string>("🎁");
  const [saving, setSaving] = useState(false);

  // Event linking
  const [linkToEvent, setLinkToEvent] = useState<"none" | "existing" | "new">("none");
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState<Date | undefined>();
  const [loadingEvents, setLoadingEvents] = useState(false);

  // Fetch user's events that don't have a collection linked
  useEffect(() => {
    if (open && linkToEvent === "existing") {
      fetchEvents();
    }
  }, [open, linkToEvent]);

  async function fetchEvents() {
    setLoadingEvents(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get events that don't have a collection_id
    const { data } = await supabase
      .from("events")
      .select("*")
      .eq("user_id", user.id)
      .is("collection_id", null)
      .order("date", { ascending: true });

    setEvents(data ?? []);
    setLoadingEvents(false);
  }

  async function handleCreate() {
    // Validation
    if (!name.trim()) {
      toast.error("Collection needs a name.");
      return;
    }
    if (!emoji) {
      toast.error("Please choose an emoji for your collection.");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in.");

      // Create the collection
      const { data: newCollection, error: colErr } = await supabase
        .from("collections")
        .insert({
          user_id: user.id,
          name: name.trim(),
          emoji: emoji,
        })
        .select("id")
        .single();
      if (colErr) throw colErr;

      // Handle event linking
      if (linkToEvent === "existing" && selectedEventId) {
        // Check if event already has a collection (double-check)
        const { data: event } = await supabase
          .from("events")
          .select("collection_id")
          .eq("id", selectedEventId)
          .single();

        if (event?.collection_id) {
          toast.error("This event already has a collection linked.");
          // Still created the collection, just didn't link
        } else {
          await supabase
            .from("events")
            .update({ collection_id: newCollection.id })
            .eq("id", selectedEventId);
        }
      } else if (linkToEvent === "new" && newEventTitle.trim() && newEventDate) {
        // Create new event and link
        const { error: eventErr } = await supabase.from("events").insert({
          user_id: user.id,
          title: newEventTitle.trim(),
          date: format(newEventDate, "yyyy-MM-dd"),
          collection_id: newCollection.id,
        });
        if (eventErr) throw eventErr;
      }

      toast.success(`"${name.trim()}" created!`);
      resetForm();
      onOpenChange(false);
      onCreated?.();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setName("");
    setEmoji("🎁");
    setLinkToEvent("none");
    setSelectedEventId("");
    setNewEventTitle("");
    setNewEventDate(undefined);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetForm(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Create a Collection
          </DialogTitle>
          <DialogDescription>
            Organize your wishlist items into collections
          </DialogDescription>
        </DialogHeader>

        {/* Info box */}
        <div className="bg-muted/50 rounded-lg p-3 flex gap-3">
          <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground leading-relaxed">
            <p>
              <strong>Collections</strong> help you organize your wishlist items by category or occasion.
              For example: "Birthday Wishes", "Kitchen Items", or "Books to Read".
            </p>
            <p className="mt-1.5">
              You can also link a collection to an <strong>event</strong> so friends know what items are for a specific occasion.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 mt-2">
          {/* Name + Emoji */}
          <div className="flex flex-col gap-1.5">
            <Label>
              Name & Icon <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-2">
              <EmojiPicker value={emoji} onChange={(e) => setEmoji(e || "🎁")} />
              <Input
                placeholder="e.g. Birthday Wishes, Kitchen Items"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1"
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Choose an emoji to make your collection easy to identify
            </p>
          </div>

          {/* Event linking */}
          <div className="flex flex-col gap-1.5">
            <Label className="flex items-center gap-1.5">
              <Link2 className="h-3 w-3" />
              Link to Event
              <Badge variant="secondary" className="text-[9px]">Optional</Badge>
            </Label>
            <Select value={linkToEvent} onValueChange={(v: "none" | "existing" | "new") => setLinkToEvent(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Don't link to an event" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Don't link to an event</SelectItem>
                <SelectItem value="existing">Link to existing event</SelectItem>
                <SelectItem value="new">Create new event</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Existing event picker */}
          {linkToEvent === "existing" && (
            <div className="flex flex-col gap-1.5 pl-4 border-l-2 border-primary/20">
              <Label>Select Event</Label>
              {loadingEvents ? (
                <p className="text-xs text-muted-foreground">Loading events...</p>
              ) : events.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No events available. All your events already have collections linked.
                </p>
              ) : (
                <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an event" />
                  </SelectTrigger>
                  <SelectContent>
                    {events.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span>{event.title}</span>
                          <span className="text-muted-foreground text-[10px]">
                            {format(new Date(event.date), "MMM d")}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* New event form */}
          {linkToEvent === "new" && (
            <div className="flex flex-col gap-3 pl-4 border-l-2 border-primary/20">
              <div className="flex flex-col gap-1.5">
                <Label>Event Title</Label>
                <Input
                  placeholder="e.g. My 30th Birthday"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Event Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start font-normal">
                      {newEventDate ? format(newEventDate, "MMMM d, yyyy") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={newEventDate}
                      onSelect={setNewEventDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          <Button
            onClick={handleCreate}
            disabled={saving || !name.trim() || !emoji}
            className="shadow-sm"
          >
            {saving ? "Creating..." : "Create Collection"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}