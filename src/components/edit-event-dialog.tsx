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
import { Plus, X, Link as LinkIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BannerUpload } from "@/components/banner-upload";
import { PrivacySelector } from "@/components/privacy-selector";
import { LocationPicker } from "@/components/location-picker";
import { toast } from "sonner";

import type { Event, Collection, User } from "@/lib/types";

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
  const [locationObj, setLocationObj] = useState<any>(null);
  const [collectionId, setCollectionId] = useState("none");
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [customLinks, setCustomLinks] = useState<{ label: string; url: string }[]>([]);
  const [visibility, setVisibility] = useState<"public" | "exclusive">("public");
  const [allowedUsers, setAllowedUsers] = useState<string[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    async function fetchFriends() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: friendships } = await supabase
        .from("friendships")
        .select("requester_id, addressee_id")
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq("status", "accepted");
        
      if (friendships && friendships.length > 0) {
        const friendIds = friendships.map((f) =>
          f.requester_id === user.id ? f.addressee_id : f.requester_id
        );
        const { data: friendProfiles } = await supabase.from("users").select("*").in("id", friendIds);
        setFriends(friendProfiles as User[] ?? []);
      }
    }
    fetchFriends();
  }, [open]);

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description ?? "");
      setDate(new Date(event.date));
      setTime(event.time ?? "");
      try {
        setLocationObj(event.location ? JSON.parse(event.location) : null);
      } catch {
        setLocationObj(event.location ? { name: event.location, address: "" } : null);
      }
      setCollectionId(event.collection_id ?? "none");
      setBannerUrl(event.banner_url ?? null);
      setCustomLinks(event.custom_links ?? []);
      setVisibility(event.visibility ?? "public");
      setAllowedUsers(event.allowed_users ?? []);
    }
  }, [event, open]);

  async function handleSave() {
    if (!title.trim()) { toast.error("Event needs a title."); return; }
    if (!date) { toast.error("Pick a date."); return; }
    if (!event) return;
    setSaving(true);

    const { error } = await supabase
      .from("events")
      .update({
        title: title.trim(),
        description: description.trim() || null,
        date: format(date, "yyyy-MM-dd"),
        time: time || null,
        location: locationObj ? JSON.stringify(locationObj) : null,
        collection_id: collectionId !== "none" ? collectionId : null,
        custom_links: customLinks,
        visibility: visibility,
        allowed_users: visibility === "exclusive" ? allowedUsers : [],
      })
      .eq("id", event.id);

    if (error) { toast.error("Couldn't update event."); }
    else { toast.success("Event updated."); onOpenChange(false); onSaved?.(); }
    setSaving(false);
  }

  function addCustomLink() {
    setCustomLinks([...customLinks, { label: "", url: "" }]);
  }

  function removeCustomLink(index: number) {
    setCustomLinks(customLinks.filter((_, i) => i !== index));
  }

  function updateCustomLink(index: number, field: "label" | "url", value: string) {
    const updated = [...customLinks];
    updated[index][field] = value;
    setCustomLinks(updated);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit event</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-2">
          {/* Banner upload */}
          {event && (
            <div className="flex flex-col gap-1.5">
              <Label>Banner Image</Label>
              <BannerUpload
                currentUrl={bannerUrl}
                entityType="event"
                entityId={event.id}
                onUploaded={(url) => setBannerUrl(url)}
              />
            </div>
          )}

          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="editTitle">Title</Label>
            <Input id="editTitle" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="editDesc">Description</Label>
            <Textarea id="editDesc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>

          {/* Date + Time — same row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start font-normal">
                    {date ? format(date, "MMM d, yyyy") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="editTime">Time</Label>
              <Input id="editTime" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>

          {/* Location */}
          <div className="flex flex-col gap-1.5 z-10">
            <Label>Location</Label>
            <LocationPicker
              value={locationObj}
              onChange={setLocationObj}
              apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}
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
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Links */}
          <div className="flex flex-col gap-2 pt-2 border-t">
            <div className="flex items-center justify-between">
              <Label>Custom Links</Label>
              <Button type="button" variant="outline" size="sm" onClick={addCustomLink} className="h-7 text-xs">
                <Plus className="h-3 w-3 mr-1" /> Add Link
              </Button>
            </div>
            {customLinks.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Add links to itineraries, registries, or venues.</p>
            ) : (
              <div className="space-y-2">
                {customLinks.map((link, idx) => (
                  <div key={idx} className="flex items-start gap-2 bg-muted/40 p-2 rounded-lg">
                    <div className="flex-1 space-y-2">
                      <Input
                        placeholder="Link Label (e.g., Itinerary)"
                        value={link.label}
                        onChange={(e) => updateCustomLink(idx, "label", e.target.value)}
                        className="h-8 text-sm"
                      />
                      <Input
                        placeholder="URL (https://...)"
                        value={link.url}
                        onChange={(e) => updateCustomLink(idx, "url", e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0" onClick={() => removeCustomLink(idx)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Privacy Selector */}
          <div className="pt-2">
            <PrivacySelector
              visibility={visibility}
              setVisibility={setVisibility}
              allowedUsers={allowedUsers}
              setAllowedUsers={setAllowedUsers}
              friends={friends}
            />
          </div>

          <Button onClick={handleSave} disabled={saving} className="shadow-sm mt-2">
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}