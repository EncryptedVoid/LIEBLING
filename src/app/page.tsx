"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MarketingNav, MarketingFooter } from "@/components/marketing-nav";
import {
  Sparkles, Gift, Users, CalendarDays, ShieldCheck, ChevronRight,
  ArrowRight, Star, Layers, Palette, Lock, Snowflake, Heart,
  PartyPopper, Clock,
} from "lucide-react";
import { motion } from "motion/react";

function AnimatedCounter({ target, suffix = "", duration = 2000 }: { target: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const done = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !done.current) {
        done.current = true;
        const start = performance.now();
        const step = (now: number) => {
          const p = Math.min((now - start) / duration, 1);
          setCount(Math.floor((1 - Math.pow(1 - p, 3)) * target));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, duration]);
  return <span ref={ref}>{count}{suffix}</span>;
}

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

const FEATURES = [
  { icon: Gift, title: "Smart Wishlists", desc: "Paste any URL — we auto-fetch image, price, and title. Organize into collections with banners and emojis." },
  { icon: Users, title: "Friend Network", desc: "Connect via friend codes. Browse wishlists and never ask 'what do you want?' again." },
  { icon: ShieldCheck, title: "Surprise-Safe Claims", desc: "Claim gifts privately. Mark as bought. The surprise stays intact." },
  { icon: CalendarDays, title: "Event Management", desc: "Events with dates, locations, linked wishlists, and countdown timers." },
  { icon: Snowflake, title: "Secret Santa", desc: "Gift exchanges with automatic no-self-match shuffling. Share a join link." },
  { icon: Palette, title: "Personalized Themes", desc: "6 accent colors, light/dark mode. Gradients and glows adapt to you." },
  { icon: Layers, title: "Templates & Mass Add", desc: "Curated templates or paste 20 URLs at once. Bulk-add to multiple collections." },
  { icon: Lock, title: "Privacy Controls", desc: "Public or exclusive — choose exactly who sees your wishlists and events." },
];

const PROBLEMS = [
  { emoji: "🎁", title: "Duplicate Gifts", desc: "Two people buy the same thing. Awkward returns, wasted money." },
  { emoji: "😬", title: "Unwanted Gifts", desc: "Smile politely at something you'll never use." },
  { emoji: "📅", title: "Forgotten Occasions", desc: "Birthdays sneak up. Last-minute scrambling isn't a strategy." },
  { emoji: "🤷", title: "The Guessing Game", desc: "'What do you want?' 'Anything!' — the worst conversation ever." },
  { emoji: "💸", title: "Budget Blindness", desc: "Overspend or underspend — no idea what's appropriate." },
  { emoji: "🔄", title: "Zero Coordination", desc: "Three people buy candles. One person gets nothing they wanted." },
];

const UPDATES = [
  { title: "Potluck Activities", desc: "Coordinate who's bringing what to your next gathering.", status: "upcoming" },
  { title: "Baby Shower Blueprint", desc: "One-click setup for registries and shower events.", status: "upcoming" },
  { title: "BBQ & Communal Events", desc: "Organize supplies, food, and cutlery for group cookouts.", status: "upcoming" },
];

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const h = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", h, { passive: true });
    // Set default theme if not set
    if (!document.documentElement.getAttribute("data-marketing-theme")) {
      document.documentElement.setAttribute("data-marketing-theme", "dark");
    }
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden mkt-bg mkt-text selection:bg-amber-400/30 transition-colors duration-500">
      {/* Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="mkt-orb-1 absolute top-[-20%] left-[-10%] w-[800px] h-[800px] rounded-full opacity-30 transition-all duration-700"
          style={{ background: "radial-gradient(circle, rgba(251,191,36,0.4) 0%, rgba(244,63,94,0.2) 50%, transparent 70%)", transform: `translateY(${scrollY * 0.1}px)` }} />
        <div className="mkt-orb-2 absolute top-[30%] right-[-15%] w-[600px] h-[600px] rounded-full opacity-25 transition-all duration-700"
          style={{ background: "radial-gradient(circle, rgba(244,63,94,0.4) 0%, rgba(168,85,247,0.15) 50%, transparent 70%)", transform: `translateY(${scrollY * -0.05}px)` }} />
        <div className="mkt-orb-3 absolute bottom-[-10%] left-[20%] w-[700px] h-[700px] rounded-full opacity-20 transition-all duration-700"
          style={{ background: "radial-gradient(circle, rgba(251,146,60,0.3) 0%, transparent 60%)", transform: `translateY(${scrollY * -0.08}px)` }} />
        <div className="absolute inset-0 mkt-grid-overlay" style={{ backgroundSize: "60px 60px" }} />
      </div>

      <MarketingNav />

      {/* Hero */}
      <section className="relative pt-36 lg:pt-52 pb-24 lg:pb-40 container mx-auto px-6">
        <div className="absolute top-32 left-[8%] w-16 h-16 rounded-2xl rotate-12 opacity-20 animate-float" style={{ background: "linear-gradient(135deg, #fbbf24, #f43f5e)", animationDuration: "4s" }} />
        <div className="absolute top-48 right-[12%] w-10 h-10 rounded-full opacity-15 animate-float" style={{ background: "linear-gradient(135deg, #f43f5e, #a855f7)", animationDuration: "5s", animationDelay: "1s" }} />

        <div className="flex flex-col items-center text-center max-w-5xl mx-auto relative z-10">
          <Reveal>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 border mkt-card-border mkt-bg-card backdrop-blur-sm">
              <span className="flex h-2 w-2 rounded-full bg-gradient-to-r from-amber-400 to-rose-400 animate-pulse" />
              <span className="text-xs font-semibold tracking-wide uppercase bg-gradient-to-r from-amber-300 to-rose-300 bg-clip-text text-transparent">The smarter way to give & receive</span>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <h1 className="text-5xl sm:text-6xl lg:text-8xl font-extrabold font-heading tracking-tight leading-[1.05] mb-6">
              Gift-giving,{" "}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-rose-500 bg-clip-text text-transparent">reimagined.</span>
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                  <path d="M2 8C50 2 100 2 150 6C200 10 250 4 298 8" stroke="url(#ug)" strokeWidth="3" strokeLinecap="round" />
                  <defs><linearGradient id="ug" x1="0" y1="0" x2="300" y2="0"><stop offset="0%" stopColor="#fbbf24" /><stop offset="100%" stopColor="#f43f5e" /></linearGradient></defs>
                </svg>
              </span>
            </h1>
          </Reveal>

          <Reveal delay={200}>
            <p className="text-lg lg:text-xl mkt-text-muted max-w-2xl mb-12 leading-relaxed">
              Create wishlists. Connect with the people you love. Claim gifts without spoiling the surprise. All free, all beautiful.
            </p>
          </Reveal>

          <Reveal delay={300}>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Button asChild size="lg" className="h-14 px-10 text-lg font-bold text-black rounded-2xl shadow-xl shadow-amber-500/25 hover:shadow-amber-500/50 transition-all hover:scale-105 group"
                style={{ background: "linear-gradient(135deg, #fbbf24, #fb923c, #f43f5e)" }}>
                <Link href="/signup">Get started free <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-14 px-10 text-lg rounded-2xl border mkt-card-border mkt-bg-card mkt-text hover:mkt-bg-hover backdrop-blur-sm">
                <Link href="/features">Explore features</Link>
              </Button>
            </div>
          </Reveal>

          <Reveal delay={400}>
            <div className="flex flex-wrap justify-center gap-8 mt-16 pt-8 border-t mkt-border">
              {[
                { value: 0, suffix: "", label: "Duplicate gifts given", special: true },
                { value: 100, suffix: "%", label: "Surprises preserved" },
                { value: 365, suffix: "", label: "Days of coverage" },
              ].map((stat, i) => (
                <div key={i} className="text-center min-w-[120px]">
                  <p className="text-3xl font-heading font-extrabold bg-gradient-to-r from-amber-300 to-rose-400 bg-clip-text text-transparent">
                    {stat.special ? "0" : <AnimatedCounter target={stat.value} suffix={stat.suffix} />}
                  </p>
                  <p className="text-xs mkt-text-faint mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Problems */}
      <section className="py-24 lg:py-32 relative">
        <div className="container mx-auto px-6 relative z-10">
          <Reveal>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-bold tracking-widest uppercase bg-gradient-to-r from-amber-400 to-rose-400 bg-clip-text text-transparent">The Problem</span>
              <h2 className="text-3xl lg:text-5xl font-heading font-extrabold mt-4 mb-4">
                Gift-giving is <span className="mkt-text-strike line-through">broken</span>{" "}
                <span className="bg-gradient-to-r from-amber-300 to-rose-400 bg-clip-text text-transparent">fixable.</span>
              </h2>
              <p className="mkt-text-muted leading-relaxed">Every year, billions are spent on gifts that miss the mark. We believe there&apos;s a better way.</p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {PROBLEMS.map((p, i) => (
              <Reveal key={i} delay={i * 80}>
                <div className="group rounded-2xl border mkt-card-border mkt-bg-card backdrop-blur-sm p-6 mkt-card-border-hover mkt-glow-hover transition-all duration-500 hover:-translate-y-1">
                  <span className="text-3xl block mb-3 group-hover:scale-110 transition-transform origin-left">{p.emoji}</span>
                  <h3 className="text-base font-heading font-bold mb-2">{p.title}</h3>
                  <p className="text-xs mkt-text-muted leading-relaxed">{p.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={200}>
            <div className="max-w-2xl mx-auto mt-20 text-center">
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl border mkt-card-border mkt-bg-card mb-6">
                <PartyPopper className="h-5 w-5 text-amber-400" />
                <span className="text-sm font-semibold bg-gradient-to-r from-amber-300 to-rose-300 bg-clip-text text-transparent">Enter Lieblings</span>
              </div>
              <p className="mkt-text-muted leading-relaxed text-lg">
                A beautiful, free platform where everyone shares what they actually want — and friends coordinate without anyone knowing.
              </p>
              <Button asChild size="lg" className="mt-8 h-12 px-8 font-bold text-black rounded-xl shadow-lg shadow-amber-500/20 hover:scale-105 transition-all"
                style={{ background: "linear-gradient(135deg, #fbbf24, #f43f5e)" }}>
                <Link href="/about">Learn more <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 lg:py-32 container mx-auto px-6">
        <Reveal>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold tracking-widest uppercase bg-gradient-to-r from-amber-400 to-rose-400 bg-clip-text text-transparent">Features</span>
            <h2 className="text-3xl lg:text-5xl font-heading font-extrabold mt-4 mb-4">
              Everything you need,{" "}
              <span className="bg-gradient-to-r from-amber-300 to-rose-400 bg-clip-text text-transparent">nothing you don&apos;t.</span>
            </h2>
          </div>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
          {FEATURES.map((f, i) => (
            <Reveal key={i} delay={i * 60}>
              <div className="group relative rounded-2xl border mkt-card-border mkt-bg-card backdrop-blur-sm p-6 mkt-card-border-hover transition-all duration-500 hover:-translate-y-2 overflow-hidden">
                <div className="relative z-10">
                  <div className="h-11 w-11 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 group-hover:rotate-3"
                    style={{ background: "linear-gradient(135deg, rgba(251,191,36,0.15), rgba(244,63,94,0.15))" }}>
                    <f.icon className="h-5 w-5 text-amber-400" />
                  </div>
                  <h3 className="text-sm font-heading font-bold mb-2">{f.title}</h3>
                  <p className="text-xs mkt-text-muted leading-relaxed">{f.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={300}>
          <div className="text-center mt-12">
            <Button asChild variant="outline" className="rounded-xl border mkt-card-border mkt-bg-card mkt-text hover:mkt-bg-hover h-11 px-8 font-semibold">
              <Link href="/features">See all features <ChevronRight className="ml-1.5 h-4 w-4" /></Link>
            </Button>
          </div>
        </Reveal>
      </section>

      {/* Upcoming */}
      <section className="py-24 lg:py-32 container mx-auto px-6">
        <Reveal>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold tracking-widest uppercase bg-gradient-to-r from-amber-400 to-rose-400 bg-clip-text text-transparent">Roadmap</span>
            <h2 className="text-3xl lg:text-5xl font-heading font-extrabold mt-4 mb-4">
              We&apos;re just <span className="bg-gradient-to-r from-amber-300 to-rose-400 bg-clip-text text-transparent">getting started.</span>
            </h2>
          </div>
        </Reveal>
        <div className="max-w-2xl mx-auto space-y-4">
          {UPDATES.map((u, i) => (
            <Reveal key={i} delay={i * 100}>
              <div className="group flex items-center gap-4 rounded-2xl border mkt-card-border mkt-bg-card p-5 mkt-card-border-hover transition-all duration-300">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, rgba(251,191,36,0.1), rgba(244,63,94,0.1))" }}>
                  <Clock className="h-4 w-4 text-amber-400/60" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-heading font-bold">{u.title}</h3>
                  <p className="text-xs mkt-text-muted mt-0.5">{u.desc}</p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400/50 shrink-0">Soon</span>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={300}>
          <div className="text-center mt-8">
            <Button asChild variant="outline" className="rounded-xl border mkt-card-border mkt-bg-card mkt-text hover:mkt-bg-hover h-11 px-8 font-semibold">
              <Link href="/upcoming-updates">View full roadmap <ChevronRight className="ml-1.5 h-4 w-4" /></Link>
            </Button>
          </div>
        </Reveal>
      </section>

      {/* CTA */}
      <section className="py-24 lg:py-32 container mx-auto px-6">
        <Reveal>
          <div className="relative max-w-4xl mx-auto rounded-3xl overflow-hidden">
            <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(251,191,36,0.12), rgba(244,63,94,0.12), rgba(168,85,247,0.08))" }} />
            <div className="absolute inset-0 border mkt-card-border rounded-3xl" />
            <div className="absolute top-6 right-8 w-20 h-20 rounded-full opacity-20 animate-float" style={{ background: "radial-gradient(circle, #fbbf24, transparent)", animationDuration: "4s" }} />
            <div className="relative z-10 px-8 py-16 lg:px-16 lg:py-20 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mkt-card-border mkt-bg-card mb-6">
                <Heart className="h-4 w-4 text-rose-400" />
                <span className="text-xs font-semibold mkt-text-muted">Free forever. No catch.</span>
              </div>
              <h2 className="text-3xl lg:text-5xl font-heading font-extrabold mb-4">
                Ready to make gifting{" "}
                <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-rose-500 bg-clip-text text-transparent">joyful</span>?
              </h2>
              <p className="mkt-text-muted max-w-xl mx-auto mb-10 leading-relaxed">
                Join Lieblings and never stress about gift-giving again.
              </p>
              <Button asChild size="lg" className="h-16 px-12 text-xl font-bold text-black rounded-2xl shadow-2xl shadow-amber-500/30 hover:shadow-amber-500/50 transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg, #fbbf24, #fb923c, #f43f5e)" }}>
                <Link href="/signup">Create your first wishlist <Sparkles className="ml-3 h-5 w-5" /></Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </section>

      <MarketingFooter />
    </div>
  );
}