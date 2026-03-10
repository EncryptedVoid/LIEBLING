"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

import type { Collection } from "@/lib/types";

export default function NewEventPage() {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [collectionId, setCollectionId] = useState("new");
  const [newCollectionName, setNewCollectionName] = useState("");
  const [collections, setCollections] = useState<Collection[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("collections")
      .select("*")
      .order("name")
      .then(({ data }) => setCollections(data ?? []));
  }, []);

  async function handleSave() {
    if (!title.trim()) {
      toast.error("Event needs a title.");
      return;
    }
    if (!date) {
      toast.error("Pick a date.");
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Not logged in.");

      let linkedCollectionId: string | null = null;

      // Create new collection if needed
      if (collectionId === "new" && newCollectionName.trim()) {
        const { data, error } = await supabase
          .from("collections")
          .insert({ user_id: user.id, name: newCollectionName.trim() })
          .select("id")
          .single();
        if (error) throw error;
        linkedCollectionId = data.id;
      } else if (collectionId !== "new" && collectionId !== "none") {
        linkedCollectionId = collectionId;
      }

      // Create event
      const { error } = await supabase.from("events").insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        date: format(date, "yyyy-MM-dd"),
        time: time || null,
        location: location.trim() || null,
        collection_id: linkedCollectionId,
      });

      if (error) throw error;

      toast.success("Event created!");
      router.push("/events");
    } catch (err: any) {
      toast.error(err.message || "Couldn't create event.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-semibold tracking-tight">New event</h1>
      <p className="text-muted-foreground mt-1">
        Create an event and link a wishlist collection to it.
      </p>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-base">Event details</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="e.g. My 30th Birthday"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Optional details about the event..."
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
            <Label htmlFor="time">Time</Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>

          {/* Location */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="e.g. Our house, The Grand Hotel"
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
                <SelectItem value="new">Create new collection</SelectItem>
                <SelectItem value="none">No collection</SelectItem>
                {collections.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* New collection name — shown only when "Create new" is selected */}
          {collectionId === "new" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="newCollection">Collection name</Label>
              <Input
                id="newCollection"
                placeholder="e.g. Birthday Wishes"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
              />
            </div>
          )}

          <Button onClick={handleSave} disabled={saving} className="mt-2">
            {saving ? "Creating..." : "Create event"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}