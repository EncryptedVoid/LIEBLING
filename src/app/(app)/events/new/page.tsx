"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { format, formatDistanceToNow, isFuture } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { MapPin, CalendarDays, ImagePlus, Loader2, Link2, Check, Info } from "lucide-react";
import { formatTimeDisplay } from "@/lib/time-format";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TimeInput } from "@/components/ui/time-input";
import { toast } from "sonner";

import type { Collection } from "@/lib/types";

export default function NewEventPage() {
  const router = useRouter();
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [collectionId, setCollectionId] = useState("new");
  const [newCollectionName, setNewCollectionName] = useState("");
  const [collections, setCollections] = useState<Collection[]>([]);
  const [saving, setSaving] = useState(false);
  const [timeFormat, setTimeFormat] = useState<"12h" | "24h">("12h");

  // Banner state
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [useCollectionBanner, setUseCollectionBanner] = useState(false);
  const [keepBannersInSync, setKeepBannersInSync] = useState(true);

  // Get selected collection's banner if linking to existing
  const selectedCollection = collections.find((c) => c.id === collectionId);
  const collectionHasBanner = selectedCollection?.banner_url;

  useEffect(() => {
    async function load() {
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
      const { data: cols } = await supabase.from("collections").select("*").order("name");
      setCollections(cols ?? []);
    }
    load();
  }, []);

  // Auto-set collection name from event title
  useEffect(() => {
    if (collectionId === "new" && title.trim() && !newCollectionName) {
      setNewCollectionName(title.trim());
    }
  }, [title, collectionId]);

  // Reset useCollectionBanner when changing collection
  useEffect(() => {
    if (collectionId !== "none" && collectionId !== "new" && collectionHasBanner) {
      setUseCollectionBanner(true);
    } else {
      setUseCollectionBanner(false);
    }
  }, [collectionId, collectionHasBanner]);

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
    setBannerPreview(objectUrl);
    setBannerFile(file);
    setUseCollectionBanner(false);
  }

  function removeBanner() {
    setBannerPreview(null);
    setBannerFile(null);
  }

  async function uploadBanner(eventId: string): Promise<string | null> {
    if (!bannerFile) return null;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const ext = bannerFile.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/event/${eventId}/banner.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("banners")
      .upload(path, bannerFile, { upsert: true, contentType: bannerFile.type });

    if (uploadErr) throw uploadErr;

    const { data: { publicUrl } } = supabase.storage.from("banners").getPublicUrl(path);
    return `${publicUrl}?t=${Date.now()}`;
  }

  // Determine the final banner URL to use
  function getFinalBannerUrl(): string | null {
    if (useCollectionBanner && collectionHasBanner) {
      return selectedCollection!.banner_url;
    }
    return bannerPreview ? "pending_upload" : null;
  }

  // Check if we have a valid banner
  const hasValidBanner = bannerPreview || (useCollectionBanner && collectionHasBanner);

  async function handleSave() {
    if (!title.trim()) { toast.error("Event needs a title."); return; }
    if (!date) { toast.error("Pick a date."); return; }
    if (!hasValidBanner) { toast.error("Please add a banner image for your event."); return; }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in.");

      let linkedCollectionId: string | null = null;
      let finalBannerUrl: string | null = null;

      // Create event first to get ID for banner upload
      const { data: newEvent, error: eventErr } = await supabase.from("events").insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        date: format(date, "yyyy-MM-dd"),
        time: time || null,
        location: location.trim() || null,
        collection_id: null, // Will update after
      }).select("id").single();

      if (eventErr) throw eventErr;

      // Handle banner upload or use collection banner
      if (useCollectionBanner && collectionHasBanner) {
        finalBannerUrl = selectedCollection!.banner_url;
      } else if (bannerFile) {
        finalBannerUrl = await uploadBanner(newEvent.id);
      }

      // Update event with banner
      if (finalBannerUrl) {
        await supabase.from("events").update({ banner_url: finalBannerUrl }).eq("id", newEvent.id);
      }

      // Handle collection linking
      if (collectionId === "new" && newCollectionName.trim()) {
        // Create new collection with same banner
        const { data: newCol, error: colErr } = await supabase.from("collections").insert({
          user_id: user.id,
          name: newCollectionName.trim(),
          banner_url: keepBannersInSync ? finalBannerUrl : null,
        }).select("id").single();
        if (colErr) throw colErr;
        linkedCollectionId = newCol.id;
      } else if (collectionId !== "new" && collectionId !== "none") {
        linkedCollectionId = collectionId;

        // 5B: Sync banner to existing collection if option enabled
        if (keepBannersInSync && finalBannerUrl && !useCollectionBanner) {
          await supabase.from("collections").update({ banner_url: finalBannerUrl }).eq("id", collectionId);
        }
      }

      // Update event with collection link
      if (linkedCollectionId) {
        await supabase.from("events").update({ collection_id: linkedCollectionId }).eq("id", newEvent.id);
      }

      toast.success("Event created!");
      router.push("/events");
    } catch (err: any) {
      toast.error(err.message || "Couldn't create event.");
    } finally {
      setSaving(false);
    }
  }

  const previewDate = date ? new Date(date) : null;
  const displayBanner = useCollectionBanner && collectionHasBanner ? selectedCollection!.banner_url : bannerPreview;

  return (
    <div className="page-enter max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold tracking-tight">New event</h1>
      <p className="text-muted-foreground mt-1 text-xs">Create an event and link a wishlist collection to it.</p>

      <div className="flex gap-6 mt-8">
        {/* Form */}
        <Card className="flex-1">
          <CardHeader><CardTitle className="text-base">Event details</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-4">
            {/* Banner Upload - Required */}
            <div className="flex flex-col gap-1.5">
              <Label>
                Banner Image <span className="text-destructive">*</span>
              </Label>

              {/* Show option to use collection banner if available */}
              {collectionHasBanner && collectionId !== "new" && collectionId !== "none" && (
                <div className="mb-2">
                  <button
                    onClick={() => {
                      setUseCollectionBanner(!useCollectionBanner);
                      if (!useCollectionBanner) {
                        setBannerPreview(null);
                        setBannerFile(null);
                      }
                    }}
                    className={`flex items-center gap-3 w-full rounded-lg border-2 p-3 text-left transition-all ${
                      useCollectionBanner
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-muted-foreground/20"
                    }`}
                  >
                    <div className="h-12 w-20 rounded overflow-hidden shrink-0">
                      <img src={selectedCollection!.banner_url!} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">Use collection banner</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        From "{selectedCollection!.name}"
                      </p>
                    </div>
                    <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      useCollectionBanner ? "border-primary bg-primary" : "border-muted-foreground/30"
                    }`}>
                      {useCollectionBanner && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                  </button>
                </div>
              )}

              {/* Custom banner upload */}
              {!useCollectionBanner && (
                <>
                  {displayBanner ? (
                    <div className="relative group rounded-lg overflow-hidden">
                      <img src={displayBanner} alt="Banner preview" className="w-full h-32 object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                        <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>Change</Button>
                        <Button variant="secondary" size="sm" onClick={removeBanner} className="text-destructive hover:text-destructive">Remove</Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="w-full h-28 rounded-lg border-2 border-dashed border-muted-foreground/20 hover:border-primary/40 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground"
                    >
                      <ImagePlus className="h-6 w-6" />
                      <span className="text-xs">Click to upload banner (required)</span>
                    </button>
                  )}
                </>
              )}

              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleBannerSelect} />
            </div>

            {/* Title */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="title">Title</Label>
              <Input id="title" placeholder="e.g. My 30th Birthday" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Optional details..." value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
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
                <Label>Time</Label>
                <TimeInput value={time} onChange={setTime} format={timeFormat} />
              </div>
            </div>

            {/* Location */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="location">Location</Label>
              <Input id="location" placeholder="e.g. Our house, The Grand Hotel" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>

            {/* Collection — choice + name on same row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Wishlist collection</Label>
                <Select value={collectionId} onValueChange={(v) => {
                  setCollectionId(v);
                  if (v === "new" && title.trim()) setNewCollectionName(title.trim());
                }}>
                  <SelectTrigger><SelectValue placeholder="Link a collection" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Create new collection</SelectItem>
                    <SelectItem value="none">No collection</SelectItem>
                    {collections.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <div className="flex items-center gap-2">
                          {c.emoji && <span>{c.emoji}</span>}
                          <span>{c.name}</span>
                          {c.banner_url && <Badge variant="outline" className="text-[8px] ml-1">Has banner</Badge>}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="newCollection">Collection name</Label>
                <Input
                  id="newCollection"
                  placeholder="e.g. Birthday Wishes"
                  value={collectionId === "new" ? newCollectionName : ""}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  disabled={collectionId !== "new"}
                  className={collectionId !== "new" ? "opacity-40" : ""}
                />
              </div>
            </div>

            {/* Banner Sync Option */}
            {/* {(collectionId === "new" || (collectionId !== "none" && !useCollectionBanner && hasValidBanner)) && (
              <div className="bg-muted/50 rounded-lg p-3 flex items-start gap-3">
                <Link2 className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="flex-1">
                  <button
                    onClick={() => setKeepBannersInSync(!keepBannersInSync)}
                    className="flex items-center gap-2 text-xs font-medium"
                  >
                    <div className={`h-4 w-4 rounded border-2 flex items-center justify-center transition-colors ${
                      keepBannersInSync ? "border-primary bg-primary" : "border-muted-foreground/30"
                    }`}>
                      {keepBannersInSync && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                    </div>
                    Keep banners in sync
                  </button>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {collectionId === "new"
                      ? "The new collection will use the same banner as this event."
                      : "This will update the collection's banner to match the event."}
                  </p>
                </div>
              </div>
            )} */}

            <Button onClick={handleSave} disabled={saving || !hasValidBanner} className="mt-2 shadow-sm">
              {saving ? "Creating..." : "Create event"}
            </Button>
          </CardContent>
        </Card>

        {/* Live preview */}
        <div className="hidden md:block w-56 shrink-0">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium mb-3">Preview</p>
          <Card className="overflow-hidden shadow-sm card-gradient-accent">
            {/* Banner preview */}
            {displayBanner && (
              <div className="h-20 overflow-hidden">
                <img src={displayBanner} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            {!displayBanner && (
              <div className="h-0.5 bg-gradient-to-r from-primary/60 via-primary/20 to-transparent" />
            )}
            <CardContent className="p-4 flex gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex flex-col items-center justify-center shrink-0 shadow-inner text-primary">
                {previewDate ? (
                  <>
                    <span className="text-[9px] font-medium uppercase leading-none">{format(previewDate, "MMM")}</span>
                    <span className="text-base font-bold leading-tight">{format(previewDate, "d")}</span>
                  </>
                ) : (
                  <CalendarDays className="h-5 w-5 opacity-40" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-xs leading-snug truncate">{title || "Event title"}</h3>
                {previewDate && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {format(previewDate, "EEE, MMM d")}{time && ` at ${formatTimeDisplay(time, timeFormat)}`}
                  </p>
                )}
                {location && (
                  <p className="text-[10px] text-muted-foreground flex items-center gap-0.5 mt-0.5">
                    <MapPin className="h-2 w-2" />{location}
                  </p>
                )}
                {previewDate && isFuture(previewDate) && (
                  <Badge className="mt-1.5 text-[9px] shadow-sm">{formatDistanceToNow(previewDate, { addSuffix: true })}</Badge>
                )}
              </div>
            </CardContent>
          </Card>
          <p className="text-[10px] text-muted-foreground text-center mt-2">How it'll look</p>
        </div>
      </div>
    </div>
  );
}