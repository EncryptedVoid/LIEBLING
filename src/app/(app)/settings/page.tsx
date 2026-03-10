"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { THEME_COLORS } from "@/lib/theme-colors";
import { Check, Sun, Moon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { FriendCodeShare } from "@/components/friend-code-share";
import { toast } from "sonner";

export default function SettingsPage() {
  const supabase = createClient();
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [friendCode, setFriendCode] = useState("");
  const [birthday, setBirthday] = useState<Date | undefined>();
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");
  const [themeColor, setThemeColor] = useState("zinc");
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingTheme, setSavingTheme] = useState(false);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("users")
        .select("display_name, friend_code, birthday, theme_mode, theme_color")
        .eq("id", user.id)
        .single();

      if (data) {
        setDisplayName(data.display_name);
        setFriendCode(data.friend_code);
        setBirthday(data.birthday ? new Date(data.birthday) : undefined);
        setThemeMode(data.theme_mode);
        setThemeColor(data.theme_color);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSaveProfile() {
    setSavingProfile(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("users")
      .update({
        display_name: displayName.trim(),
        birthday: birthday ? format(birthday, "yyyy-MM-dd") : null,
      })
      .eq("id", user!.id);

    if (error) {
      toast.error("Couldn't save profile.");
    } else {
      toast.success("Profile updated.");
      router.refresh();
    }
    setSavingProfile(false);
  }

  async function handleSaveTheme() {
    setSavingTheme(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("users")
      .update({
        theme_mode: themeMode,
        theme_color: themeColor,
      })
      .eq("id", user!.id);

    if (error) {
      toast.error("Couldn't save theme.");
    } else {
      toast.success("Theme updated. Refreshing...");
      router.refresh();
    }
    setSavingTheme(false);
  }

  async function handleDeleteAccount() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (loading) {
    return (
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <div className="mt-8 h-64 rounded-lg bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      {/* ── Profile ────────────────────────────────────── */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
          <CardDescription>Your name and birthday.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="displayName">Display name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
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

          <Button onClick={handleSaveProfile} disabled={savingProfile}>
            {savingProfile ? "Saving..." : "Save profile"}
          </Button>
        </CardContent>
      </Card>

      {/* ── Appearance ─────────────────────────────────── */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
          <CardDescription>Customize how Lieblings looks.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {/* Mode toggle */}
          <div className="flex flex-col gap-2">
            <Label>Mode</Label>
            <div className="flex gap-3">
              <button
                onClick={() => setThemeMode("light")}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg border-2 p-3 transition-all ${
                  themeMode === "light"
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-muted-foreground/20"
                }`}
              >
                <Sun className="h-4 w-4" />
                <span className="text-sm font-medium">Light</span>
                {themeMode === "light" && <Check className="h-3 w-3 text-primary" />}
              </button>
              <button
                onClick={() => setThemeMode("dark")}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg border-2 p-3 transition-all ${
                  themeMode === "dark"
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-muted-foreground/20"
                }`}
              >
                <Moon className="h-4 w-4" />
                <span className="text-sm font-medium">Dark</span>
                {themeMode === "dark" && <Check className="h-3 w-3 text-primary" />}
              </button>
            </div>
          </div>

          {/* Color picker */}
          <div className="flex flex-col gap-2">
            <Label>Accent color</Label>
            <div className="grid grid-cols-6 gap-2">
              {THEME_COLORS.map((color) => (
                <button
                  key={color.id}
                  onClick={() => setThemeColor(color.id)}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 transition-all ${
                    themeColor === color.id
                      ? "border-foreground"
                      : "border-muted hover:border-muted-foreground/20"
                  }`}
                >
                  <div
                    className="h-6 w-6 rounded-full"
                    style={{ backgroundColor: color.preview }}
                  />
                  <span className="text-[10px] font-medium">{color.label}</span>
                </button>
              ))}
            </div>
          </div>

          <Button onClick={handleSaveTheme} disabled={savingTheme}>
            {savingTheme ? "Saving..." : "Save appearance"}
          </Button>
        </CardContent>
      </Card>

      {/* ── Friend code ────────────────────────────────── */}
      <div className="mt-6">
        <FriendCodeShare friendCode={friendCode} />
      </div>

      <Separator className="my-8" />

      {/* ── Danger zone ────────────────────────────────── */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Danger zone</CardTitle>
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
                  This permanently deletes all your items, collections, events,
                  and friendships. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAccount}>
                  Delete everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}