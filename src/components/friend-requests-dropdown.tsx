"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { UserPlus, Check, X, Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";

import type { User } from "@/lib/types";

type FriendRequest = {
  id: string;
  status: "pending" | "accepted";
  friend: User;
  isIncoming: boolean;
};

export function FriendRequestsDropdown({ userId }: { userId: string }) {
  const supabase = createClient();
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [codeInput, setCodeInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchRequests = useCallback(async () => {
    const { data: friendships } = await supabase
      .from("friendships")
      .select("id, status, requester_id, addressee_id")
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
      .eq("status", "pending");

    if (!friendships || friendships.length === 0) {
      setRequests([]);
      return;
    }

    const friendIds = friendships.map((f) =>
      f.requester_id === userId ? f.addressee_id : f.requester_id
    );

    const { data: profiles } = await supabase
      .from("users")
      .select("id, display_name, avatar_url, friend_code, created_at")
      .in("id", friendIds);

    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

    const rows: FriendRequest[] = friendships
      .map((f) => {
        const friendId =
          f.requester_id === userId ? f.addressee_id : f.requester_id;
        const profile = profileMap.get(friendId);
        if (!profile) return null;
        return {
          id: f.id,
          status: f.status as "pending" | "accepted",
          friend: profile as User,
          isIncoming: f.addressee_id === userId,
        };
      })
      .filter(Boolean) as FriendRequest[];

    setRequests(rows);
  }, [userId, supabase]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Re-fetch when popover opens
  useEffect(() => {
    if (open) fetchRequests();
  }, [open, fetchRequests]);

  async function handleAccept(friendshipId: string) {
    const { error } = await supabase
      .from("friendships")
      .update({ status: "accepted" })
      .eq("id", friendshipId);
    if (error) {
      toast.error("Couldn't accept request.");
    } else {
      toast.success("Friend added!");
      fetchRequests();
    }
  }

  async function handleDeny(friendshipId: string) {
    const { error } = await supabase
      .from("friendships")
      .delete()
      .eq("id", friendshipId);
    if (error) {
      toast.error("Couldn't deny request.");
    } else {
      toast.success("Request removed.");
      fetchRequests();
    }
  }

  async function handleAddByCode() {
    if (!codeInput.trim()) return;
    setAdding(true);

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
    if (target.id === userId) {
      toast.error("That's your own code!");
      setAdding(false);
      return;
    }

    const { data: existing } = await supabase
      .from("friendships")
      .select("id")
      .or(
        `and(requester_id.eq.${userId},addressee_id.eq.${target.id}),and(requester_id.eq.${target.id},addressee_id.eq.${userId})`
      );

    if (existing && existing.length > 0) {
      toast.error("Already connected or request pending.");
      setAdding(false);
      return;
    }

    const { error } = await supabase.from("friendships").insert({
      requester_id: userId,
      addressee_id: target.id,
      status: "pending",
    });

    if (error) {
      toast.error("Couldn't send request.");
    } else {
      toast.success("Friend request sent!");
      setCodeInput("");
      fetchRequests();
    }
    setAdding(false);
  }

  const incomingCount = requests.filter((r) => r.isIncoming).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <UserPlus className="h-4 w-4" />
          {incomingCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground animate-in zoom-in-50">
              {incomingCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="p-3 pb-2">
          <h3 className="text-sm font-medium">Friends</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Add friends and manage requests
          </p>
        </div>
        <Separator />

        {/* Add by code */}
        <div className="p-3">
          <Label className="text-xs text-muted-foreground mb-1.5">
            Add by friend code
          </Label>
          <div className="flex gap-2">
            <Input
              placeholder="LIEB-XXXX"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddByCode()}
              className="text-xs"
            />
            <Button
              size="sm"
              onClick={handleAddByCode}
              disabled={adding || !codeInput.trim()}
            >
              {adding ? "..." : "Add"}
            </Button>
          </div>
        </div>

        {/* Incoming requests */}
        {requests.filter((r) => r.isIncoming).length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <p className="px-1 pb-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Incoming requests
              </p>
              {requests
                .filter((r) => r.isIncoming)
                .map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between rounded-md px-1 py-1.5 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar className="h-7 w-7">
                        <AvatarImage
                          src={req.friend.avatar_url ?? undefined}
                        />
                        <AvatarFallback className="text-[10px]">
                          {req.friend.display_name[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium truncate">
                        {req.friend.display_name}
                      </span>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="text-green-600 hover:text-green-700 hover:bg-green-100"
                        onClick={() => handleAccept(req.id)}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeny(req.id)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </>
        )}

        {/* Outgoing requests */}
        {requests.filter((r) => !r.isIncoming).length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <p className="px-1 pb-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Sent requests
              </p>
              {requests
                .filter((r) => !r.isIncoming)
                .map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between rounded-md px-1 py-1.5"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar className="h-7 w-7">
                        <AvatarImage
                          src={req.friend.avatar_url ?? undefined}
                        />
                        <AvatarFallback className="text-[10px]">
                          {req.friend.display_name[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs truncate">
                        {req.friend.display_name}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      Pending
                    </Badge>
                  </div>
                ))}
            </div>
          </>
        )}

        {requests.length === 0 && (
          <div className="p-4 text-center">
            <p className="text-xs text-muted-foreground">
              No pending requests
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}