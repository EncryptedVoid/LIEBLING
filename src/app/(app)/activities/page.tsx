"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Plus, Snowflake, Star, Users } from "lucide-react";
import { format } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/empty-state";
import { toast } from "sonner";

import type { Activity } from "@/lib/types";

type ActivityWithCount = Activity & { member_count: number };

export default function ActivitiesPage() {
  const supabase = createClient();
  const [activities, setActivities] = useState<ActivityWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newType, setNewType] = useState<"secret_santa" | "gift_roulette">("secret_santa");
  const [creating, setCreating] = useState(false);

  async function fetchActivities() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Activities I created
    const { data: created } = await supabase
      .from("activities")
      .select("*")
      .eq("creator_id", user.id)
      .order("created_at", { ascending: false });

    // Activities I'm a member of
    const { data: memberships } = await supabase
      .from("activity_members")
      .select("activity_id")
      .eq("user_id", user.id);

    const memberActivityIds = (memberships ?? []).map((m: any) => m.activity_id);

    let memberActivities: any[] = [];
    if (memberActivityIds.length > 0) {
      const { data } = await supabase
        .from("activities")
        .select("*")
        .in("id", memberActivityIds)
        .neq("creator_id", user.id);
      memberActivities = data ?? [];
    }

    const allActivities = [...(created ?? []), ...memberActivities];
    const activityIds = allActivities.map((a: any) => a.id);

    // Get member counts
    let countMap = new Map<string, number>();
    if (activityIds.length > 0) {
      const { data: counts } = await supabase
        .from("activity_members")
        .select("activity_id")
        .in("activity_id", activityIds);
      for (const c of counts ?? []) {
        countMap.set(c.activity_id, (countMap.get(c.activity_id) ?? 0) + 1);
      }
    }

    setActivities(
      allActivities.map((a: any) => ({ ...a, member_count: countMap.get(a.id) ?? 0 }))
    );
    setLoading(false);
  }

  useEffect(() => { fetchActivities(); }, []);

  async function handleCreate() {
    if (!newTitle.trim()) { toast.error("Give it a title."); return; }
    setCreating(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setCreating(false); return; }

    // Generate join code via SQL function
    const { data: codeResult } = await supabase.rpc("generate_activity_join_code");
    const joinCode = codeResult || `${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const { error } = await supabase.from("activities").insert({
      creator_id: user.id,
      type: newType,
      title: newTitle.trim(),
      description: newDescription.trim() || null,
      join_code: joinCode,
    });

    if (error) { toast.error("Couldn't create activity."); }
    else { toast.success("Activity created!"); setCreateOpen(false); setNewTitle(""); setNewDescription(""); fetchActivities(); }
    setCreating(false);
  }

  return (
    <div className="page-enter max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-semibold tracking-tight">Activities</h1>
          <p className="text-muted-foreground mt-0.5 text-xs">Secret Santa, Gift Roulette, and more.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="btn-gradient shadow-sm">
          <Plus className="h-3.5 w-3.5 mr-1.5" /> New Activity
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-40 skeleton-shimmer rounded-2xl" />)}
        </div>
      ) : activities.length === 0 ? (
        <EmptyState variant="generic" title="No activities yet" description="Create a Secret Santa or Gift Roulette to get started!">
          <Button onClick={() => setCreateOpen(true)} size="sm"><Plus className="h-3 w-3 mr-1" /> Create one</Button>
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger-grid">
          {activities.map((act) => {
            const Icon = act.type === "secret_santa" ? Snowflake : Star;
            return (
              <Link key={act.id} href={`/activities/${act.id}`}>
                <Card className="glass-card gradient-border-card rounded-2xl hover:-translate-y-1 transition-all h-full cursor-pointer">
                  <div className="h-1.5" style={{ background: 'linear-gradient(90deg, var(--gradient-from), var(--gradient-to), var(--gradient-accent))' }} />
                  <CardContent className="p-5 flex gap-4">
                    <div className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))' }}>
                      <Icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading font-semibold text-sm truncate">{act.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={act.status === "open" ? "default" : "secondary"} className="text-[10px]">{act.status}</Badge>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" /> {act.member_count}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">{format(new Date(act.created_at), "MMM d, yyyy")}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md glass-card rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading">New Activity</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-2">
            <div className="flex gap-2">
              {(["secret_santa", "gift_roulette"] as const).map((t) => (
                <button key={t} onClick={() => setNewType(t)}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-xl border-2 p-3 text-xs font-medium transition-all ${newType === t ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/20"}`}>
                  {t === "secret_santa" ? <Snowflake className="h-4 w-4" /> : <Star className="h-4 w-4" />}
                  {t === "secret_santa" ? "Secret Santa" : "Gift Roulette"}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Title</Label>
              <Input placeholder={newType === "secret_santa" ? "Office Secret Santa 2026" : "Birthday Gift Exchange"} value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Description (optional)</Label>
              <Textarea placeholder="Budget, rules, etc." value={newDescription} onChange={(e) => setNewDescription(e.target.value)} rows={2} />
            </div>
            <Button onClick={handleCreate} disabled={creating || !newTitle.trim()} className="btn-gradient rounded-xl shadow-lg">
              {creating ? "Creating..." : "Create Activity"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}