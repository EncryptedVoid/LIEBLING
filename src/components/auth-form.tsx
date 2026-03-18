"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type AuthFormProps = {
  mode: "login" | "signup";
  prefillEmail?: string;
  prefillPassword?: string;
};

export function AuthForm({ mode, prefillEmail, prefillPassword }: AuthFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(prefillEmail ?? "");
  const [password, setPassword] = useState(prefillPassword ?? "");
  const [displayName, setDisplayName] = useState("");
  const [noAccountBanner, setNoAccountBanner] = useState(false);

  const isSignup = mode === "signup";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setNoAccountBanner(false);

    try {
      if (isSignup) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName } },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          const msg = error.message.toLowerCase();
          if (msg.includes("invalid login") || msg.includes("invalid credentials") || msg.includes("user not found")) {
            setNoAccountBanner(true);
            toast.error("No account found with these credentials.");
            setLoading(false);
            return;
          }
          throw error;
        }
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm rounded-2xl border mkt-card-border mkt-bg-card backdrop-blur-xl p-6 shadow-2xl animate-scale-in">
      {/* Logo */}
      <div className="text-center mb-6">
        <div className="mx-auto h-12 w-12 rounded-xl flex items-center justify-center shadow-lg mb-3"
          style={{ background: "linear-gradient(135deg, #fbbf24, #f43f5e)" }}>
          <Sparkles className="h-6 w-6 text-white" />
        </div>
        <span className="text-2xl font-heading font-bold bg-gradient-to-r from-amber-300 via-rose-400 to-pink-400 bg-clip-text text-transparent">
          lieblings
        </span>
        <p className="text-sm font-medium mkt-text mt-2">
          {isSignup ? "Create an account" : "Welcome back"}
        </p>
        <p className="text-xs mkt-text-muted mt-0.5">
          {isSignup ? "Sign up to start building your wishlists." : "Log in to your Lieblings account."}
        </p>
      </div>

      {/* No-account banner */}
      {noAccountBanner && !isSignup && (
        <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 animate-in fade-in-50 slide-in-from-top-2 duration-300">
          <p className="text-xs font-medium text-amber-300">No account found with that email.</p>
          <p className="text-[11px] mkt-text-muted mt-0.5">Would you like to sign up instead?</p>
          <Button variant="outline" size="sm" className="mt-2 h-6 text-[11px] border-amber-500/30 text-amber-300 hover:bg-amber-500/10 rounded-lg" asChild>
            <Link href={`/signup?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`}>
              Sign up with these details →
            </Link>
          </Button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {isSignup && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="displayName" className="text-xs mkt-text-muted">Name</Label>
            <Input
              id="displayName" type="text" placeholder="Your name"
              value={displayName} onChange={(e) => setDisplayName(e.target.value)}
              required
              className="rounded-xl border mkt-card-border mkt-bg-subtle mkt-text placeholder:mkt-text-faint focus-visible:border-amber-500/40 focus-visible:ring-amber-500/20"
            />
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email" className="text-xs mkt-text-muted">Email</Label>
          <Input
            id="email" type="email" placeholder="you@example.com"
            value={email} onChange={(e) => { setEmail(e.target.value); setNoAccountBanner(false); }}
            required
            className="rounded-xl border mkt-card-border mkt-bg-subtle mkt-text placeholder:mkt-text-faint focus-visible:border-amber-500/40 focus-visible:ring-amber-500/20"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password" className="text-xs mkt-text-muted">Password</Label>
          <Input
            id="password" type="password" placeholder="••••••••"
            value={password} onChange={(e) => { setPassword(e.target.value); setNoAccountBanner(false); }}
            required minLength={6}
            className="rounded-xl border mkt-card-border mkt-bg-subtle mkt-text placeholder:mkt-text-faint focus-visible:border-amber-500/40 focus-visible:ring-amber-500/20"
          />
        </div>

        <Button
          type="submit" disabled={loading}
          className="mt-2 rounded-xl shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 font-semibold text-black transition-all hover:scale-[1.02]"
          style={{ background: "linear-gradient(135deg, #fbbf24, #fb923c, #f43f5e)" }}
        >
          {loading
            ? isSignup ? "Creating account..." : "Logging in..."
            : isSignup ? "Sign up" : "Log in"}
        </Button>
      </form>
    </div>
  );
}