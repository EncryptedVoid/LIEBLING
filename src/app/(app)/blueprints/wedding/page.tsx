"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { Heart, ArrowRight, ArrowLeft, Check, Loader2, CalendarDays, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const COUPLE_LABELS = [
  { value: "husband-wife", label: "Husband & Wife" },
  { value: "wife-wife", label: "Wife & Wife" },
  { value: "husband-husband", label: "Husband & Husband" },
  { value: "partners", label: "Partners" },
  { value: "custom", label: "Custom" },
];

const WEDDING_ITEMS = [
  "Dinnerware set", "Bedding set", "Kitchen appliance", "Luggage set",
  "Art / wall decor", "Towel set", "Honeymoon fund contribution", "Coffee maker",
];

export default function WeddingBlueprintPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 0: Partner
  const [partnerCode, setPartnerCode] = useState("");
  const [partnerName, setPartnerName] = useState<string | null>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [coupleLabel, setCoupleLabel] = useState("husband-wife");
  const [customLabel, setCustomLabel] = useState("");
  const [lookingUp, setLookingUp] = useState(false);

  // Step 1: Event details
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState<Date | undefined>();
  const [eventDescription, setEventDescription] = useState("");
  const [venue, setVenue] = useState("");

  async function lookupPartner() {
    if (!partnerCode.trim()) return;
    setLookingUp(true);
    const { data: target } = await supabase
      .from("users")
      .select("id, display_name")
      .eq("friend_code", partnerCode.trim().toUpperCase())
      .single();

    if (!target) { toast.error("No user found with that code."); }
    else {
      setPartnerName(target.display_name);
      setPartnerId(target.id);
      toast.success(`Found ${target.display_name}!`);
    }
    setLookingUp(false);
  }

  async function handleFinish() {
    if (!eventDate) { toast.error("Pick a date."); return; }
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in.");

      const title = eventTitle.trim() || "Our Wedding";
      const label = coupleLabel === "custom" ? customLabel.trim() : COUPLE_LABELS.find(l => l.value === coupleLabel)?.label;

      // 1. Create collection
      const { data: col, error: colErr } = await supabase.from("collections").insert({
        user_id: user.id,
        name: `${title} Registry`,
        emoji: "💒",
        banner_url: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=400&fit=crop&q=80",
        description: label ? `Registry for ${label}` : null,
      }).select("id").single();
      if (colErr) throw colErr;

      // 2. Create event
      const { data: evt, error: evtErr } = await supabase.from("events").insert({
        user_id: user.id,
        title,
        description: eventDescription.trim() || null,
        date: format(eventDate, "yyyy-MM-dd"),
        location: venue.trim() || null,
        collection_id: col.id,
        banner_url: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=400&fit=crop&q=80",
      }).select("id").single();
      if (evtErr) throw evtErr;

      toast.success("Wedding blueprint complete! Event and registry created.");
      router.push(`/events/${evt.id}`);
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    }
    setSaving(false);
  }

  return (
    <div className="page-enter max-w-lg mx-auto space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.push("/blueprints")} className="text-muted-foreground">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Blueprints
      </Button>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {[0, 1].map((i) => (
          <div key={i} className={`h-2 flex-1 rounded-full transition-all ${i <= step ? "bg-primary" : "bg-muted"}`} />
        ))}
      </div>

      {/* Step 0: Partner */}
      {step === 0 && (
        <Card className="glass-card gradient-border-card rounded-2xl animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
          <CardHeader className="text-center">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shadow-lg mb-2">
              <Heart className="h-7 w-7 text-white" />
            </div>
            <CardTitle className="text-xl font-heading">Who&apos;s the lucky couple?</CardTitle>
            <CardDescription>Enter your partner&apos;s friend code.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Partner&apos;s Friend Code</Label>
              <div className="flex gap-2">
                <Input placeholder="LIEB-XXXX-XXXX" value={partnerCode} onChange={(e) => setPartnerCode(e.target.value)} className="font-mono" />
                <Button onClick={lookupPartner} disabled={lookingUp || !partnerCode.trim()} variant="outline">
                  {lookingUp ? <Loader2 className="h-4 w-4 animate-spin" /> : "Find"}
                </Button>
              </div>
              {partnerName && (
                <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 mt-1">
                  <Check className="h-3.5 w-3.5" /> Found: <strong>{partnerName}</strong>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Couple Label</Label>
              <Select value={coupleLabel} onValueChange={setCoupleLabel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COUPLE_LABELS.map((l) => (
                    <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {coupleLabel === "custom" && (
                <Input placeholder="e.g. Soulmates" value={customLabel} onChange={(e) => setCustomLabel(e.target.value)} className="mt-1" />
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => router.push("/blueprints")}>Cancel</Button>
              <Button className="flex-1 btn-gradient rounded-xl" onClick={() => { if (!eventTitle) setEventTitle("Our Wedding"); setStep(1); }}>
                Next <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Event details */}
      {step === 1 && (
        <Card className="glass-card gradient-border-card rounded-2xl animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-heading">Event Details</CardTitle>
            <CardDescription>When and where is the big day?</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Event Title</Label>
              <Input value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} placeholder="Our Wedding" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start font-normal">
                    <CalendarDays className="h-3.5 w-3.5 mr-2" />
                    {eventDate ? format(eventDate, "MMMM d, yyyy") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={eventDate} onSelect={setEventDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Venue (optional)</Label>
              <Input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="The Grand Ballroom" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Description (optional)</Label>
              <Textarea value={eventDescription} onChange={(e) => setEventDescription(e.target.value)} placeholder="Any details for guests..." rows={2} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep(0)}>
                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Back
              </Button>
              <Button className="flex-1 btn-gradient rounded-xl shadow-lg" onClick={handleFinish} disabled={saving || !eventDate}>
                {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Creating...</> : "Create Wedding Blueprint"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}