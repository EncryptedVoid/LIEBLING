"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { Sparkles, ArrowLeft, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const prefillEmail = searchParams.get("email") ?? "";
  const [email, setEmail] = useState(prefillEmail);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  useEffect(() => {
    if (!document.documentElement.getAttribute("data-marketing-theme")) {
      const stored = localStorage.getItem("lieblings-marketing-theme");
      document.documentElement.setAttribute("data-marketing-theme", stored || "dark");
    }

    // Check if user arrived via a recovery link (has access_token in hash)
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecoveryMode(true);
      }
    });
  }, []);

  async function handleSendResetEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
      toast.success("Check your email for a reset link.");
    }
    setLoading(false);
  }

  async function handleSetNewPassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated! Redirecting to login...");
      setTimeout(() => router.push("/login"), 2000);
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 relative overflow-hidden mkt-bg transition-colors duration-500">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="mkt-orb-1 absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-25"
          style={{ background: "radial-gradient(circle, rgba(251,191,36,0.4) 0%, rgba(244,63,94,0.2) 50%, transparent 70%)" }} />
      </div>

      <div className="w-full max-w-sm rounded-2xl border mkt-card-border mkt-bg-card backdrop-blur-xl p-6 shadow-2xl animate-scale-in">
        <div className="text-center mb-6">
          <div className="mx-auto h-12 w-12 rounded-xl flex items-center justify-center shadow-lg mb-3"
            style={{ background: "linear-gradient(135deg, #fbbf24, #f43f5e)" }}>
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <p className="text-sm font-medium mkt-text">
            {isRecoveryMode ? "Set a new password" : "Reset your password"}
          </p>
          <p className="text-xs mkt-text-muted mt-0.5">
            {isRecoveryMode
              ? "Choose a strong new password."
              : "We'll send you a link to reset it."}
          </p>
        </div>

        {isRecoveryMode ? (
          <form onSubmit={handleSetNewPassword} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs mkt-text-muted">New Password</Label>
              <Input
                type="password" placeholder="••••••••" minLength={6} required
                value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                className="rounded-xl border mkt-card-border mkt-bg-subtle mkt-text placeholder:mkt-text-faint focus-visible:border-amber-500/40 focus-visible:ring-amber-500/20"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs mkt-text-muted">Confirm Password</Label>
              <Input
                type="password" placeholder="••••••••" minLength={6} required
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                className="rounded-xl border mkt-card-border mkt-bg-subtle mkt-text placeholder:mkt-text-faint focus-visible:border-amber-500/40 focus-visible:ring-amber-500/20"
              />
            </div>
            <Button type="submit" disabled={loading}
              className="mt-2 rounded-xl shadow-lg font-semibold text-black"
              style={{ background: "linear-gradient(135deg, #fbbf24, #fb923c, #f43f5e)" }}>
              {loading ? "Updating..." : "Set new password"}
            </Button>
          </form>
        ) : sent ? (
          <div className="text-center py-4 animate-fade-up">
            <div className="mx-auto h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center mb-3">
              <Check className="h-6 w-6 text-green-500" />
            </div>
            <p className="text-sm font-medium mkt-text">Check your email</p>
            <p className="text-xs mkt-text-muted mt-1">We sent a reset link to <strong>{email}</strong></p>
          </div>
        ) : (
          <form onSubmit={handleSendResetEmail} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs mkt-text-muted">Email</Label>
              <Input
                type="email" placeholder="you@example.com" required
                value={email} onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl border mkt-card-border mkt-bg-subtle mkt-text placeholder:mkt-text-faint focus-visible:border-amber-500/40 focus-visible:ring-amber-500/20"
              />
            </div>
            <Button type="submit" disabled={loading}
              className="mt-2 rounded-xl shadow-lg font-semibold text-black"
              style={{ background: "linear-gradient(135deg, #fbbf24, #fb923c, #f43f5e)" }}>
              {loading ? "Sending..." : "Send reset link"}
            </Button>
          </form>
        )}
      </div>

      <p className="mt-6 text-sm mkt-text-muted animate-fade-up" style={{ animationDelay: "200ms" }}>
        <Link href="/login" className="font-medium bg-gradient-to-r from-amber-300 to-rose-400 bg-clip-text text-transparent hover:opacity-80 transition-opacity underline underline-offset-4">
          <ArrowLeft className="h-3 w-3 inline mr-1" />Back to login
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen mkt-bg">
        <div className="h-8 w-8 rounded-full animate-spin border-2 border-transparent border-t-amber-400" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}