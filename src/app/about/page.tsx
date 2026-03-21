"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sparkles, ArrowRight, Heart, Gift, Users, ShieldCheck,
  TrendingDown, Frown, CalendarX, HelpCircle, DollarSign, Repeat,
  CheckCircle2, Zap, Globe, PartyPopper,
} from "lucide-react";

import { MarketingNav, MarketingFooter } from "@/components/marketing-nav";
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

const PROBLEMS_DETAILED = [
  {
    icon: Repeat, color: "from-red-500 to-orange-500",
    title: "The Duplicate Disaster",
    desc: "Without coordination, multiple people buy the same gift. The result? Awkward returns, wasted money, and someone pretending to be thrilled about their third scented candle.",
    stat: "62%", statLabel: "of people have received a duplicate gift",
  },
  {
    icon: Frown, color: "from-orange-500 to-amber-500",
    title: "The Unwanted Gift Problem",
    desc: "We've all been there — smiling politely at a gift we'll never use. The giver spent time and money with good intentions but zero guidance. Everyone loses.",
    stat: "$16B", statLabel: "wasted on unwanted gifts yearly in the US alone",
  },
  {
    icon: CalendarX, color: "from-amber-500 to-yellow-500",
    title: "Forgotten Occasions",
    desc: "Birthdays, anniversaries, baby showers, holidays — the calendar is packed. Without a system, occasions sneak up and you're scrambling at the last minute.",
    stat: "47%", statLabel: "of people forget at least one important occasion yearly",
  },
  {
    icon: HelpCircle, color: "from-yellow-500 to-lime-500",
    title: "The Guessing Game",
    desc: "'What do you want?' 'Oh, anything is fine!' — the most frustrating conversation in human history. People don't want to seem demanding, so everyone stays silent and hopes for the best.",
    stat: "73%", statLabel: "say they struggle to know what someone wants",
  },
  {
    icon: DollarSign, color: "from-rose-500 to-pink-500",
    title: "Budget Blindness",
    desc: "How much should you spend? You don't know their budget expectations, they don't know yours. You overspend out of guilt or underspend and worry about it for weeks.",
    stat: "58%", statLabel: "feel anxious about spending the right amount",
  },
  {
    icon: TrendingDown, color: "from-pink-500 to-purple-500",
    title: "Zero Coordination",
    desc: "Nobody knows what anyone else is getting. There's no central place to check, no way to claim something, and no system to prevent overlap. It's chaos dressed up as generosity.",
    stat: "3.2x", statLabel: "more likely to give duplicates without a registry",
  },
];

const SOLUTIONS = [
  { icon: Gift, title: "Share What You Want", desc: "Create beautiful wishlists from any URL. Your friends see exactly what you'd love — no guessing required." },
  { icon: ShieldCheck, title: "Claim Without Spoiling", desc: "Friends claim items from your list privately. You never see who claimed what. The surprise stays intact." },
  { icon: Users, title: "Connect Your Circle", desc: "Add friends via unique codes. See their wishlists, upcoming events, and birthdays — all in one place." },
  { icon: Zap, title: "Effortless Organization", desc: "Events, collections, templates, mass-add. Everything is designed to take the work out of gift-giving." },
];

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen mkt-bg mkt-text selection:bg-amber-400/30 transition-colors duration-500">
      {/* Nav */}
      <MarketingNav />

      {/* Hero */}
      <section className="pt-36 pb-16 container mx-auto px-6 text-center">
        <Reveal>
          <span className="text-xs font-bold tracking-widest uppercase bg-gradient-to-r from-amber-400 to-rose-400 bg-clip-text text-transparent">About Lieblings</span>
          <h1 className="text-4xl lg:text-6xl font-extrabold font-heading mt-4 mb-6 leading-tight">
            We believe gift-giving should<br />bring{" "}
            <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-rose-500 bg-clip-text text-transparent">joy, not stress.</span>
          </h1>
          <p className="text-lg mkt-text-muted max-w-2xl mx-auto leading-relaxed">
            Lieblings — German for "favorites" — is a free platform built to fix everything wrong with how we give and receive gifts.
          </p>
        </Reveal>
      </section>

      {/* Problems in Detail */}
      <section className="py-20 container mx-auto px-6">
        <Reveal>
          <h2 className="text-3xl lg:text-4xl font-heading font-extrabold text-center mb-16">
            The <span className="mkt-text-faint line-through">problems</span> we're solving
          </h2>
        </Reveal>

        <div className="space-y-8 max-w-4xl mx-auto">
          {PROBLEMS_DETAILED.map((p, i) => (
            <Reveal key={i} delay={i * 80}>
              <div className="group flex flex-col md:flex-row gap-6 rounded-3xl border mkt-card-border mkt-bg-card p-6 md:p-8 mkt-card-border-hover transition-all duration-500">
                <div className="shrink-0 flex flex-col items-center md:items-start gap-3">
                  <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${p.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <p.icon className="h-7 w-7 mkt-text" />
                  </div>
                  <div className="text-center md:text-left">
                    <p className="text-2xl font-heading font-extrabold bg-gradient-to-r from-amber-300 to-rose-400 bg-clip-text text-transparent">{p.stat}</p>
                    <p className="text-[10px] mkt-text-faint max-w-[140px] leading-tight">{p.statLabel}</p>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-heading font-bold mb-2 mkt-text">{p.title}</h3>
                  <p className="text-sm mkt-text-muted leading-relaxed">{p.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* The Solution */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-500/[0.03] to-transparent" />
        <div className="container mx-auto px-6 relative z-10">
          <Reveal>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 mb-6">
                <PartyPopper className="h-5 w-5 text-amber-400" />
                <span className="text-sm font-semibold text-amber-300">The Lieblings Way</span>
              </div>
              <h2 className="text-3xl lg:text-4xl font-heading font-extrabold">
                A better way to <span className="bg-gradient-to-r from-amber-300 to-rose-400 bg-clip-text text-transparent">give and receive</span>
              </h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {SOLUTIONS.map((s, i) => (
              <Reveal key={i} delay={i * 100}>
                <div className="rounded-2xl border mkt-card-border mkt-bg-card p-6 mkt-card-border-hover transition-all duration-500 hover:-translate-y-1">
                  <div className="h-11 w-11 rounded-xl flex items-center justify-center mb-4" style={{ background: "linear-gradient(135deg, rgba(251,191,36,0.15), rgba(244,63,94,0.15))" }}>
                    <s.icon className="h-5 w-5 text-amber-400" />
                  </div>
                  <h3 className="text-sm font-heading font-bold mb-2 mkt-text">{s.title}</h3>
                  <p className="text-xs mkt-text-muted leading-relaxed">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 container mx-auto px-6">
        <Reveal>
          <div className="max-w-2xl mx-auto text-center rounded-3xl border mkt-card-border p-12" style={{ background: "linear-gradient(135deg, rgba(251,191,36,0.08), rgba(244,63,94,0.08))" }}>
            <h2 className="text-2xl font-heading font-extrabold mb-4">Start giving better today.</h2>
            <p className="mkt-text-muted mb-8">It's free. It's beautiful. It works.</p>
            <Button asChild size="lg" className="h-14 px-10 text-lg font-bold text-black rounded-2xl shadow-xl shadow-amber-500/25 hover:scale-105 transition-all"
              style={{ background: "linear-gradient(135deg, #fbbf24, #fb923c, #f43f5e)" }}>
              <Link href="/signup">Create your account <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <MarketingFooter />
    </div>
  );
}