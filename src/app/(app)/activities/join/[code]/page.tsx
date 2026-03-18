"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Snowflake, Star, Users, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function JoinActivityPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [activity, setActivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: act } = await supabase
        .from("activities")
        .select("*")
        .eq("join_code", code.toUpperCase())
        .single();

      if (!act) { setError("Activity not found or invalid code."); }
      else if (act.status !== "open") { setError("This activity is no longer accepting members."); }
      else { setActivity(act); }
      setLoading(false);
    }
    load();
  }, [code]);

  async function handleJoin() {
    setJoining(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push(`/login?next=/activities/join/${code}`); return; }

    const { error: err } = await supabase.from("activity_members").insert({
      activity_id: activity.id,
      user_id: user.id,
    });

    if (err) {
      if (err.message.includes("duplicate")) { toast.info("You're already in this activity!"); }
      else { toast.error("Couldn't join."); setJoining(false); return; }
    } else {
      toast.success("You've joined!");
    }
    router.push(`/activities/${activity.id}`);
  }

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (error) return <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4"><p className="text-muted-foreground">{error}</p><Button variant="outline" onClick={() => router.push("/activities")}>Go to Activities</Button></div>;

  const Icon = activity.type === "secret_santa" ? Snowflake : Star;

  return (
    <div className="flex items-center justify-center min-h-[50vh] px-4">
      <Card className="w-full max-w-sm text-center glass-card gradient-border-card rounded-2xl">
        <CardHeader>
          <div className="mx-auto h-16 w-16 rounded-2xl flex items-center justify-center mb-2" style={{ background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))' }}>
            <Icon className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="font-heading">{activity.title}</CardTitle>
          <Badge variant="outline" className="mx-auto mt-1">{activity.type === "secret_santa" ? "Secret Santa" : "Gift Roulette"}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {activity.description && <p className="text-xs text-muted-foreground">{activity.description}</p>}
          <Button onClick={handleJoin} disabled={joining} className="w-full btn-gradient rounded-xl shadow-lg">
            {joining ? "Joining..." : "Join Activity"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}