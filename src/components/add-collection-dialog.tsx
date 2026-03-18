"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import {
  Info,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Link2,
  Check,
  ImagePlus,
  Loader2,
  MapPin,
} from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
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
import { TimeInput } from "@/components/ui/time-input";
import { ImageCropperDialog } from "@/components/image-cropper-dialog";
import { PrivacySelector } from "@/components/privacy-selector";
import { toast } from "sonner";

import type { Event, User } from "@/lib/types";

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
  const fileRef = useRef<HTMLInputElement>(null);

  // Step management
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1: Collection basics
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState<string>("🎁");
  const [description, setDescription] = useState("");
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [visibility, setVisibility] = useState<"public" | "exclusive">("public");
  const [allowedUsers, setAllowedUsers] = useState<string[]>([]);
  const [friends, setFriends] = useState<User[]>([]);

  // Cropper states
  const [cropperOpen, setCropperOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);

  // Step 2: Event linking
  const [linkToEvent, setLinkToEvent] = useState(false);
  const [eventMode, setEventMode] = useState<"existing" | "new">("new");
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [loadingEvents, setLoadingEvents] = useState(false);

  // New event fields
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState<Date | undefined>();
  const [newEventTime, setNewEventTime] = useState("");
  const [newEventLocation, setNewEventLocation] = useState("");
  const [newEventDescription, setNewEventDescription] = useState("");
  const [timeFormat, setTimeFormat] = useState<"12h" | "24h">("12h");

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

  // Fetch user's events that don't have a collection linked
  useEffect(() => {
    if (open && linkToEvent && eventMode === "existing") {
      fetchEvents();
    }
  }, [open, linkToEvent, eventMode]);

  // Fetch user's time format preference
  useEffect(() => {
    if (open) {
      fetchTimeFormat();
    }
  }, [open]);

  // Auto-populate event title from collection name
  useEffect(() => {
    if (linkToEvent && eventMode === "new" && name.trim() && !newEventTitle) {
      setNewEventTitle(name.trim());
    }
  }, [name, linkToEvent, eventMode]);

  async function fetchTimeFormat() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("users")
        .select("time_format")
        .eq("id", user.id)
        .single();
      if (profile?.time_format) {
        setTimeFormat(profile.time_format);
      }
    }
  }

  async function fetchEvents() {
    setLoadingEvents(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("events")
      .select("*")
      .eq("user_id", user.id)
      .is("collection_id", null)
      .order("date", { ascending: true });

    setEvents(data ?? []);
    setLoadingEvents(false);
  }

  function handleBannerSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB.");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setRawImageSrc(objectUrl);
    setCropperOpen(true);
    
    // Clear input so selecting same file triggers onChange again
    if (fileRef.current) {
      fileRef.current.value = "";
    }
  }

  function handleCropComplete(file: File, url: string) {
    setBannerFile(file);
    setBannerPreview(url);
  }

  function removeBanner() {
    setBannerPreview(null);
    setBannerFile(null);
    setBannerUrl(null);
  }

  async function uploadBanner(collectionId: string): Promise<string | null> {
    if (!bannerFile) return bannerUrl;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const ext = bannerFile.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/collection/${collectionId}/banner.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("banners")
      .upload(path, bannerFile, { upsert: true, contentType: bannerFile.type });

    if (uploadErr) throw uploadErr;

    const { data: { publicUrl } } = supabase.storage.from("banners").getPublicUrl(path);
    return `${publicUrl}?t=${Date.now()}`;
  }

  function canProceedToStep2(): boolean {
    return !!name.trim() && !!emoji && (!!bannerPreview || !!bannerUrl);
  }

  async function handleCreate() {
    if (!name.trim()) {
      toast.error("Collection needs a name.");
      return;
    }
    if (!emoji) {
      toast.error("Please choose an emoji for your collection.");
      return;
    }
    if (!bannerPreview && !bannerUrl) {
      toast.error("Please upload a banner image.");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in.");

      // Create the collection first (without banner to get ID)
      const { data: newCollection, error: colErr } = await supabase
        .from("collections")
        .insert({
          user_id: user.id,
          name: name.trim(),
          emoji: emoji,
          description: description.trim() || null,
          visibility: visibility,
          allowed_users: visibility === "exclusive" ? allowedUsers : [],
        })
        .select("id")
        .single();
      if (colErr) throw colErr;

      // Upload banner and update collection
      const finalBannerUrl = await uploadBanner(newCollection.id);
      if (finalBannerUrl) {
        await supabase
          .from("collections")
          .update({ banner_url: finalBannerUrl })
          .eq("id", newCollection.id);
      }

      // Handle event linking
      if (linkToEvent) {
        if (eventMode === "existing" && selectedEventId) {
          const { data: event } = await supabase
            .from("events")
            .select("collection_id")
            .eq("id", selectedEventId)
            .single();

          if (event?.collection_id) {
            toast.error("This event already has a collection linked.");
          } else {
            await supabase
              .from("events")
              .update({
                collection_id: newCollection.id,
                banner_url: finalBannerUrl, // Sync banner to event
              })
              .eq("id", selectedEventId);
          }
        } else if (eventMode === "new" && newEventTitle.trim() && newEventDate) {
          const { error: eventErr } = await supabase.from("events").insert({
            user_id: user.id,
            title: newEventTitle.trim(),
            description: newEventDescription.trim() || null,
            date: format(newEventDate, "yyyy-MM-dd"),
            time: newEventTime || null,
            location: newEventLocation.trim() || null,
            collection_id: newCollection.id,
            banner_url: finalBannerUrl, // Use same banner
          });
          if (eventErr) throw eventErr;
        }
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
    setStep(1);
    setName("");
    setEmoji("🎁");
    setDescription("");
    setVisibility("public");
    setAllowedUsers([]);
    setBannerUrl(null);
    setBannerPreview(null);
    setBannerFile(null);
    setLinkToEvent(false);
    setEventMode("new");
    setSelectedEventId("");
    setNewEventTitle("");
    setNewEventDate(undefined);
    setNewEventTime("");
    setNewEventLocation("");
    setNewEventDescription("");
  }

  const displayBanner = bannerPreview || bannerUrl;

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetForm(); }}>
      <DialogContent className="sm:max-w-lg glass-card rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading">
            <div className="p-1.5 rounded-lg" style={{ background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))' }}>
              <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            Create a Collection
          </DialogTitle>
          <DialogDescription>
            {step === 1 ? "Set up your collection basics" : "Optionally link to an event"}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-2 flex-1">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300 ${
              step === 1 ? "text-primary-foreground shadow-lg" : "text-primary-foreground"
            }`} style={{ background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))' }}>
              {step > 1 ? <Check className="h-4 w-4" /> : "1"}
            </div>
            <span className={`text-xs font-medium ${step === 1 ? "text-foreground" : "text-muted-foreground"}`}>
              Basics
            </span>
          </div>
          <div className="h-px flex-1 gradient-line" />
          <div className="flex items-center gap-2 flex-1">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300 ${
              step === 2 ? "text-primary-foreground shadow-lg" : "bg-muted text-muted-foreground"
            }`} style={step === 2 ? { background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))' } : {}}>
              2
            </div>
            <span className={`text-xs font-medium ${step === 2 ? "text-foreground" : "text-muted-foreground"}`}>
              Event
            </span>
          </div>
        </div>

        {/* Step 1: Collection Basics */}
        {step === 1 && (
          <div className="flex flex-col gap-4 animate-in fade-in-50 slide-in-from-left-2 duration-200">
            {/* Banner Upload */}
            <div className="flex flex-col gap-1.5">
              <Label>
                Banner Image <span className="text-destructive">*</span>
              </Label>
              {displayBanner ? (
                <div className="relative group rounded-lg overflow-hidden">
                  <img
                    src={displayBanner}
                    alt="Banner preview"
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => fileRef.current?.click()}
                    >
                      Change
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={removeBanner}
                      className="text-destructive hover:text-destructive"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full h-28 rounded-lg border-2 border-dashed border-muted-foreground/20 hover:border-primary/40 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground"
                >
                  <ImagePlus className="h-6 w-6" />
                  <span className="text-xs">Click to upload banner</span>
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleBannerSelect}
              />
              <p className="text-[10px] text-muted-foreground">
                This banner will appear on your collection and linked events
              </p>
            </div>

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
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5 mt-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Give your collection a description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <p className="text-[10px] text-muted-foreground">
                Tip: Describe the items in the collection, the event theme, or types of items you like if friends want to get something else!
              </p>
            </div>

            {/* Navigation */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 btn-gradient rounded-xl shadow-lg"
                onClick={() => setStep(2)}
                disabled={!canProceedToStep2()}
              >
                Next
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Event Linking */}
        {step === 2 && (
          <div className="flex flex-col gap-4 animate-in fade-in-50 slide-in-from-right-2 duration-200">
            {/* Link to Event Toggle */}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setLinkToEvent(!linkToEvent)}
                className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                  linkToEvent
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-muted-foreground/20"
                }`}
              >
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                  linkToEvent ? "bg-primary/10" : "bg-muted"
                }`}>
                  <Link2 className={`h-5 w-5 ${linkToEvent ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Link to Event</p>
                  <p className="text-xs text-muted-foreground">
                    Connect this collection to an occasion
                  </p>
                </div>
                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  linkToEvent ? "border-primary bg-primary" : "border-muted-foreground/30"
                }`}>
                  {linkToEvent && <Check className="h-3 w-3 text-primary-foreground" />}
                </div>
              </button>
            </div>

            {/* Event Options (shown when toggle is on) */}
            {linkToEvent && (
              <div className="flex flex-col gap-3 pl-4 border-l-2 border-primary/20 animate-in fade-in-50 slide-in-from-top-2 duration-200">
                {/* Mode selection */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setEventMode("new")}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-lg border-2 p-2.5 text-xs font-medium transition-all ${
                      eventMode === "new"
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-muted-foreground/20"
                    }`}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Create new event
                  </button>
                  <button
                    onClick={() => setEventMode("existing")}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-lg border-2 p-2.5 text-xs font-medium transition-all ${
                      eventMode === "existing"
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-muted-foreground/20"
                    }`}
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    Link existing
                  </button>
                </div>

                {/* New Event Form */}
                {eventMode === "new" && (
                  <div className="flex flex-col gap-3 animate-in fade-in-50 duration-150">
                    <div className="flex flex-col gap-1.5">
                      <Label>Event Title</Label>
                      <Input
                        placeholder="e.g. My 30th Birthday"
                        value={newEventTitle}
                        onChange={(e) => setNewEventTitle(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1.5">
                        <Label>Date <span className="text-destructive">*</span></Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="justify-start font-normal text-xs">
                              {newEventDate ? format(newEventDate, "MMM d, yyyy") : "Pick a date"}
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
                      <div className="flex flex-col gap-1.5">
                        <Label>Time</Label>
                        <TimeInput
                          value={newEventTime}
                          onChange={setNewEventTime}
                          format={timeFormat}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label>Location</Label>
                      <div className="relative">
                        <MapPin className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          placeholder="e.g. Our house, The Grand Hotel"
                          value={newEventLocation}
                          onChange={(e) => setNewEventLocation(e.target.value)}
                          className="pl-7"
                        />
                      </div>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-2.5 flex items-start gap-2">
                      <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                      <p className="text-[10px] text-muted-foreground">
                        The collection banner will be used for this event automatically.
                      </p>
                    </div>
                  </div>
                )}

                {/* Existing Event Picker */}
                {eventMode === "existing" && (
                  <div className="flex flex-col gap-1.5 animate-in fade-in-50 duration-150">
                    <Label>Select Event</Label>
                    {loadingEvents ? (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground py-3">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Loading events...
                      </div>
                    ) : events.length === 0 ? (
                      <div className="text-xs text-muted-foreground py-3 text-center bg-muted/30 rounded-lg">
                        No events available. All your events already have collections linked.
                      </div>
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
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                Back
              </Button>
              <Button
                className="flex-1 btn-gradient rounded-xl shadow-lg"
                onClick={handleCreate}
                disabled={saving || (linkToEvent && eventMode === "new" && (!newEventTitle.trim() || !newEventDate))}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Collection"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>

      <ImageCropperDialog
        open={cropperOpen}
        onOpenChange={setCropperOpen}
        imageSrc={rawImageSrc}
        onCropComplete={handleCropComplete}
        aspectRatio={16 / 9}
      />
    </Dialog>
  );
}