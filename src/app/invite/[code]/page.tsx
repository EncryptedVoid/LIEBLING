"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import type { User } from "@/lib/types";

export default function InvitePage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [inviter, setInviter] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      // Check if logged in
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUser(user?.id ?? null);

      // Look up who owns this code
      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("friend_code", code.toUpperCase())
        .single();

      if (!profile) {
        setError("This invite code doesn't match anyone.");
      } else if (user && profile.id === user.id) {
        setError("This is your own invite code!");
      } else {
        setInviter(profile);
      }
      setLoading(false);
    }
    load();
  }, [code]);

  async function handleAccept() {
    if (!currentUser || !inviter) return;
    setAccepting(true);

    // Check if friendship already exists in either direction
    const { data: existing } = await supabase
      .from("friendships")
      .select("id")
      .or(
        `and(requester_id.eq.${currentUser},addressee_id.eq.${inviter.id}),and(requester_id.eq.${inviter.id},addressee_id.eq.${currentUser})`
      );

    if (existing && existing.length > 0) {
      toast.error("You're already connected!");
      router.push("/friends");
      setAccepting(false);
      return;
    }

    const { error: err } = await supabase.from("friendships").insert({
      requester_id: currentUser,
      addressee_id: inviter.id,
      status: "pending",
    });

    if (err) {
      toast.error(
        err.message.includes("duplicate")
          ? "You're already connected!"
          : "Something went wrong."
      );
    } else {
      toast.success(`Friend request sent to ${inviter.display_name}!`);
      router.push("/friends");
    }
    setAccepting(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4">
        <p className="text-muted-foreground">{error}</p>
        <Button asChild variant="outline">
          <Link href="/">Go home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <div className="flex justify-center mb-2">
            <Avatar className="h-16 w-16">
              <AvatarImage src={inviter?.avatar_url ?? undefined} />
              <AvatarFallback className="text-lg">
                {inviter?.display_name[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          <CardTitle>{inviter?.display_name}</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            wants to share wishlists with you on Lieblings.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {currentUser ? (
            <Button onClick={handleAccept} disabled={accepting}>
              {accepting ? "Sending..." : "Add as friend"}
            </Button>
          ) : (
            <>
              <Button asChild>
                <Link href={`/signup?next=/invite/${code}`}>
                  Sign up to connect
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/login?next=/invite/${code}`}>
                  I already have an account
                </Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}