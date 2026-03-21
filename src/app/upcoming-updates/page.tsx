"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sparkles, ThumbsUp, ThumbsDown, CheckCircle2, Loader2, Clock,
  ArrowRight, ShieldCheck, Zap, Server, Target,
  ChefHat, Baby, Flame, Bookmark, Star, Megaphone,
} from "lucide-react";
import { MarketingNav, MarketingFooter } from "@/components/marketing-nav";
import { createClient } from "@/lib/supabase/client";
import { motion } from "motion/react";

function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: delay / 1000 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

type UpdateStatus = "completed" | "in-progress" | "upcoming";

type Update = {
  id: string;
  title: string;
  tagline: string;
  description: string;
  icon: typeof Sparkles;
  status: UpdateStatus;
  details: string[];
};

const UPDATES: Update[] = [
  {
    id: "themes", title: "Dynamic Themes", tagline: "Your color, everywhere.",
    description: "Every gradient, glow, button, and accent across the entire app now adapts to your chosen color. Pick Rosé and your world turns pink. Choose Jade and everything goes green. It's not just a setting — it's a feeling.",
    icon: Sparkles, status: "completed",
    details: ["6 handcrafted color palettes", "Light and dark mode variants", "Gradients, glows, and shadows all adapt", "Friend wishlists show in their chosen color"],
  },
  {
    id: "security", title: "Auto Logout", tagline: "Your data, protected.",
    description: "Walk away from your computer? We've got you. After 5 minutes of inactivity, your session automatically ends. No more worrying about someone seeing your gift plans on a shared device.",
    icon: ShieldCheck, status: "completed",
    details: ["5-minute inactivity timer", "Detects mouse, keyboard, scroll, and touch", "Graceful redirect with session message", "Server-side cookie clearing"],
  },
  {
    id: "gifts-modal", title: "Gifts Dashboard Redesign", tagline: "Track everything at a glance.",
    description: "The gifts-to-buy view got a complete makeover. Browse by person or by event. See countdown timers for upcoming occasions. Know exactly what you need to buy and for whom.",
    icon: Target, status: "completed",
    details: ["Group by person or by event", "Event countdown timers", "Mark as bought with one click", "Unclaim or undo anytime"],
  },
  {
    id: "activities", title: "Secret Santa & Gift Roulette", tagline: "Matched for joy.",
    description: "Run gift exchanges with friends, family, or coworkers. Create an activity, share a join link, and our smart algorithm matches everyone — guaranteed no self-assignments. Secret Santa for the holidays, Gift Roulette for any time of year.",
    icon: Star, status: "in-progress",
    details: ["Automatic derangement matching", "Shareable join links", "Admin controls for adding members", "Integrates with wishlists"],
  },
  {
    id: "wedding", title: "Wedding Blueprint", tagline: "Your big day, set up in minutes.",
    description: "A guided wizard that creates your wedding event, links a beautifully templated registry, and adds your partner — all in two simple steps. Supports all couple types with custom labels.",
    icon: Bookmark, status: "in-progress",
    details: ["Partner lookup by friend code", "Custom couple labels", "Auto-created event + collection", "Pre-designed wedding banner"],
  },
  {
    id: "potluck", title: "Potluck Activities", tagline: "Who's bringing what?",
    description: "Planning a dinner party or gathering? Create a potluck activity where everyone can sign up to bring a dish or buy a needed item. See the full list at a glance — no more three people bringing potato salad.",
    icon: ChefHat, status: "upcoming",
    details: ["Two modes: bring a dish or buy an item", "Real-time coordination list", "Everyone can contribute", "Perfect for dinner parties and holidays"],
  },
  {
    id: "baby-shower", title: "Baby Shower Blueprint", tagline: "One click, complete registry.",
    description: "Like the Wedding Blueprint but for baby showers. Add the other parent, set a date, and we'll create a full baby shower event with a registry collection — complete with a curated banner and all the essentials.",
    icon: Baby, status: "upcoming",
    details: ["Guided wizard for both parents", "Pre-designed nursery banner", "Links event to registry collection", "Easy sharing with family and friends"],
  },
  {
    id: "bbq", title: "BBQ & Communal Events", tagline: "Beyond food — bring everything.",
    description: "A spin on potluck focused on BBQs and outdoor gatherings. People can sign up for food, drinks, AND supplies like cutlery, plates, ice, and speaker systems. Full coordination for the perfect cookout.",
    icon: Flame, status: "upcoming",
    details: ["Food, drink, and supplies categories", "Quantity tracking", "Sign-up with your name", "Great for cookouts, tailgates, picnics"],
  },
];

const STATUS_CONFIG: Record<UpdateStatus, { label: string; color: string; dotColor: string }> = {
  completed: { label: "Shipped", color: "text-emerald-400", dotColor: "bg-emerald-400" },
  "in-progress": { label: "Building", color: "text-amber-400", dotColor: "bg-amber-400 animate-pulse" },
  upcoming: { label: "Planned", color: "mkt-text-muted", dotColor: "bg-white/30" },
};

export default function UpcomingUpdatesPage() {
  const [selectedId, setSelectedId] = useState(UPDATES[0].id);
  const [votes, setVotes] = useState<Record<string, "up" | "down" | null>>({});
  const [voteCounts, setVoteCounts] = useState<Record<string, { up: number; down: number }>>({});
  const [visitorId, setVisitorId] = useState("");
  const supabase = createClient();

  // Generate or retrieve a persistent visitor ID
  useEffect(() => {
    let id = document.cookie
      .split("; ")
      .find((c) => c.startsWith("lieblings_visitor="))
      ?.split("=")[1];
    if (!id) {
      id = crypto.randomUUID();
      document.cookie = `lieblings_visitor=${id}; max-age=${60 * 60 * 24 * 365}; path=/; SameSite=Lax`;
    }
    setVisitorId(id);
  }, []);

  // Load existing votes and counts
  useEffect(() => {
    if (!visitorId) return;
    async function loadVotes() {
      // Load this visitor's votes
      const { data: myVotes } = await supabase
        .from("feature_votes")
        .select("feature_id, vote")
        .eq("visitor_id", visitorId);

      if (myVotes) {
        const map: Record<string, "up" | "down" | null> = {};
        myVotes.forEach((v: any) => { map[v.feature_id] = v.vote; });
        setVotes(map);
      }

      // Load counts for all features
      const { data: allVotes } = await supabase
        .from("feature_votes")
        .select("feature_id, vote");

      if (allVotes) {
        const counts: Record<string, { up: number; down: number }> = {};
        allVotes.forEach((v: any) => {
          if (!counts[v.feature_id]) counts[v.feature_id] = { up: 0, down: 0 };
          counts[v.feature_id][v.vote as "up" | "down"]++;
        });
        setVoteCounts(counts);
      }
    }
    loadVotes();
  }, [visitorId]);

  async function handleVote(id: string, dir: "up" | "down") {
    if (!visitorId) return;
    const currentVote = votes[id];

    if (currentVote === dir) {
      // Remove vote (toggle off)
      setVotes((prev) => ({ ...prev, [id]: null }));
      setVoteCounts((prev) => ({
        ...prev,
        [id]: { ...prev[id], [dir]: (prev[id]?.[dir] ?? 1) - 1 },
      }));
      await supabase
        .from("feature_votes")
        .delete()
        .eq("feature_id", id)
        .eq("visitor_id", visitorId);
    } else {
      // Set or change vote
      setVotes((prev) => ({ ...prev, [id]: dir }));
      setVoteCounts((prev) => {
        const current = prev[id] ?? { up: 0, down: 0 };
        const updated = { ...current, [dir]: current[dir] + 1 };
        if (currentVote) updated[currentVote] = Math.max(0, updated[currentVote] - 1);
        return { ...prev, [id]: updated };
      });

      if (currentVote) {
        // Update existing vote
        await supabase
          .from("feature_votes")
          .update({ vote: dir })
          .eq("feature_id", id)
          .eq("visitor_id", visitorId);
      } else {
        // Insert new vote
        await supabase
          .from("feature_votes")
          .insert({ feature_id: id, vote: dir, visitor_id: visitorId });
      }
    }
  }

  useEffect(() => {
    if (!document.documentElement.getAttribute("data-marketing-theme")) {
      document.documentElement.setAttribute("data-marketing-theme", "dark");
    }
  }, []);

  const selected = UPDATES.find((u) => u.id === selectedId)!;

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a] mkt-text selection:bg-amber-400/30">
      {/* Nav */}
      <MarketingNav />

      {/* Hero */}
      <section className="pt-36 pb-8 container mx-auto px-6 text-center">
        <Reveal>
          <span className="text-xs font-bold tracking-widest uppercase bg-gradient-to-r from-amber-400 to-rose-400 bg-clip-text text-transparent">Roadmap</span>
          <h1 className="text-4xl lg:text-5xl font-extrabold font-heading mt-4 mb-6 leading-tight">
            What&apos;s shipped, what&apos;s{" "}
            <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-rose-500 bg-clip-text text-transparent">coming next.</span>
          </h1>
          <p className="text-lg mkt-text-muted max-w-2xl mx-auto">Vote on what you want us to build first.</p>
        </Reveal>
      </section>

      {/* Main: Sidebar + Detail */}
      <section className="py-8 container mx-auto px-6 flex-1">
        <div className="flex flex-col lg:flex-row gap-6 max-w-6xl mx-auto min-h-[600px]">
          {/* Sidebar */}
          <div className="w-full lg:w-72 shrink-0 space-y-1.5">
            {UPDATES.map((u) => {
              const isActive = selectedId === u.id;
              const config = STATUS_CONFIG[u.status];
              return (
                <button
                  key={u.id}
                  onClick={() => setSelectedId(u.id)}
                  className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all duration-200 ${
                    isActive ? "mkt-bg-hover border mkt-card-border" : "border border-transparent hover:mkt-bg-card"
                  }`}
                >
                  <div className={`h-2 w-2 rounded-full shrink-0 ${config.dotColor}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold truncate ${isActive ? "mkt-text" : "mkt-text-muted"}`}>{u.title}</p>
                    <p className={`text-[10px] ${config.color}`}>{config.label}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detail Panel */}
          <div className="flex-1 rounded-2xl border mkt-card-border mkt-bg-card p-8 lg:p-10">
            <div className="flex items-start gap-4 mb-6">
              <div className="h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg"
                style={{ background: "linear-gradient(135deg, rgba(251,191,36,0.2), rgba(244,63,94,0.2))" }}>
                <selected.icon className="h-7 w-7 text-amber-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-heading font-extrabold">{selected.title}</h2>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${STATUS_CONFIG[selected.status].color}`}>
                    {STATUS_CONFIG[selected.status].label}
                  </span>
                </div>
                <p className="text-sm text-amber-400/70 font-medium mt-0.5">{selected.tagline}</p>
              </div>
            </div>

            <p className="text-sm mkt-text-muted leading-relaxed mb-8">{selected.description}</p>

            <div className="mb-8">
              <h3 className="text-xs font-bold uppercase tracking-widest mkt-text-faint mb-4">What this includes</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selected.details.map((d, i) => (
                  <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl mkt-bg-card border mkt-card-border">
                    <CheckCircle2 className="h-4 w-4 text-amber-400/60 shrink-0 mt-0.5" />
                    <span className="text-xs mkt-text-muted">{d}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Vote */}
            {selected.status !== "completed" && (
              <div className="border-t mkt-card-border pt-6">
                <p className="text-xs mkt-text-faint mb-3">Would you find this useful?</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleVote(selected.id, "up")}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border transition-all duration-300 ${
                      votes[selected.id] === "up"
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                        : "mkt-card-border mkt-bg-card mkt-text-muted hover:border-emerald-500/20 hover:text-emerald-400"
                    }`}
                  >
                    <ThumbsUp className="h-4 w-4" />
                    {/* Find the thumbs up button and add count */}
                    <span className="text-xs font-semibold">Yes, build this!</span>
                    {(voteCounts[selected.id]?.up ?? 0) > 0 && (
                      <span className="text-[10px] opacity-70 ml-1">({voteCounts[selected.id]?.up})</span>
                    )}
                  </button>
                  <button
                    onClick={() => handleVote(selected.id, "down")}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border transition-all duration-300 ${
                      votes[selected.id] === "down"
                        ? "border-rose-500/40 bg-rose-500/10 text-rose-400"
                        : "mkt-card-border mkt-bg-card mkt-text-muted mkt-card-border-hover hover:text-rose-400"
                    }`}
                  >
                    <ThumbsDown className="h-4 w-4" />
                    <span className="text-xs font-semibold">Not a priority</span>
                    {(voteCounts[selected.id]?.down ?? 0) > 0 && (
                      <span className="text-[10px] opacity-70 ml-1">({voteCounts[selected.id]?.down})</span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Constant improvements */}
      <section className="py-16 container mx-auto px-6">
        <Reveal>
          <div className="max-w-3xl mx-auto text-center rounded-3xl border mkt-card-border mkt-bg-card p-10">
            <div className="flex justify-center gap-4 mb-5">
              {[ShieldCheck, Zap, Server, Target].map((Icon, i) => (
                <div key={i} className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(251,191,36,0.1), rgba(244,63,94,0.1))" }}>
                  <Icon className="h-5 w-5 text-amber-400/60" />
                </div>
              ))}
            </div>
            <h3 className="text-lg font-heading font-bold mb-2">Constant Improvements</h3>
            <p className="text-xs mkt-text-muted max-w-lg mx-auto leading-relaxed">
              Beyond these feature updates, we're constantly improving the stability, speed, security, and efficacy of Lieblings. Every release makes the experience smoother, faster, and more reliable for everyone.
            </p>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <MarketingFooter />
    </div>
  );
}