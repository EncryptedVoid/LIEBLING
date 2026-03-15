"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
          // Detect "no account" type errors
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
    <Card className="w-full max-w-sm shadow-lg shadow-primary/5">
      <CardHeader>
        <CardTitle className="text-lg">{isSignup ? "Create an account" : "Welcome back"}</CardTitle>
        <CardDescription>
          {isSignup ? "Sign up to start building your wishlists." : "Log in to your Lieblings account."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* No-account banner for login mode */}
        {noAccountBanner && !isSignup && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800/50 p-3 animate-in fade-in-50 slide-in-from-top-2 duration-300">
            <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
              No account found with that email.
            </p>
            <p className="text-[11px] text-amber-700/80 dark:text-amber-300/70 mt-0.5">
              Would you like to sign up instead? Your details will carry over.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 h-6 text-[11px] border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-900/50"
              asChild
            >
              <Link href={`/signup?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`}>
                Sign up with these details →
              </Link>
            </Button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isSignup && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="displayName">Name</Label>
              <Input id="displayName" type="text" placeholder="Your name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => { setEmail(e.target.value); setNoAccountBanner(false); }} required />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => { setPassword(e.target.value); setNoAccountBanner(false); }} required minLength={6} />
          </div>

          <Button type="submit" disabled={loading} className="mt-2 shadow-sm">
            {loading
              ? isSignup ? "Creating account..." : "Logging in..."
              : isSignup ? "Sign up" : "Log in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}