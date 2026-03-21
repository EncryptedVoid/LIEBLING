"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { THEME_COLORS } from "@/lib/theme-colors";
import { Check, Sun, Moon, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AvatarUpload } from "@/components/avatar-upload";
import { toast } from "sonner";
import { MfaEnrollment } from "@/components/mfa-enrollment";
import { MfaChallenge, checkMfaEnrolled } from "@/components/mfa-challenge";
import { ShieldCheck } from "lucide-react";

export default function SettingsPage() {
  const supabase = createClient();
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [birthday, setBirthday] = useState<Date | undefined>();
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");
  const [themeColor, setThemeColor] = useState("zinc");
  const [timeFormat, setTimeFormat] = useState<"12h" | "24h">("12h");
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAppearance, setSavingAppearance] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [mfaEnrolled, setMfaEnrolled] = useState(false);
  const [mfaChallengeOpen, setMfaChallengeOpen] = useState(false);
  const [showMfaSetup, setShowMfaSetup] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("users")
        .select("display_name, avatar_url, birthday, theme_mode, theme_color, time_format")
        .eq("id", user.id)
        .single();
      if (data) {
        setDisplayName(data.display_name);
        setAvatarUrl(data.avatar_url);
        setBirthday(data.birthday ? new Date(data.birthday) : undefined);
        setThemeMode(data.theme_mode);
        setThemeColor(data.theme_color);
        setTimeFormat(data.time_format || "12h");
      }
      setLoading(false);
      // Check MFA status
      const enrolled = await checkMfaEnrolled();
      setMfaEnrolled(enrolled);
    }
    load();
  }, []);

  async function handleChangePassword() {
    if (newPassword !== confirmNewPassword) {
      toast.error("Passwords don't match.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    }
    setSavingPassword(false);
  }

  async function handleSaveProfile() {
    setSavingProfile(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("users")
      .update({ display_name: displayName.trim(), birthday: birthday ? format(birthday, "yyyy-MM-dd") : null })
      .eq("id", user!.id);
    if (error) { toast.error("Couldn't save profile."); } else { toast.success("Profile updated."); router.refresh(); }
    setSavingProfile(false);
  }

  async function handleSaveAppearance() {
    setSavingAppearance(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("users")
      .update({ theme_mode: themeMode, theme_color: themeColor, time_format: timeFormat })
      .eq("id", user!.id);
    if (error) { toast.error("Couldn't save preferences."); } else { toast.success("Preferences updated. Refreshing..."); router.refresh(); }
    setSavingAppearance(false);
  }

  async function handleDeleteAccount() {
    if (mfaEnrolled) {
      // Require MFA verification first
      setMfaChallengeOpen(true);
      return;
    }
    performDeleteAccount();
  }

  async function performDeleteAccount() {
    await supabase.auth.signOut();
    await fetch("/api/auth/signout", { method: "POST" }).catch(() => {});
    window.location.href = "/";
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto page-enter">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 rounded-xl skeleton-shimmer" />
          <div className="h-64 rounded-xl skeleton-shimmer" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto page-enter">
      <h1 className="text-3xl font-heading font-bold tracking-tight gradient-text">Settings</h1>
      <p className="text-sm text-muted-foreground mt-1">Manage your profile and preferences.</p>

      {/* ── Side-by-side: Profile + Appearance ─────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {/* Profile */}
        <Card className="glass-card rounded-2xl">
          <CardHeader>
            <CardTitle className="text-sm">Profile</CardTitle>
            <CardDescription>Your photo, name, and birthday.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <AvatarUpload
              currentUrl={avatarUrl}
              displayName={displayName}
              onUploaded={(url) => { setAvatarUrl(url); router.refresh(); }}
              size="lg"
            />

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="displayName">Display name</Label>
              <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Birthday</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start font-normal">
                    {birthday ? format(birthday, "MMMM d, yyyy") : "Not set"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={birthday}
                    onSelect={setBirthday}
                    captionLayout="dropdown"
                    fromYear={1920}
                    toYear={new Date().getFullYear()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button onClick={handleSaveProfile} disabled={savingProfile} className="btn-gradient rounded-xl shadow-lg">
              {savingProfile ? "Saving..." : "Save profile"}
            </Button>
          </CardContent>
        </Card>

        {/* Appearance & Preferences */}
        <Card className="glass-card rounded-2xl">
          <CardHeader>
            <CardTitle className="text-sm">Appearance & Preferences</CardTitle>
            <CardDescription>Customize how Lieblings looks and works.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {/* Mode */}
            <div className="flex flex-col gap-2">
              <Label>Mode</Label>
              <div className="flex gap-3">
                {(["light", "dark"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setThemeMode(mode)}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-xl border-2 p-3 transition-all ${
                      themeMode === mode
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-muted hover:border-muted-foreground/20"
                    }`}
                  >
                    {mode === "light" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    <span className="text-xs font-medium capitalize">{mode}</span>
                    {themeMode === mode && <Check className="h-3 w-3 text-primary" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Accent color */}
            <div className="flex flex-col gap-2">
              <Label>Accent color</Label>
              <div className="grid grid-cols-3 gap-2">
                {THEME_COLORS.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => setThemeColor(color.id)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-2.5 transition-all ${
                      themeColor === color.id
                        ? "border-foreground shadow-sm scale-[1.02]"
                        : "border-muted hover:border-muted-foreground/20 hover:scale-[1.01]"
                    }`}
                  >
                    <div
                      className="h-5 w-5 rounded-full shadow-inner ring-1 ring-black/5"
                      style={{ backgroundColor: color.preview }}
                    />
                    <span className="text-[9px] font-medium">{color.label}</span>
                  </button>
                ))}
              </div>
            </div>


            {/* Time format */}
            <div className="flex flex-col gap-2">
              <Label className="flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                Time Format
              </Label>
              <div className="flex gap-3">
                {(["12h", "24h"] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setTimeFormat(fmt)}
                    className={`flex-1 flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-all ${
                      timeFormat === fmt
                        ? "border-primary bg-primary/5"
                        : "border-muted bg-transparent hover:border-muted-foreground/20"
                    }`}
                  >
                    <span className={`text-sm font-mono font-medium ${
                      timeFormat === fmt ? "text-primary" : "text-foreground"
                    }`}>
                      {fmt === "12h" ? "2:30 PM" : "14:30"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{fmt === "12h" ? "12-hour" : "24-hour"}</span>
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={handleSaveAppearance} disabled={savingAppearance} className="btn-gradient rounded-xl shadow-lg">
              {savingAppearance ? "Saving..." : "Save preferences"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-8" />

      {/* Password Change */}
      <Card className="glass-card rounded-2xl md:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm">Change Password</CardTitle>
          <CardDescription>Update your account password.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 max-w-sm">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="newPw">New Password</Label>
            <Input id="newPw" type="password" placeholder="••••••••" minLength={6}
              value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirmPw">Confirm New Password</Label>
            <Input id="confirmPw" type="password" placeholder="••••••••" minLength={6}
              value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} />
          </div>
          <Button onClick={handleChangePassword} disabled={savingPassword || !newPassword || !confirmNewPassword}
            className="btn-gradient rounded-xl shadow-lg w-fit">
            {savingPassword ? "Updating..." : "Update password"}
          </Button>
        </CardContent>
      </Card>

      <Separator className="my-8" />

      {/* MFA */}
      <Card className="glass-card rounded-2xl md:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            {mfaEnrolled
              ? "Your account is protected with an authenticator app."
              : "Add an extra layer of security to your account."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mfaEnrolled ? (
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="gap-1.5 text-green-600 border-green-500/30">
                <ShieldCheck className="h-3 w-3" /> MFA Active
              </Badge>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive/10"
                onClick={async () => {
                  const supabase = createClient();
                  const { data } = await supabase.auth.mfa.listFactors();
                  const factor = data?.totp?.find((f) => f.status === "verified");
                  if (factor) {
                    const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
                    if (error) {
                      toast.error(error.message);
                    } else {
                      setMfaEnrolled(false);
                      toast.success("MFA disabled.");
                    }
                  }
                }}
              >
                Disable MFA
              </Button>
            </div>
          ) : showMfaSetup ? (
            <MfaEnrollment
              variant="inline"
              showSkip
              onSkip={() => setShowMfaSetup(false)}
              onComplete={() => {
                setMfaEnrolled(true);
                setShowMfaSetup(false);
              }}
            />
          ) : (
            <Button onClick={() => setShowMfaSetup(true)} className="btn-gradient rounded-xl shadow-lg">
              Enable MFA
            </Button>
          )}
        </CardContent>
      </Card>

      <Separator className="my-8" />

      {/* Danger zone */}
      <Card className="border-destructive/30 glass-card rounded-2xl">
        <CardHeader>
          <CardTitle className="text-sm text-destructive">Danger zone</CardTitle>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Delete account</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently deletes everything. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAccount}>Delete everything</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      <MfaChallenge
        open={mfaChallengeOpen}
        onOpenChange={setMfaChallengeOpen}
        onVerified={performDeleteAccount}
        title="Confirm account deletion"
        description="Enter your authenticator code to confirm you want to delete your account."
      />
    </div>
  );
}