"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { Check, Sun, Moon } from "lucide-react";
import { THEME_COLORS } from "@/lib/theme-colors";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(0);
  const [birthday, setBirthday] = useState<Date | undefined>();
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");
  const [themeColor, setThemeColor] = useState("zinc");
  const [saving, setSaving] = useState(false);

  const totalSteps = 3;

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
                i === step ? "w-8 bg-primary" : "w-2 bg-muted-foreground/20"
              }`}
            />
          ))}
        </div>

        {/* ── Step 0: Birthday ──────────────────────────── */}
        {step === 0 && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">When's your birthday?</CardTitle>
              <CardDescription>
                We'll let your friends know when it's coming up.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full max-w-xs justify-start font-normal">
                    {birthday ? format(birthday, "MMMM d, yyyy") : "Pick your birthday"}
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
                  onClick={() => {
                    setBirthday(undefined);
                    setStep(1);
                  }}
                >
                  Skip
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => setStep(1)}
                  disabled={!birthday}
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Step 1: Light / Dark mode ─────────────────── */}
        {step === 1 && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Light or dark?</CardTitle>
              <CardDescription>You can always change this later.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <div className="flex gap-3 w-full max-w-xs">
                <button
                  onClick={() => setThemeMode("light")}
                  className={`flex-1 flex flex-col items-center gap-2 rounded-lg border-2 p-6 transition-all ${
                    themeMode === "light"
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-muted-foreground/20"
                  }`}
                >
                  <Sun className="h-8 w-8" />
                  <span className="text-sm font-medium">Light</span>
                  {themeMode === "light" && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </button>
                <button
                  onClick={() => setThemeMode("dark")}
                  className={`flex-1 flex flex-col items-center gap-2 rounded-lg border-2 p-6 transition-all ${
                    themeMode === "dark"
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-muted-foreground/20"
                  }`}
                >
                  <Moon className="h-8 w-8" />
                  <span className="text-sm font-medium">Dark</span>
                  {themeMode === "dark" && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </button>
              </div>

              <div className="flex gap-2 w-full max-w-xs">
                <Button variant="ghost" className="flex-1" onClick={() => setStep(0)}>
                  Back
                </Button>
                <Button className="flex-1" onClick={() => setStep(2)}>
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Step 2: Theme color ───────────────────────── */}
        {step === 2 && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Pick a color</CardTitle>
              <CardDescription>
                This sets the accent color across your experience.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
                {THEME_COLORS.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => setThemeColor(color.id)}
                    className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                      themeColor === color.id
                        ? "border-foreground"
                        : "border-muted hover:border-muted-foreground/20"
                    }`}
                  >
                    <div
                      className="h-8 w-8 rounded-full"
                      style={{ backgroundColor: color.preview }}
                    />
                    <span className="text-xs font-medium">{color.label}</span>
                    {themeColor === color.id && (
                      <Check className="h-3 w-3" />
                    )}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 w-full max-w-xs">
                <Button variant="ghost" className="flex-1" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button className="flex-1" onClick={handleFinish} disabled={saving}>
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