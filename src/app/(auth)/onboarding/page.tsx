"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { Check, Sun, Moon, Clock, UserPlus, Loader2, Copy, Gift, LayoutTemplate, CalendarDays, Mail } from "lucide-react";
import { THEME_COLORS, THEME_CSS } from "@/lib/theme-colors";
import { MfaEnrollment } from "@/components/mfa-enrollment";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { AvatarUpload } from "@/components/avatar-upload";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

type AddedFriend = { name: string; code: string };

const DEFAULT_WISHLISTS = [
  { id: "My Birthday", label: "Birthday", icon: "🎂", banner: "https://images.unsplash.com/photo-1558636508-e0db3814bd1d?w=800&h=400&fit=crop&q=80" },
  { id: "Christmas", label: "Christmas", icon: "🎄", banner: "https://images.unsplash.com/photo-1512389142860-9c449e58a814?w=800&h=400&fit=crop&q=80" },
  { id: "Valentine's Day", label: "Valentine's Day", icon: "💝", banner: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800&h=400&fit=crop&q=80" },
  { id: "Easter", label: "Easter", icon: "🐣", banner: "https://images.unsplash.com/photo-1521967906867-14ec9d64bee8?w=800&h=400&fit=crop&q=80" },
  { id: "Mother's Day", label: "Mother's Day", icon: "💐", banner: "https://images.unsplash.com/photo-1490750967868-88aa4f44baee?w=800&h=400&fit=crop&q=80" },
  { id: "Father's Day", label: "Father's Day", icon: "👔", banner: "https://images.unsplash.com/photo-1542652694-40abf526446e?w=800&h=400&fit=crop&q=80" },
  { id: "Anniversary", label: "Anniversary", icon: "🥂", banner: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&h=400&fit=crop&q=80" },
  { id: "Halloween", label: "Halloween", icon: "🎃", banner: "https://images.unsplash.com/photo-1509557965875-b88c97052f0e?w=800&h=400&fit=crop&q=80" },
  { id: "Eid", label: "Eid", icon: "🌙", banner: "https://images.unsplash.com/photo-1564121211835-e88c852648ab?w=800&h=400&fit=crop&q=80" },
  { id: "Hanukkah", label: "Hanukkah", icon: "🕎", banner: "https://images.unsplash.com/photo-1576150542498-8ad43e9dd691?w=800&h=400&fit=crop&q=80" },
  { id: "Diwali", label: "Diwali", icon: "🪔", banner: "https://images.unsplash.com/photo-1574265935509-1e5d1e4ce5af?w=800&h=400&fit=crop&q=80" },
  { id: "Lunar New Year", label: "Lunar New Year", icon: "🧧", banner: "https://images.unsplash.com/photo-1548263594-a71f05f4f3cb?w=800&h=400&fit=crop&q=80" },
  { id: "New Year", label: "New Year", icon: "🎆", banner: "https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=800&h=400&fit=crop&q=80" },
  { id: "Back to School", label: "Back to School", icon: "📚", banner: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=400&fit=crop&q=80" },
  { id: "Thanksgiving", label: "Thanksgiving", icon: "🦃", banner: "https://images.unsplash.com/photo-1474564862106-1f23d10b9d72?w=800&h=400&fit=crop&q=80" },
];

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

  const [inviteEmails, setInviteEmails] = useState("");
  const [sendingInvites, setSendingInvites] = useState(false);
  const [sentInvites, setSentInvites] = useState<string[]>([]);

  const [friendCode, setFriendCode] = useState("");
  const [addingFriend, setAddingFriend] = useState(false);
  const [addedFriends, setAddedFriends] = useState<AddedFriend[]>([]);

  const totalSteps = 8;

  // Load user profile on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        window.location.href = "/login";
        return;
      }
      supabase.from("users").select("display_name, avatar_url, friend_code").eq("id", user.id).single().then(({ data, error }) => {
        if (error || !data) {
          // Profile doesn't exist — sign out and redirect
          supabase.auth.signOut().then(() => {
            window.location.href = "/login";
          });
          return;
        }
        setDisplayName(data.display_name);
        setAvatarUrl(data.avatar_url);
        setMyCode(data.friend_code);
      });
    });
  }, []);

  // Live theme preview — apply theme as user selects
  useEffect(() => {
    const root = document.documentElement;
    if (themeMode === "dark") { root.classList.add("dark"); } else { root.classList.remove("dark"); }

    const styleId = "onboarding-theme-preview";
    let el = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!el) { el = document.createElement("style"); el.id = styleId; document.head.appendChild(el); }

    const entry = THEME_CSS[themeColor];
    if (entry && (entry.light || entry.dark)) {
      el.textContent = `:root { ${entry.light} } .dark { ${entry.dark} }`;
    } else {
      el.textContent = "";
    }

    return () => {
      const existing = document.getElementById(styleId);
      if (existing) existing.remove();
    };
  }, [themeMode, themeColor]);

  function toggleList(listName: string) {
    setDefaultLists(prev => prev.includes(listName) ? prev.filter(l => l !== listName) : [...prev, listName]);
  }

  async function handleSendInvites() {
    const emails = inviteEmails
      .split(/[,;\n]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e && e.includes("@"));

    if (emails.length === 0) {
      toast.error("Enter at least one valid email address.");
      return;
    }

    setSendingInvites(true);
    try {
      const res = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails }),
      });
      const data = await res.json();

      if (data.results) {
        const sent = data.results
          .filter((r: any) => r.status === "sent")
          .map((r: any) => r.email);
        setSentInvites((prev) => [...prev, ...sent]);
        setInviteEmails("");

        if (sent.length > 0) {
          toast.success(`Invitations sent to ${sent.length} people!`);
        } else {
          toast.info("All emails were already invited or invalid.");
        }
      }
    } catch {
      toast.error("Couldn't send invitations.");
    }
    setSendingInvites(false);
  }

  function handleFriendCodeChange(value: string) {
    let cleaned = value.toUpperCase().replace(/[^A-Z0-9-]/g, "");
    if (!cleaned.startsWith("LIEB-")) {
      if (cleaned.startsWith("LIEB")) { cleaned = "LIEB-" + cleaned.slice(4); }
      else if (cleaned.length > 0 && !cleaned.startsWith("L")) { cleaned = "LIEB-" + cleaned; }
    }
    const parts = cleaned.split("-");
    if (parts.length === 2 && parts[1].length > 4) {
      cleaned = `LIEB-${parts[1].slice(0, 4)}-${parts[1].slice(4, 8)}`;
    } else if (parts.length === 3) {
      cleaned = `LIEB-${parts[1].slice(0, 4)}-${parts[2].slice(0, 4)}`;
    }
    setFriendCode(cleaned);
  }

  async function handleAddFriend() {
    const code = friendCode.trim().toUpperCase();
    if (!code) return;
    if (!/^LIEB-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) { toast.error("Invalid code format. Use LIEB-XXXX-XXXX"); return; }
    if (addedFriends.some(f => f.code === code)) { toast.error("You've already added this friend!"); return; }

    setAddingFriend(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in.");
      const { data: target } = await supabase.from("users").select("id, display_name").eq("friend_code", code).single();
      if (!target) { toast.error("No user found with that code."); setAddingFriend(false); return; }
      if (target.id === user.id) { toast.error("That's your own code!"); setAddingFriend(false); return; }
      const { data: existing } = await supabase.from("friendships").select("id").or(`and(requester_id.eq.${user.id},addressee_id.eq.${target.id}),and(requester_id.eq.${target.id},addressee_id.eq.${user.id})`);
      if (existing && existing.length > 0) { toast.error("Already connected or request pending."); setAddingFriend(false); return; }
      const { error } = await supabase.from("friendships").insert({ requester_id: user.id, addressee_id: target.id, status: "pending" });
      if (error) throw error;
      setAddedFriends(prev => [...prev, { name: target.display_name, code }]);
      setFriendCode("");
      toast.success(`Friend request sent to ${target.display_name}!`);
    } catch (err: any) { toast.error(err.message || "Couldn't send request."); }
    finally { setAddingFriend(false); }
  }

  function copyMyCode() {
    navigator.clipboard.writeText(myCode);
    toast.success("Code copied! Share it with friends.");
  }

  async function handleFinish() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Not logged in."); setSaving(false); return; }
    try {
      const { error } = await supabase.from("users").update({
        birthday: birthday ? format(birthday, "yyyy-MM-dd") : null,
        theme_mode: themeMode, theme_color: themeColor, time_format: timeFormat, onboarded: true,
      }).eq("id", user.id);
      if (error) throw error;
      if (defaultLists.length > 0) {
        const inserts = defaultLists.map(listId => {
          const template = DEFAULT_WISHLISTS.find(w => w.id === listId);
          return {
            user_id: user.id,
            name: listId,
            emoji: template?.icon || null,
            banner_url: template?.banner || null,
            visibility: "public",
          };
        });
        await supabase.from("collections").insert(inserts);
      }
      // Clean up preview theme
      const el = document.getElementById("onboarding-theme-preview");
      if (el) el.remove();

      // Send welcome email (non-blocking)
      try {
        await fetch("/api/email/welcome", { method: "POST" });
      } catch {
        // Non-critical
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) { toast.error("Something went wrong."); }
    setSaving(false);
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen mkt-bg mkt-text transition-colors duration-500">
      {/* Left: Steps */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-y-auto">
        <div className="w-full max-w-md my-auto pb-20 lg:pb-0">
          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 mb-8 mt-12 lg:mt-0">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === step ? "w-8 bg-primary shadow-sm shadow-primary/30" : i < step ? "w-2 bg-primary/50" : "w-2 bg-muted-foreground/20"}`} />
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Step 0: Avatar */}
            {step === 0 && (
              <motion.div
                key="step-0"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card className="shadow-lg shadow-primary/5">
                  <CardHeader className="text-center">
                    <CardTitle className="text-xl">Add a profile photo</CardTitle>
                    <CardDescription>Help your friends recognize you.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center gap-6">
                    <AvatarUpload currentUrl={avatarUrl} displayName={displayName || "U"} onUploaded={(url) => setAvatarUrl(url)} size="lg" />
                    <div className="flex gap-2 w-full max-w-xs">
                      <Button variant="ghost" className="flex-1" onClick={() => setStep(1)}>Skip</Button>
                      <Button className="flex-1 shadow-sm btn-gradient" onClick={() => setStep(1)}>Next</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 1: Birthday */}
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card className="shadow-lg shadow-primary/5 ">
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
                      <Button className="flex-1 shadow-sm btn-gradient" onClick={() => setStep(2)}>{birthday ? "Next" : "Skip"}</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 2: Time Format */}
            {step === 2 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card className="shadow-lg shadow-primary/5 ">
                  <CardHeader className="text-center">
                    <CardTitle className="text-xl">How do you prefer time?</CardTitle>
                    <CardDescription>Choose your preferred time format.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center gap-4">
                    <div className="flex gap-3 w-full max-w-xs">
                      {(["12h", "24h"] as const).map((fmt) => (
                        <button key={fmt} onClick={() => setTimeFormat(fmt)}
                          className={`flex-1 flex flex-col items-center gap-2 rounded-xl border-2 p-5 transition-all ${timeFormat === fmt ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/20"}`}>
                          <Clock className={`h-6 w-6 ${timeFormat === fmt ? "text-primary" : "text-muted-foreground"}`} />
                          <span className={`text-lg font-mono font-medium ${timeFormat === fmt ? "text-primary" : "text-foreground"}`}>{fmt === "12h" ? "2:30 PM" : "14:30"}</span>
                          <span className="text-xs text-muted-foreground">{fmt === "12h" ? "12-hour" : "24-hour"}</span>
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2 w-full max-w-xs">
                      <Button variant="ghost" className="flex-1" onClick={() => setStep(1)}>Back</Button>
                      <Button className="flex-1 shadow-sm btn-gradient" onClick={() => setStep(3)}>Next</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 3: Light/Dark */}
            {step === 3 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card className="shadow-lg shadow-primary/5 ">
                  <CardHeader className="text-center">
                    <CardTitle className="text-xl">Light or dark?</CardTitle>
                    <CardDescription>You can always change this later.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center gap-4">
                    <div className="flex gap-3 w-full max-w-xs">
                      {(["light", "dark"] as const).map((mode) => (
                        <button key={mode} onClick={() => setThemeMode(mode)}
                          className={`flex-1 flex flex-col items-center gap-2 rounded-xl border-2 p-6 transition-all ${themeMode === mode ? "border-primary bg-primary/5 shadow-sm" : "border-muted hover:border-muted-foreground/20"}`}>
                          {mode === "light" ? <Sun className="h-8 w-8" /> : <Moon className="h-8 w-8" />}
                          <span className="text-sm font-medium capitalize">{mode}</span>
                          {themeMode === mode && <Check className="h-4 w-4 text-primary" />}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2 w-full max-w-xs">
                      <Button variant="ghost" className="flex-1" onClick={() => setStep(2)}>Back</Button>
                      <Button className="flex-1 shadow-sm btn-gradient" onClick={() => setStep(4)}>Next</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 4: Theme Color */}
            {step === 4 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card className="shadow-lg shadow-primary/5 ">
                  <CardHeader className="text-center">
                    <CardTitle className="text-xl">Pick a color</CardTitle>
                    <CardDescription>Your accent color across the experience.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center gap-4">
                    <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
                      {THEME_COLORS.map((color) => (
                        <button key={color.id} onClick={() => setThemeColor(color.id)}
                          className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${themeColor === color.id ? "border-foreground shadow-sm scale-[1.02]" : "border-muted hover:border-muted-foreground/20 hover:scale-[1.01]"}`}>
                          <div className="h-8 w-8 rounded-full shadow-inner ring-1 ring-black/5" style={{ backgroundColor: color.preview }} />
                          <span className="text-xs font-medium">{color.label}</span>
                          {themeColor === color.id && <Check className="h-3 w-3" />}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2 w-full max-w-xs">
                      <Button variant="ghost" className="flex-1" onClick={() => setStep(3)}>Back</Button>
                      <Button className="flex-1 shadow-sm btn-gradient" onClick={() => setStep(5)}>Next</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 5: MFA Setup (optional) */}
            {step === 5 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card className="shadow-lg shadow-primary/5 ">
                  <CardHeader className="text-center">
                    <CardTitle className="text-xl">Secure your account</CardTitle>
                    <CardDescription>Add two-factor authentication for extra security.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center gap-4">
                    <MfaEnrollment
                      variant="inline"
                      showSkip
                      onSkip={() => setStep(6)}
                      onComplete={() => setStep(6)}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 6: Default Wishlists (expanded) */}
            {step === 6 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card className="shadow-lg shadow-primary/5 ">
                  <CardHeader className="text-center">
                    <CardTitle className="text-xl">Create default wishlists?</CardTitle>
                    <CardDescription>We can set up a few lists to get you started.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center gap-4">
                    <div className="w-full max-w-xs space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin pr-1">
                      {DEFAULT_WISHLISTS.map((list) => (
                        <label key={list.id} className="flex items-center justify-between p-3 rounded-xl border border-muted hover:border-primary/50 transition-colors cursor-pointer group">
                          <div className="flex items-center gap-3">
                            <div className={`h-9 w-9 rounded-lg flex items-center justify-center text-lg ${defaultLists.includes(list.id) ? "bg-primary/10" : "bg-muted group-hover:bg-primary/5"} transition-colors`}>
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
                      <Button className="flex-1 shadow-sm btn-gradient" onClick={() => setStep(6)}>Next</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 7: Add Friends + Copy Own Code */}
            {step === 7 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card className="shadow-lg shadow-primary/5 ">
                  <CardHeader className="text-center">
                    <CardTitle className="text-xl flex items-center justify-center gap-2">
                      <UserPlus className="h-5 w-5 text-primary" /> Add your friends
                    </CardTitle>
                    <CardDescription>Got a friend code? Enter it below. You can add multiple!</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center gap-4">
                    {/* Email invites */}
                    <div className="w-full max-w-xs">
                      <p className="text-[10px] font-medium text-primary uppercase tracking-widest mb-2">
                        Invite by email
                      </p>
                      <div className="flex flex-col gap-2">
                        <Input
                          placeholder="friend@email.com, another@email.com"
                          value={inviteEmails}
                          onChange={(e) => setInviteEmails(e.target.value)}
                          className="text-xs"
                        />
                        <Button
                          onClick={handleSendInvites}
                          disabled={sendingInvites || !inviteEmails.trim()}
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          {sendingInvites ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                          ) : (
                            <Mail className="h-3.5 w-3.5 mr-1.5" />
                          )}
                          Send invitations
                        </Button>
                      </div>
                      {sentInvites.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {sentInvites.map((email, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-1.5 text-[11px] text-green-600 dark:text-green-400"
                            >
                              <Check className="h-3 w-3" />
                              <span className="truncate">{email}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="w-full max-w-xs">
                      <div className="h-px bg-border my-2" />
                      <p className="text-[10px] text-muted-foreground text-center mb-2">or add by friend code</p>
                    </div>
                    {/* Your own code — copy & share */}
                    <div className="w-full max-w-xs rounded-xl border border-primary/20 bg-primary/5 p-3">
                      <p className="text-[10px] font-medium text-primary uppercase tracking-widest mb-1">Your Friend Code</p>
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-sm tracking-widest">{myCode || "LIEB-XXXX-XXXX"}</span>
                        <Button variant="ghost" size="icon-sm" onClick={copyMyCode} className="h-7 w-7 text-primary hover:bg-primary/20">
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">Share this with friends so they can add you!</p>
                    </div>

                    {/* Friend code input */}
                    <div className="w-full max-w-xs flex gap-2">
                      <Input
                        placeholder="LIEB-XXXX-XXXX"
                        value={friendCode}
                        onChange={(e) => handleFriendCodeChange(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddFriend()}
                        className="font-mono text-center tracking-wider"
                        maxLength={14}
                      />
                      <Button onClick={handleAddFriend} disabled={addingFriend || friendCode.length < 14} className="shrink-0 btn-gradient">
                        {addingFriend ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                      </Button>
                    </div>

                    {/* Added friends list */}
                    {addedFriends.length > 0 && (
                      <div className="w-full max-w-xs space-y-2 animate-in fade-in-50 slide-in-from-top-2">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Requests sent</p>
                        <div className="space-y-1.5">
                          {addedFriends.map((friend, i) => (
                            <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 text-green-700 dark:text-green-400 text-sm">
                              <Check className="h-4 w-4 shrink-0" />
                              <span className="truncate">{friend.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground text-center max-w-xs">
                      Don&apos;t have a code? No worries — you can add friends later from your dashboard.
                    </p>

                    <div className="flex gap-2 w-full max-w-xs">
                      <Button variant="ghost" className="flex-1" onClick={() => setStep(5)}>Back</Button>
                      <Button className="flex-1 shadow-sm btn-gradient" onClick={handleFinish} disabled={saving}>
                        {saving ? "Setting up..." : (addedFriends.length > 0 ? "Done!" : "Skip & Finish")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right: Live Profile Preview */}
      <div className="hidden lg:flex w-[400px] xl:w-[500px] mkt-bg-subtle p-12 items-center justify-center border-l mkt-border relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-bl-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-tr-full blur-3xl" />

        <div className="w-full max-w-[340px] rounded-2xl overflow-hidden shadow-2xl border mkt-card-border mkt-bg-card mkt-text transition-all duration-300 transform scale-100 hover:scale-[1.02]">
          {/* Banner */}
          <div className="h-32 relative" style={{ background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to), var(--gradient-accent))' }}>
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
              {addedFriends.length > 0 && (
                <span>· {addedFriends.length} friend{addedFriends.length !== 1 ? "s" : ""} added</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}