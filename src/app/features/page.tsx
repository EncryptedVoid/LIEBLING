"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sparkles, Gift, Users, CalendarDays, ShieldCheck, Palette, Layers,
  Star, Snowflake, Lock, Heart, ArrowRight, Zap, Eye, EyeOff,
  Link2, ImagePlus, Timer, UserPlus, FolderOpen, BarChart3,
} from "lucide-react";
import { MarketingNav, MarketingFooter } from "@/components/marketing-nav";

function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); obs.disconnect(); } }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={`transition-all duration-700 ease-out ${v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

const FEATURE_SECTIONS = [
  {
    category: "Wishlists",
    color: "from-amber-400 to-orange-500",
    features: [
      { icon: Link2, title: "Smart URL Scraping", desc: "Paste any product link. We automatically extract the title, image, price, and description — so you don't have to type a thing." },
      { icon: FolderOpen, title: "Collections", desc: "Group wishlist items into themed collections — by holiday, category, or whatever makes sense. Each gets its own emoji, banner, and description." },
      { icon: ImagePlus, title: "Banners & Templates", desc: "Choose from curated templates with built-in banner images, or upload your own. Every collection and event looks stunning." },
      { icon: Layers, title: "Mass Add", desc: "Got a shopping spree? Paste 20 URLs at once. Pick which collections they belong to. We process them all simultaneously." },
    ],
  },
  {
    category: "Social",
    color: "from-rose-400 to-pink-500",
    features: [
      { icon: UserPlus, title: "Friend Codes", desc: "Everyone gets a unique code like LIEB-A3X9-B7K2. Share it to connect. No email required, no awkward social media linking." },
      { icon: Eye, title: "Browse Friend Wishlists", desc: "Switch between friends' wishlists instantly. See what they want for any occasion. Their theme color even applies to their list." },
      { icon: EyeOff, title: "Surprise-Safe Claims", desc: "Claim an item from a friend's list — they never see it's been claimed. Mark it as bought when you purchase it. Full tracking, zero spoilers." },
      { icon: Users, title: "Friend Groups", desc: "Organize friends into groups for easy privacy management. Share a collection with 'Family' or 'Work Friends' in one click." },
    ],
  },
  {
    category: "Events & Activities",
    color: "from-violet-400 to-purple-500",
    features: [
      { icon: CalendarDays, title: "Event Management", desc: "Create events with dates, times, locations, and linked wishlists. See countdown timers, Google Maps embeds, and custom links." },
      { icon: Snowflake, title: "Secret Santa", desc: "Create a Secret Santa activity, share a join link, add members by friend code. Our algorithm shuffles assignments and guarantees no self-matches." },
      { icon: Star, title: "Gift Roulette", desc: "Same as Secret Santa but year-round and theme-neutral. Perfect for birthday circles, friend groups, or any occasion." },
      { icon: Heart, title: "Wedding Blueprint", desc: "A step-by-step wizard that creates your wedding event, registry collection, and templates — all in under 2 minutes." },
    ],
  },
  {
    category: "Personalization & Security",
    color: "from-cyan-400 to-blue-500",
    features: [
      { icon: Palette, title: "6 Accent Themes", desc: "Choose from Graphite, Rosé, Lapis, Jade, Sunset, or Amethyst. Your entire experience — every gradient, glow, and button — transforms." },
      { icon: Lock, title: "Privacy Controls", desc: "Make any collection or event public (all friends see it) or exclusive (only selected friends). You control exactly who sees what." },
      { icon: Timer, title: "Auto Logout", desc: "Sessions automatically expire after 5 minutes of inactivity. Your wishlist data stays secure even if you walk away." },
      { icon: ShieldCheck, title: "Gifted Tracking", desc: "Mark gifts as received. They move to a special 'Gifted' collection — hidden from your main list but preserved as a memory." },
    ],
  },
];

export default function FeaturesPage() {

  useEffect(() => {
    if (!document.documentElement.getAttribute("data-marketing-theme")) {
      document.documentElement.setAttribute("data-marketing-theme", "dark");
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a] mkt-text selection:bg-amber-400/30">
      {/* Nav */}
      <MarketingNav />

      {/* Hero */}
      <section className="pt-36 pb-8 container mx-auto px-6 text-center">
        <Reveal>
          <span className="text-xs font-bold tracking-widest uppercase bg-gradient-to-r from-amber-400 to-rose-400 bg-clip-text text-transparent">Features</span>
          <h1 className="text-4xl lg:text-6xl font-extrabold font-heading mt-4 mb-6 leading-tight">
            Every feature,{" "}
            <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-rose-500 bg-clip-text text-transparent">built with love.</span>
          </h1>
          <p className="text-lg mkt-text-muted max-w-2xl mx-auto leading-relaxed">
            Lieblings is packed with thoughtful tools that make gift-giving effortless and joyful.
          </p>
        </Reveal>
      </section>

      {/* Feature Sections */}
      {FEATURE_SECTIONS.map((section, si) => (
        <section key={si} className="py-16 lg:py-20 container mx-auto px-6">
          <Reveal>
            <div className="flex items-center gap-3 mb-10">
              <div className={`h-1 w-12 rounded-full bg-gradient-to-r ${section.color}`} />
              <h2 className="text-2xl font-heading font-extrabold">{section.category}</h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-5xl">
            {section.features.map((f, fi) => (
              <Reveal key={fi} delay={fi * 80}>
                <div className="group relative rounded-2xl border mkt-card-border mkt-bg-card p-6 mkt-card-border-hover transition-all duration-500 hover:-translate-y-1 overflow-hidden">
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: "radial-gradient(circle at 30% 0%, rgba(251,191,36,0.06) 0%, transparent 50%)" }} />
                  <div className="relative z-10 flex gap-4">
                    <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform`}>
                      <f.icon className="h-5 w-5 mkt-text" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-heading font-bold mb-1.5 mkt-text">{f.title}</h3>
                      <p className="text-xs mkt-text-muted leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      ))}

      {/* CTA */}
      <section className="py-20 container mx-auto px-6">
        <Reveal>
          <div className="max-w-2xl mx-auto text-center rounded-3xl border mkt-card-border p-12" style={{ background: "linear-gradient(135deg, rgba(251,191,36,0.08), rgba(244,63,94,0.08))" }}>
            <h2 className="text-2xl font-heading font-extrabold mb-4">Ready to try it?</h2>
            <p className="mkt-text-muted mb-8">Every feature above is free. No premium tier. No catch.</p>
            <Button asChild size="lg" className="h-14 px-10 text-lg font-bold text-black rounded-2xl shadow-xl shadow-amber-500/25 hover:scale-105 transition-all"
              style={{ background: "linear-gradient(135deg, #fbbf24, #fb923c, #f43f5e)" }}>
              <Link href="/signup">Get started <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <MarketingFooter />
    </div>
  );
}