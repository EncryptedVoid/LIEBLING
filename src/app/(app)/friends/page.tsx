"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { FriendCodeShare } from "@/components/friend-code-share";
import { toast } from "sonner";

import type { User } from "@/lib/types";

type FriendRow = {
  id: string;
  status: "pending" | "accepted";
  friend: User;
  isIncoming: boolean;
};

export default function FriendsPage() {
  const supabase = createClient();
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [friendCode, setFriendCode] = useState("");
  const [friends, setFriends] = useState<FriendRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [adding, setAdding] = useState(false);

  async function fetchData() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUserId(user.id);

    // Get my friend code
    const { data: profile } = await supabase
      .from("users")
      .select("friend_code")
      .eq("id", user.id)
      .single();
    setFriendCode(profile?.friend_code ?? "");

    // Get friendships where I'm involved
    const { data: friendships } = await supabase
      .from("friendships")
      .select("id, status, requester_id, addressee_id")
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

    if (!friendships) {
      setLoading(false);
      return;
    }

    // Get friend profiles
    const friendIds = friendships.map((f) =>
      f.requester_id === user.id ? f.addressee_id : f.requester_id
    );

    const { data: profiles } = await supabase
      .from("users")
      .select("id, display_name, avatar_url, friend_code, created_at")
      .in("id", friendIds);

    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

    const rows: FriendRow[] = friendships.map((f) => {
      const friendId =
        f.requester_id === user.id ? f.addressee_id : f.requester_id;
      return {
        id: f.id,
        status: f.status,
        friend: profileMap.get(friendId)!,
        isIncoming: f.addressee_id === user.id,
      };
    });

    // Deduplicate: if both users sent requests, keep only one (prefer accepted)
    const seen = new Map<string, FriendRow>();
    for (const row of rows) {
      if (!row.friend) continue;
      const existing = seen.get(row.friend.id);
      if (!existing || (row.status === "accepted" && existing.status !== "accepted")) {
        seen.set(row.friend.id, row);
      }
    }

    setFriends(Array.from(seen.values()));
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function handleAddByCode() {
    if (!codeInput.trim()) return;
    setAdding(true);

    // Look up user by friend code
    const { data: target } = await supabase
      .from("users")
      .select("id")
      .eq("friend_code", codeInput.trim().toUpperCase())
      .single();

    if (!target) {
      toast.error("No user found with that code.");
      setAdding(false);
      return;
    }

    if (target.id === currentUserId) {
      toast.error("That's your own code!");
      setAdding(false);
      return;
    }

    // Check if friendship already exists in either direction
    const { data: existing } = await supabase
      .from("friendships")
      .select("id")
      .or(
        `and(requester_id.eq.${currentUserId},addressee_id.eq.${target.id}),and(requester_id.eq.${target.id},addressee_id.eq.${currentUserId})`
      );

    if (existing && existing.length > 0) {
      toast.error("You're already connected or have a pending request.");
      setAdding(false);
      return;
    }

    const { error } = await supabase.from("friendships").insert({
      requester_id: currentUserId,
      addressee_id: target.id,
      status: "pending",
    });

    if (error) {
      toast.error(
        error.message.includes("duplicate")
          ? "You're already connected."
          : "Couldn't send request."
      );
    } else {
      toast.success("Friend request sent!");
      setCodeInput("");
      setAddDialogOpen(false);
      fetchData();
    }
    setAdding(false);
  }

  async function handleAccept(friendshipId: string) {
    const { error } = await supabase
      .from("friendships")
      .update({ status: "accepted" })
      .eq("id", friendshipId);
    if (error) {
      toast.error("Couldn't accept request.");
    } else {
      toast.success("Friend added!");
      fetchData();
    }
  }

  const accepted = friends.filter((f) => f.status === "accepted");
  const pendingIncoming = friends.filter(
    (f) => f.status === "pending" && f.isIncoming
  );
  const pendingOutgoing = friends.filter(
    (f) => f.status === "pending" && !f.isIncoming
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Friends</h1>
          <p className="text-muted-foreground mt-1">
            Share wishlists and claim items for each other.
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>Add friend</Button>
      </div>

      {/* Your share card */}
      <div className="mt-8 max-w-sm">
        {friendCode && <FriendCodeShare friendCode={friendCode} />}
      </div>

      <Separator className="my-8" />

      {/* Pending incoming */}
      {pendingIncoming.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-medium mb-3">Pending requests</h2>
          <div className="flex flex-col gap-2">
            {pendingIncoming.map((f) => (
              <Card key={f.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={f.friend.avatar_url ?? undefined} />
                      <AvatarFallback>
                        {f.friend.display_name[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">
                      {f.friend.display_name}
                    </span>
                  </div>
                  <Button size="sm" onClick={() => handleAccept(f.id)}>
                    Accept
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Pending outgoing */}
      {pendingOutgoing.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-medium mb-3">Sent requests</h2>
          <div className="flex flex-col gap-2">
            {pendingOutgoing.map((f) => (
              <Card key={f.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={f.friend.avatar_url ?? undefined} />
                      <AvatarFallback>
                        {f.friend.display_name[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">
                      {f.friend.display_name}
                    </span>
                  </div>
                  <Badge variant="outline">Pending</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Accepted friends */}
      <div>
        <h2 className="text-lg font-medium mb-3">
          Your friends ({accepted.length})
        </h2>
        {loading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : accepted.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">
            No friends yet. Share your code or add someone by theirs.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {accepted.map((f) => (
              <Link key={f.id} href={`/profile/${f.friend.id}`}>
                <Card className="hover:border-primary/40 transition-colors">
                  <CardContent className="flex items-center gap-3 p-4">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={f.friend.avatar_url ?? undefined} />
                      <AvatarFallback>
                        {f.friend.display_name[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">
                      {f.friend.display_name}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Add by code dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add a friend</DialogTitle>
            <DialogDescription>
              Enter their friend code to send a request.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="friendCode">Friend code</Label>
              <Input
                id="friendCode"
                placeholder="e.g. LIEB-A3X9"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddByCode()}
              />
            </div>
            <Button
              onClick={handleAddByCode}
              disabled={adding || !codeInput.trim()}
            >
              {adding ? "Sending..." : "Send request"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}