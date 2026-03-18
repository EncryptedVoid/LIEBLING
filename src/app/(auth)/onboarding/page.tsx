"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { Check, Sun, Moon, Clock, UserPlus, Loader2 } from "lucide-react";
import { THEME_COLORS } from "@/lib/theme-colors";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { AvatarUpload } from "@/components/avatar-upload";
import { toast } from "sonner";
import { Copy, LayoutTemplate, MapPin, CalendarDays, Link as LinkIcon, Gift } from "lucide-react";

type AddedFriend = {
  name: string;
  code: string;
};

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [birthday, setBirthday] = useState<Date | undefined>();
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");
  const [themeColor, setThemeColor] = useState("zinc");
  const [timeFormat, setTimeFormat] = useState<"12h" | "24h">("12h");
  const [saving, setSaving] = useState(false);
  const [defaultLists, setDefaultLists] = useState<string[]>([]);
  const [myCode, setMyCode] = useState("");

  // Friends step state
  const [friendCode, setFriendCode] = useState("");
  const [addingFriend, setAddingFriend] = useState(false);
  const [addedFriends, setAddedFriends] = useState<AddedFriend[]>([]);

  const totalSteps = 7;

  useState(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from("users").select("display_name, avatar_url, friend_code").eq("id", user.id).single().then(({ data }) => {
          if (data) { setDisplayName(data.display_name); setAvatarUrl(data.avatar_url); setMyCode(data.friend_code); }
        });
      }
    });
  });

  async function handleAddFriend() {
    const code = friendCode.trim().toUpperCase();
    if (!code) return;

    // Basic validation for LIEB-XXXX-XXXX format
    if (!/^LIEB-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) {
      toast.error("Invalid code format. Use LIEB-XXXX-XXXX");
      return;
    }

    // Check if already added
    if (addedFriends.some(f => f.code === code)) {
      toast.error("You've already added this friend!");
      return;
    }

    setAddingFriend(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in.");

      // Find target user
      const { data: target } = await supabase
        .from("users")
        .select("id, display_name")
        .eq("friend_code", code)
        .single();

      if (!target) {
        toast.error("No user found with that code.");
        setAddingFriend(false);
        return;
      }

      if (target.id === user.id) {
        toast.error("That's your own code!");
        setAddingFriend(false);
        return;
      }

      // Check existing friendship
      const { data: existing } = await supabase
        .from("friendships")
        .select("id")
        .or(`and(requester_id.eq.${user.id},addressee_id.eq.${target.id}),and(requester_id.eq.${target.id},addressee_id.eq.${user.id})`);

      if (existing && existing.length > 0) {
        toast.error("Already connected or request pending.");
        setAddingFriend(false);
        return;
      }

      // Send friend request
      const { error } = await supabase.from("friendships").insert({
        requester_id: user.id,
        addressee_id: target.id,
        status: "pending",
      });

      if (error) throw error;

      setAddedFriends(prev => [...prev, { name: target.display_name, code }]);
      setFriendCode("");
      toast.success(`Friend request sent to ${target.display_name}!`);
    } catch (err: any) {
      toast.error(err.message || "Couldn't send request.");
    } finally {
      setAddingFriend(false);
    }
  }

  async function handleFinish() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Not logged in."); setSaving(false); return; }

    try {
      // 1. Update user profile
      const { error } = await supabase.from("users").update({
        birthday: birthday ? format(birthday, "yyyy-MM-dd") : null,
        theme_mode: themeMode,
        theme_color: themeColor,
        time_format: timeFormat,
        onboarded: true,
      }).eq("id", user.id);
      if (error) throw error;

      // 2. Create default wishlists if any selected
      if (defaultLists.length > 0) {
        const inserts = defaultLists.map(name => ({
          user_id: user.id,
          name: name,
          visibility: "public"
        }));
        await supabase.from("collections").insert(inserts);
      }

      router.push("/dashboard"); 
      router.refresh();
    } catch (err) {
      toast.error("Something went wrong.");
    }
    setSaving(false);
  }

  function toggleList(listName: string) {
    setDefaultLists(prev => 
      prev.includes(listName) ? prev.filter(l => l !== listName) : [...prev, listName]
    );
  }

  // Format friend code input with dashes
  function handleFriendCodeChange(value: string) {
    // Remove all non-alphanumeric except dashes
    let cleaned = value.toUpperCase().replace(/[^A-Z0-9-]/g, "");
    
    // Auto-format as user types
    if (!cleaned.startsWith("LIEB-")) {
      if (cleaned.startsWith("LIEB")) {
        cleaned = "LIEB-" + cleaned.slice(4);
      } else if (cleaned.length > 0 && !cleaned.startsWith("L")) {
        cleaned = "LIEB-" + cleaned;
      }
    }

    // Add dash after first 4 chars of code portion
    const parts = cleaned.split("-");
    if (parts.length === 2 && parts[1].length > 4) {
      cleaned = `LIEB-${parts[1].slice(0, 4)}-${parts[1].slice(4, 8)}`;
    } else if (parts.length === 3) {
      cleaned = `LIEB-${parts[1].slice(0, 4)}-${parts[2].slice(0, 4)}`;
    }

    setFriendCode(cleaned);
  }

  return (
    <div className={`flex flex-col lg:flex-row min-h-screen ${themeMode === "dark" ? "dark bg-background text-foreground" : "bg-background text-foreground"}`} style={{ "--primary": `var(--theme-${themeColor})`, "--radius": "0.5rem" } as any}>
      {/* Left: Onboarding Steps */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-y-auto">
        <div className="w-full max-w-md my-auto pb-20 lg:pb-0">
          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 mb-8 mt-12 lg:mt-0">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === step ? "w-8 bg-primary shadow-sm shadow-primary/30" : i < step ? "w-2 bg-primary/50" : "w-2 bg-muted-foreground/20"
                }`}
              />
            ))}
          </div>

          {/* Step 0: Avatar */}
          {step === 0 && (
          <Card className="shadow-lg shadow-primary/5 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Add a profile photo</CardTitle>
              <CardDescription>Help your friends recognize you.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6">
              <AvatarUpload currentUrl={avatarUrl} displayName={displayName || "U"} onUploaded={(url) => setAvatarUrl(url)} size="lg" />
              <div className="flex gap-2 w-full max-w-xs">
                <Button variant="ghost" className="flex-1" onClick={() => setStep(1)}>Skip</Button>
                <Button className="flex-1 shadow-sm" onClick={() => setStep(1)}>Next</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Birthday */}
        {step === 1 && (
          <Card className="shadow-lg shadow-primary/5 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">When&apos;s your birthday?</CardTitle>
              <CardDescription>We&apos;ll let your friends know when it&apos;s coming up.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full max-w-xs justify-start font-normal">
                    {birthday ? format(birthday, "MMMM d, yyyy") : "Pick your birthday"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center">
                  <Calendar mode="single" selected={birthday} onSelect={setBirthday} captionLayout="dropdown" fromYear={1920} toYear={new Date().getFullYear()} initialFocus />
                </PopoverContent>
              </Popover>
              <div className="flex gap-2 w-full max-w-xs">
                <Button variant="ghost" className="flex-1" onClick={() => setStep(0)}>Back</Button>
                <Button className="flex-1 shadow-sm" onClick={() => setStep(2)}>{birthday ? "Next" : "Skip"}</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Time Format */}
        {step === 2 && (
          <Card className="shadow-lg shadow-primary/5 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">How do you prefer time?</CardTitle>
              <CardDescription>Choose your preferred time format.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <div className="flex gap-3 w-full max-w-xs">
                {(["12h", "24h"] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setTimeFormat(fmt)}
                    className={`flex-1 flex flex-col items-center gap-2 rounded-xl border-2 p-5 transition-all ${
                      timeFormat === fmt
                        ? "border-primary bg-primary/5"
                        : "border-muted bg-transparent hover:border-muted-foreground/20"
                    }`}
                  >
                    <Clock className={`h-6 w-6 ${timeFormat === fmt ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={`text-lg font-mono font-medium ${timeFormat === fmt ? "text-primary" : "text-foreground"}`}>
                      {fmt === "12h" ? "2:30 PM" : "14:30"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {fmt === "12h" ? "12-hour" : "24-hour"}
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex gap-2 w-full max-w-xs">
                <Button variant="ghost" className="flex-1" onClick={() => setStep(1)}>Back</Button>
                <Button className="flex-1 shadow-sm" onClick={() => setStep(3)}>Next</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Light / Dark */}
        {step === 3 && (
          <Card className="shadow-lg shadow-primary/5 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Light or dark?</CardTitle>
              <CardDescription>You can always change this later.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <div className="flex gap-3 w-full max-w-xs">
                {(["light", "dark"] as const).map((mode) => (
                  <button key={mode} onClick={() => setThemeMode(mode)}
                    className={`flex-1 flex flex-col items-center gap-2 rounded-xl border-2 p-6 transition-all ${
                      themeMode === mode ? "border-primary bg-primary/5 shadow-sm" : "border-muted hover:border-muted-foreground/20"
                    }`}
                  >
                    {mode === "light" ? <Sun className="h-8 w-8" /> : <Moon className="h-8 w-8" />}
                    <span className="text-sm font-medium capitalize">{mode}</span>
                    {themeMode === mode && <Check className="h-4 w-4 text-primary" />}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 w-full max-w-xs">
                <Button variant="ghost" className="flex-1" onClick={() => setStep(2)}>Back</Button>
                <Button className="flex-1 shadow-sm" onClick={() => setStep(4)}>Next</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Theme color */}
        {step === 4 && (
          <Card className="shadow-lg shadow-primary/5 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Pick a color</CardTitle>
              <CardDescription>Your accent color across the experience.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
                {THEME_COLORS.map((color) => (
                  <button key={color.id} onClick={() => setThemeColor(color.id)}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                      themeColor === color.id ? "border-foreground shadow-sm scale-[1.02]" : "border-muted hover:border-muted-foreground/20 hover:scale-[1.01]"
                    }`}
                  >
                    <div className="h-8 w-8 rounded-full shadow-inner ring-1 ring-black/5" style={{ backgroundColor: color.preview }} />
                    <span className="text-xs font-medium">{color.label}</span>
                    {themeColor === color.id && <Check className="h-3 w-3" />}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 w-full max-w-xs">
                <Button variant="ghost" className="flex-1" onClick={() => setStep(3)}>Back</Button>
                <Button className="flex-1 shadow-sm" onClick={() => setStep(5)}>Next</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 5: Default Wishlists */}
        {step === 5 && (
          <Card className="shadow-lg shadow-primary/5 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Create default wishlists?</CardTitle>
              <CardDescription>We can set up a few lists to get you started.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <div className="w-full max-w-xs space-y-2">
                {[
                  { id: "My Birthday", label: "My Birthday", icon: <Gift className="h-4 w-4" /> },
                  { id: "Christmas", label: "Christmas", icon: <LayoutTemplate className="h-4 w-4" /> },
                  { id: "Valentine's Day", label: "Valentine's Day", icon: <LayoutTemplate className="h-4 w-4" /> }
                ].map((list) => (
                  <label key={list.id} className="flex items-center justify-between p-3 rounded-xl border border-muted hover:border-primary/50 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${defaultLists.includes(list.id) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:text-primary transition-colors"}`}>
                        {list.icon}
                      </div>
                      <span className="font-medium text-sm">{list.label}</span>
                    </div>
                    <Checkbox checked={defaultLists.includes(list.id)} onCheckedChange={() => toggleList(list.id)} />
                  </label>
                ))}
              </div>
              <div className="flex gap-2 w-full max-w-xs mt-2">
                <Button variant="ghost" className="flex-1" onClick={() => setStep(4)}>Back</Button>
                <Button className="flex-1 shadow-sm" onClick={() => setStep(6)}>Next</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 6: Add Friends */}
        {step === 6 && (
          <Card className="shadow-lg shadow-primary/5 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
            <CardHeader className="text-center">
              <CardTitle className="text-xl flex items-center justify-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                Add your friends
              </CardTitle>
              <CardDescription>
                Got a friend code? Enter it to connect with them.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              {/* Friend code input */}
              <div className="w-full max-w-xs flex flex-col gap-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="LIEB-XXXX-XXXX"
                    value={friendCode}
                    onChange={(e) => handleFriendCodeChange(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddFriend()}
                    className="font-mono text-center tracking-wider"
                    maxLength={14}
                  />
                  <Button
                    onClick={handleAddFriend}
                    disabled={addingFriend || friendCode.length < 14}
                    className="shrink-0"
                  >
                    {addingFriend ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                  </Button>
                </div>
              </div>

              {/* Added friends list */}
              {addedFriends.length > 0 && (
                <div className="w-full max-w-xs space-y-2 animate-in fade-in-50 slide-in-from-top-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                    Requests sent
                  </p>
                  <div className="space-y-1.5">
                    {addedFriends.map((friend, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 text-green-700 dark:text-green-400 text-sm"
                      >
                        <Check className="h-4 w-4 shrink-0" />
                        <span className="truncate">{friend.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Helper text */}
              <p className="text-xs text-muted-foreground text-center max-w-xs">
                Don&apos;t have a code? No worries — you can add friends later from your dashboard.
              </p>

              <div className="flex gap-2 w-full max-w-xs">
                <Button variant="ghost" className="flex-1" onClick={() => setStep(5)}>Back</Button>
                <Button className="flex-1 shadow-sm" onClick={handleFinish} disabled={saving}>
                  {saving ? "Setting up..." : (addedFriends.length > 0 ? "Done!" : "Skip & Finish")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        </div>
      </div>

      {/* Right: Live Profile Preview */}
      <div className="hidden lg:flex w-[400px] xl:w-[500px] bg-muted/30 p-12 items-center justify-center border-l relative overflow-hidden">
        {/* Decorative background for preview pane */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-bl-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-tr-full blur-3xl" />

        <div className="w-full max-w-[340px] rounded-2xl overflow-hidden shadow-2xl border border-primary/10 bg-card text-card-foreground transition-all duration-300 transform scale-100 hover:scale-[1.02]">
          {/* Banner area */}
          <div className="h-32 bg-gradient-to-br from-primary/30 to-primary/10 relative">
            <div className="absolute -bottom-10 left-6">
              <div className="h-20 w-20 rounded-full border-4 border-card overflow-hidden bg-muted">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary font-medium text-xl">
                    {displayName ? displayName[0]?.toUpperCase() : "U"}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="px-6 pt-12 pb-6 flex flex-col gap-4">
            <div>
              <h3 className="text-xl font-bold tracking-tight">{displayName || "Your Name"}</h3>
              <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" />
                <span>{birthday ? format(birthday, "MMMM d") : "Your Birthday"}</span>
              </div>
            </div>

            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium text-primary uppercase tracking-widest mb-0.5">Friend Code</p>
                <p className="font-mono font-bold text-sm">{myCode || "LIEB-XXXX-XXXX"}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/20 text-primary">
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="flex gap-2 text-xs text-muted-foreground font-medium uppercase tracking-wider">
              {defaultLists.length > 0 ? (
                <span>{defaultLists.length} default list{defaultLists.length !== 1 ? "s" : ""}</span>
              ) : (
                <span>No lists yet</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}