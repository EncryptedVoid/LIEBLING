"use client";

import { UPCOMING_UPDATES, type UpdateStatus } from "@/lib/upcoming-updates";
import { CheckCircle2, Loader2, Clock, ExternalLink, ShieldCheck, Zap, Server, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const STATUS_CONFIG: Record<UpdateStatus, { label: string; icon: typeof CheckCircle2; className: string }> = {
  completed: { label: "Completed", icon: CheckCircle2, className: "text-green-600 dark:text-green-400 bg-green-500/10" },
  "in-progress": { label: "In Progress", icon: Loader2, className: "text-amber-600 dark:text-amber-400 bg-amber-500/10" },
  upcoming: { label: "Upcoming", icon: Clock, className: "text-muted-foreground bg-muted/50" },
};

export default function UpcomingUpdatesPage() {
  return (
    <div className="page-enter max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-heading font-semibold tracking-tight">Upcoming Updates</h1>
        <p className="text-muted-foreground mt-0.5 text-xs">See what&apos;s been shipped, what&apos;s in progress, and what&apos;s next.</p>
      </div>

      <div className="space-y-3">
        {UPCOMING_UPDATES.map((update) => {
          const config = STATUS_CONFIG[update.status];
          const StatusIcon = config.icon;
          return (
            <Card key={update.id} className="glass-card rounded-2xl hover:-translate-y-0.5 transition-all">
              <CardContent className="p-4 flex items-start gap-4">
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${config.className}`}>
                  <StatusIcon className={`h-4 w-4 ${update.status === "in-progress" ? "animate-spin" : ""}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-heading font-semibold">{update.title}</h3>
                    <Badge variant="outline" className={`text-[9px] ${config.className}`}>{config.label}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{update.description}</p>
                </div>
                {update.link && (
                  <a href={update.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 shrink-0">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Bottom section */}
      <Card className="glass-card gradient-border-card rounded-2xl">
        <CardContent className="p-8 text-center">
          <div className="flex justify-center gap-4 mb-4">
            {[ShieldCheck, Zap, Server, Target].map((Icon, i) => (
              <div key={i} className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon className="h-5 w-5 text-primary" />
              </div>
            ))}
          </div>
          <h3 className="text-base font-heading font-semibold mb-1">Constant Improvements</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
            Beyond these feature updates, we&apos;re constantly improving the stability, speed, security, and efficacy of Lieblings. Every release makes the experience smoother and more reliable.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}