"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

import type { Event, Collection } from "@/lib/types";

type EditEventDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event | null;
  collections: Collection[];
  onSaved?: () => void;
};

export function EditEventDialog({
  open,
  onOpenChange,
  event,
  collections,
  onSaved,
}: EditEventDialogProps) {
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [collectionId, setCollectionId] = useState("none");
  const [saving, setSaving] = useState(false);

  // Populate form when event changes
  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description ?? "");
      setDate(new Date(event.date));
      setTime(event.time ?? "");
      setLocation(event.location ?? "");
      setCollectionId(event.collection_id ?? "none");
    }
  }, [event, open]);

  async function handleSave() {
    if (!title.trim()) {
      toast.error("Event needs a title.");
      return;
    }
    if (!date) {
      toast.error("Pick a date.");
      return;
    }
    if (!event) return;

    setSaving(true);

    const { error } = await supabase
      .from("events")
      .update({
        title: title.trim(),
        description: description.trim() || null,
        date: format(date, "yyyy-MM-dd"),
        time: time || null,
        location: location.trim() || null,
        collection_id: collectionId !== "none" ? collectionId : null,
      })
      .eq("id", event.id);

    if (error) {
      toast.error("Couldn't update event.");
    } else {
      toast.success("Event updated.");
      onOpenChange(false);
      onSaved?.();
    }
    setSaving(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit event</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-2">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="editTitle">Title</Label>
            <Input
              id="editTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="editDesc">Description</Label>
            <Textarea
              id="editDesc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Date */}
          <div className="flex flex-col gap-1.5">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start font-normal">
                  {date ? format(date, "MMMM d, yyyy") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="editTime">Time</Label>
            <Input
              id="editTime"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>

          {/* Location */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="editLocation">Location</Label>
            <Input
              id="editLocation"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          {/* Collection */}
          <div className="flex flex-col gap-1.5">
            <Label>Wishlist collection</Label>
            <Select value={collectionId} onValueChange={setCollectionId}>
              <SelectTrigger>
                <SelectValue placeholder="Link a collection" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No collection</SelectItem>
                {collections.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}