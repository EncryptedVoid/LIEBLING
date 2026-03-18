"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft, Copy, UserPlus, Shuffle, Users, Star, Snowflake,
  Check, Loader2, Gift, ExternalLink, Trash2,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";

import type { User } from "@/lib/types";

type ActivityMember = {
  user_id: string;
  assigned_to: string | null;
  joined_at: string;
  user?: User;
  assigned_user?: User;
};

type Activity = {
  id: string;
  creator_id: string;
  type: "secret_santa" | "gift_roulette";
  title: string;
  description: string | null;
  status: "open" | "active" | "complete";
  join_code: string;
  banner_url: string | null;
  created_at: string;
};

/**
 * Derangement shuffle: ensures no one is assigned to themselves.
 * Uses the Sattolo variant for guaranteed derangement.
 */
function derangementShuffle(userIds: string[]): Map<string, string> {
  const n = userIds.length;
  if (n < 2) throw new Error("Need at least 2 people.");

  const arr = [...userIds];
  // Sattolo's algorithm — guarantees a single cycle (derangement)
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * i); // NOTE: j < i, not j <= i
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  const result = new Map<string, string>();
  for (let i = 0; i < n; i++) {
    result.set(userIds[i], arr[i]);
  }

  // Safety check — verify no self-assignments
  for (const [giver, receiver] of result) {
    if (giver === receiver) {
      // Extremely rare edge case — retry
      return derangementShuffle(userIds);
    }
  }

  return result;
}

export default function ActivityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [activity, setActivity] = useState<Activity | null>(null);
  const [members, setMembers] = useState<ActivityMember[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [shuffling, setShuffling] = useState(false);

  // Admin controls
  const [codeInput, setCodeInput] = useState("");
  const [addingByCode, setAddingByCode] = useState(false);
  const [includeSelf, setIncludeSelf] = useState(false);

  const isAdmin = activity?.creator_id === currentUserId;
  const isOpen = activity?.status === "open";
  const isActive = activity?.status === "active";
  const isComplete = activity?.status === "complete";
  const isMember = members.some((m) => m.user_id === currentUserId);
  const isSecretSanta = activity?.type === "secret_santa";

  const myAssignment = members.find(
    (m) => m.user_id === currentUserId
  )?.assigned_user;

  const joinUrl = typeof window !== "undefined"
    ? `${window.location.origin}/activities/join/${activity?.join_code}`
    : "";

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUserId(user.id);

    const { data: act } = await supabase
      .from("activities")
      .select("*")
      .eq("id", id)
      .single();

    if (!act) { setLoading(false); return; }
    setActivity(act as Activity);

    // Check if admin is in the pool
    const { data: membersData } = await supabase
      .from("activity_members")
      .select("user_id, assigned_to, joined_at")
      .eq("activity_id", id)
      .order("joined_at", { ascending: true });

    const membersList = membersData ?? [];
    const userIds = [...new Set([
      ...membersList.map((m: any) => m.user_id),
      ...membersList.map((m: any) => m.assigned_to).filter(Boolean),
    ])];

    let profileMap = new Map<string, User>();
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("users")
        .select("*")
        .in("id", userIds);
      profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p as User]));
    }

    const enriched: ActivityMember[] = membersList.map((m: any) => ({
      ...m,
      user: profileMap.get(m.user_id),
      assigned_user: m.assigned_to ? profileMap.get(m.assigned_to) : undefined,
    }));

    setMembers(enriched);
    setIncludeSelf(enriched.some((m) => m.user_id === act.creator_id));
    setLoading(false);
  }, [id, supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleAddByCode() {
    if (!codeInput.trim() || !activity) return;
    setAddingByCode(true);
    const { data: target } = await supabase
      .from("users")
      .select("id")
      .eq("friend_code", codeInput.trim().toUpperCase())
      .single();

    if (!target) { toast.error("No user with that code."); setAddingByCode(false); return; }
    if (members.some((m) => m.user_id === target.id)) { toast.error("Already in the activity."); setAddingByCode(false); return; }

    const { error } = await supabase.from("activity_members").insert({
      activity_id: activity.id,
      user_id: target.id,
    });

    if (error) { toast.error("Couldn't add member."); }
    else { toast.success("Member added!"); setCodeInput(""); fetchData(); }
    setAddingByCode(false);
  }

  async function handleToggleSelf() {
    if (!activity) return;
    const newVal = !includeSelf;
    setIncludeSelf(newVal);

    if (newVal) {
      const { error } = await supabase.from("activity_members").insert({
        activity_id: activity.id,
        user_id: currentUserId,
      });
      if (error && !error.message.includes("duplicate")) { toast.error("Couldn't join."); setIncludeSelf(false); return; }
    } else {
      await supabase.from("activity_members").delete()
        .eq("activity_id", activity.id)
        .eq("user_id", currentUserId);
    }
    fetchData();
  }

  async function handleRemoveMember(userId: string) {
    if (!activity) return;
    await supabase.from("activity_members").delete()
      .eq("activity_id", activity.id)
      .eq("user_id", userId);
    toast.success("Member removed.");
    fetchData();
  }

  async function handleShuffle() {
    if (!activity || members.length < 2) return;
    if (members.length % 2 !== 0) {
      toast.error("Need an even number of participants to start.");
      return;
    }

    setShuffling(true);
    try {
      const userIds = members.map((m) => m.user_id);
      const assignments = derangementShuffle(userIds);

      // Write assignments
      for (const [giverId, receiverId] of assignments) {
        const { error } = await supabase
          .from("activity_members")
          .update({ assigned_to: receiverId })
          .eq("activity_id", activity.id)
          .eq("user_id", giverId);
        if (error) throw error;
      }

      // Update activity status
      await supabase
        .from("activities")
        .update({ status: "active" })
        .eq("id", activity.id);

      toast.success("Assignments made! Everyone can now see their match.");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Shuffle failed.");
    }
    setShuffling(false);
  }

  function copyJoinLink() {
    navigator.clipboard.writeText(joinUrl);
    toast.success("Join link copied!");
  }

  if (loading) {
    return (
      <div className="page-enter max-w-3xl mx-auto space-y-4">
        <div className="h-8 w-48 skeleton-shimmer rounded-xl" />
        <div className="h-64 skeleton-shimmer rounded-2xl" />
      </div>
    );
  }

  if (!activity) {
    return (
      <EmptyState variant="generic" title="Activity not found" description="This activity may have been deleted." className="py-24" />
    );
  }

  const TypeIcon = isSecretSanta ? Snowflake : Star;
  const typeLabel = isSecretSanta ? "Secret Santa" : "Gift Roulette";

  return (
    <div className="page-enter max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <Button variant="ghost" size="sm" onClick={() => router.push("/activities")} className="text-muted-foreground">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Activities
      </Button>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="h-14 w-14 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))', boxShadow: '0 4px 20px var(--glow)' }}>
          <TypeIcon className="h-7 w-7 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-heading font-bold tracking-tight">{activity.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={isOpen ? "default" : isActive ? "secondary" : "outline"} className="text-xs">
              {isOpen ? "Open for Joining" : isActive ? "Active" : "Complete"}
            </Badge>
            <Badge variant="outline" className="text-xs gap-1">
              <TypeIcon className="h-3 w-3" /> {typeLabel}
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Users className="h-3 w-3 mr-1" /> {members.length} members
            </Badge>
          </div>
          {activity.description && (
            <p className="text-xs text-muted-foreground mt-2">{activity.description}</p>
          )}
        </div>
      </div>

      {/* Your Assignment (visible after shuffle) */}
      {(isActive || isComplete) && myAssignment && (
        <Card className="glass-card gradient-border-card rounded-2xl overflow-hidden">
          <div className="h-2" style={{ background: 'linear-gradient(90deg, var(--gradient-from), var(--gradient-to), var(--gradient-accent))' }} />
          <CardContent className="p-6 flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-16 w-16 ring-4 ring-primary/20 shadow-lg">
                <AvatarImage src={myAssignment.avatar_url ?? undefined} />
                <AvatarFallback className="text-xl font-bold" style={{ background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))', color: 'var(--primary-foreground)' }}>
                  {myAssignment.display_name[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-primary flex items-center justify-center shadow-md border-2 border-background">
                <TypeIcon className="h-3 w-3 text-primary-foreground" />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">You&apos;re getting a gift for</p>
              <h2 className="text-xl font-heading font-bold gradient-text">{myAssignment.display_name}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Check their wishlist for gift ideas!</p>
            </div>
            <Button variant="outline" size="sm" className="shrink-0" onClick={() => router.push("/wishlist")}>
              <Gift className="h-3.5 w-3.5 mr-1.5" /> View Wishlist
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        {/* Members List */}
        <Card className="glass-card rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-heading font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {members.map((m) => (
                <div key={m.user_id} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/20 border border-border/30">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={m.user?.avatar_url ?? undefined} />
                      <AvatarFallback className="text-xs">{m.user?.display_name?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{m.user?.display_name}</p>
                      {m.user_id === activity.creator_id && (
                        <Badge variant="outline" className="text-[9px] mt-0.5">Admin</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {(isActive || isComplete) && m.assigned_to && isAdmin && (
                      <Badge variant="secondary" className="text-[10px]">Assigned</Badge>
                    )}
                    {isOpen && isAdmin && m.user_id !== currentUserId && (
                      <Button variant="ghost" size="icon-xs" onClick={() => handleRemoveMember(m.user_id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {members.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">No members yet. Share the join link!</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Admin Sidebar */}
        {isAdmin && isOpen && (
          <div className="space-y-4">
            {/* Share Link */}
            <Card className="glass-card rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold">Share Join Link</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex gap-2">
                  <Input value={joinUrl} readOnly className="text-[10px] font-mono" />
                  <Button variant="outline" size="icon-sm" onClick={copyJoinLink}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">Anyone with this link can join the activity.</p>
              </CardContent>
            </Card>

            {/* Add by Code */}
            <Card className="glass-card rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold">Add by Friend Code</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex gap-2">
                  <Input placeholder="LIEB-XXXX-XXXX" value={codeInput} onChange={(e) => setCodeInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddByCode()} className="font-mono text-xs" />
                  <Button size="sm" onClick={handleAddByCode} disabled={addingByCode || !codeInput.trim()} className="btn-gradient">
                    <UserPlus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Include Self */}
            <Card className="glass-card rounded-2xl">
              <CardContent className="p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox checked={includeSelf} onCheckedChange={handleToggleSelf} />
                  <div>
                    <p className="text-xs font-medium">Include yourself</p>
                    <p className="text-[10px] text-muted-foreground">Add yourself to the pool</p>
                  </div>
                </label>
              </CardContent>
            </Card>

            {/* Start Button */}
            <Button
              className="w-full h-12 btn-gradient rounded-xl shadow-lg text-sm font-semibold gap-2"
              disabled={members.length < 2 || members.length % 2 !== 0 || shuffling}
              onClick={handleShuffle}
            >
              {shuffling ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Shuffling...</>
              ) : (
                <><Shuffle className="h-4 w-4" /> Start {typeLabel}</>
              )}
            </Button>
            {members.length > 0 && members.length % 2 !== 0 && (
              <p className="text-[10px] text-amber-600 dark:text-amber-400 text-center">
                Need an even number of participants ({members.length} currently).
              </p>
            )}
            {members.length < 2 && (
              <p className="text-[10px] text-muted-foreground text-center">
                Need at least 2 members to start.
              </p>
            )}
          </div>
        )}

        {/* Non-admin or post-shuffle info */}
        {(!isAdmin || !isOpen) && (
          <div className="space-y-4">
            {isOpen && !isMember && (
              <Card className="glass-card rounded-2xl">
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-muted-foreground mb-3">Waiting for the admin to start the activity.</p>
                  <Badge variant="secondary">{members.length} members joined</Badge>
                </CardContent>
              </Card>
            )}
            {(isActive || isComplete) && (
              <Card className="glass-card rounded-2xl">
                <CardContent className="p-6 text-center">
                  <TypeIcon className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">
                    {isActive ? "Activity is live!" : "Activity is complete!"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {myAssignment ? "Check your assignment above." : "You're not part of this activity."}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}