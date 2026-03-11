"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { Check, Sun, Moon } from "lucide-react";
import { THEME_COLORS } from "@/lib/theme-colors";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { AvatarUpload } from "@/components/avatar-upload";
import { toast } from "sonner";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [birthday, setBirthday] = useState<Date | undefined>();
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");
  const [themeColor, setThemeColor] = useState("zinc");
  const [saving, setSaving] = useState(false);

  const totalSteps = 4;

  // Load display name on mount
  useState(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase
          .from("users")
          .select("display_name, avatar_url")
          .eq("id", user.id)
          .single()
          .then(({ data }) => {
            if (data) {
              setDisplayName(data.display_name);
              setAvatarUrl(data.avatar_url);
            }
          });
      }
    });
  });

  async function handleFinish() {
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Not logged in.");
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("users")
      .update({
        birthday: birthday ? format(birthday, "yyyy-MM-dd") : null,
        theme_mode: themeMode,
        theme_color: themeColor,
        onboarded: true,
      })
      .eq("id", user.id);

    if (error) {
      toast.error("Something went wrong.");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
    setSaving(false);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-md">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === step ? "w-8 bg-primary" : i < step ? "w-2 bg-primary/50" : "w-2 bg-muted-foreground/20"
              }`}
            />
          ))}
        </div>

        {/* ── Step 0: Avatar ───────────────────────────── */}
        {step === 0 && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Add a profile photo</CardTitle>
              <CardDescription>
                Help your friends recognize you.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6">
              <AvatarUpload
                currentUrl={avatarUrl}
                displayName={displayName || "U"}
                onUploaded={(url) => setAvatarUrl(url)}
                size="lg"
              />

              <div className="flex gap-2 w-full max-w-xs">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={() => setStep(1)}
                >
                  Skip
                </Button>
                <Button className="flex-1" onClick={() => setStep(1)}>
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Step 1: Birthday ─────────────────────────── */}
        {step === 1 && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">When&apos;s your birthday?</CardTitle>
              <CardDescription>
                We&apos;ll let your friends know when it&apos;s coming up.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full max-w-xs justify-start font-normal"
                  >
                    {birthday
                      ? format(birthday, "MMMM d, yyyy")
                      : "Pick your birthday"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center">
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

              <div className="flex gap-2 w-full max-w-xs">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={() => setStep(0)}
                >
                  Back
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => setStep(2)}
                >
                  {birthday ? "Next" : "Skip"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Step 2: Light / Dark ─────────────────────── */}
        {step === 2 && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Light or dark?</CardTitle>
              <CardDescription>You can always change this later.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <div className="flex gap-3 w-full max-w-xs">
                {(["light", "dark"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setThemeMode(mode)}
                    className={`flex-1 flex flex-col items-center gap-2 rounded-xl border-2 p-6 transition-all ${
                      themeMode === mode
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-muted hover:border-muted-foreground/20"
                    }`}
                  >
                    {mode === "light" ? (
                      <Sun className="h-8 w-8" />
                    ) : (
                      <Moon className="h-8 w-8" />
                    )}
                    <span className="text-sm font-medium capitalize">
                      {mode}
                    </span>
                    {themeMode === mode && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 w-full max-w-xs">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={() => setStep(1)}
                >
                  Back
                </Button>
                <Button className="flex-1" onClick={() => setStep(3)}>
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Step 3: Theme color ──────────────────────── */}
        {step === 3 && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Pick a color</CardTitle>
              <CardDescription>
                Your accent color across the experience.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
                {THEME_COLORS.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => setThemeColor(color.id)}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                      themeColor === color.id
                        ? "border-foreground shadow-sm"
                        : "border-muted hover:border-muted-foreground/20"
                    }`}
                  >
                    <div
                      className="h-8 w-8 rounded-full shadow-inner"
                      style={{ backgroundColor: color.preview }}
                    />
                    <span className="text-xs font-medium">{color.label}</span>
                    {themeColor === color.id && <Check className="h-3 w-3" />}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 w-full max-w-xs">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={() => setStep(2)}
                >
                  Back
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleFinish}
                  disabled={saving}
                >
                  {saving ? "Setting up..." : "Let's go!"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}