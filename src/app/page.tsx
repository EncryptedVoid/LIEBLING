"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, Gift, Users, CalendarDays, ShieldCheck, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";

const FEATURES = [
  { icon: Gift, title: "Curate Collections", desc: "Add gifts from any website. Organize by holiday, birthday, or just because." },
  { icon: Users, title: "Friend Network", desc: "Connect via secure friend codes to see what your circle is wishing for." },
  { icon: ShieldCheck, title: "Surprise Intact", desc: "Friends can claim gifts without the recipient ever knowing until the big day." },
  { icon: CalendarDays, title: "Event Management", desc: "Link wishlists to events with dates, locations, and countdowns." },
  { icon: Sparkles, title: "Secret Santa", desc: "Create gift exchange activities with automatic matching and no self-assignments." },
  { icon: Gift, title: "Templates", desc: "Start from curated templates for birthdays, weddings, holidays, and more." },
];

export default function LandingPage() {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  function checkScroll() {
    const el = carouselRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    checkScroll();
    return () => el.removeEventListener("scroll", checkScroll);
  }, []);

  function scroll(dir: "left" | "right") {
    carouselRef.current?.scrollBy({ left: dir === "left" ? -320 : 320, behavior: "smooth" });
  }

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden bg-background text-foreground">
      {/* Animated background */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] mix-blend-screen opacity-50 animate-glow-pulse" />
        <div className="absolute top-[40%] right-[10%] w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] mix-blend-screen opacity-50 animate-glow-pulse" style={{ animationDelay: "2s" }} />
      </div>

      {/* Nav */}
      <header className="fixed top-0 w-full z-50 bg-background/50 backdrop-blur-2xl border-b border-border/40">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center shadow-lg" style={{ background: "linear-gradient(135deg, var(--gradient-from), var(--gradient-to))", color: "white" }}>
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-xl font-heading font-bold tracking-tight gradient-text">lieblings</span>
          </div>
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" className="font-medium hover:bg-primary/10"><Link href="/login">Log in</Link></Button>
            <Button asChild className="btn-gradient shadow-md font-medium"><Link href="/signup">Sign up free</Link></Button>
          </div>
        </div>
        <div className="gradient-line absolute bottom-0 left-0 w-full h-[1px]" />
      </header>

      {/* Hero */}
      <section className="pt-32 lg:pt-48 pb-16 container mx-auto px-6 relative z-10">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto animate-fade-up">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8" style={{ background: "var(--glass)", border: "1px solid var(--glass-border)" }}>
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-semibold tracking-wide uppercase text-primary">The smarter way to wish</span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-extrabold font-heading tracking-tight leading-[1.1] mb-6">
            Wishlists shared with <br className="hidden md:block" /><span className="gradient-text">the people you love.</span>
          </h1>
          <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mb-12 leading-relaxed">
            Organize gifts by event, connect with friends, and claim items without spoiling the surprise. The most beautiful way to manage registries for free.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Button asChild size="lg" className="h-14 px-8 text-lg btn-gradient shadow-xl rounded-2xl group transition-all hover:scale-105">
              <Link href="/signup">Get started — it&apos;s free <Sparkles className="ml-2 h-5 w-5 opacity-70 group-hover:animate-pulse" /></Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-14 px-8 text-lg glass-card gradient-border-card rounded-2xl">
              <Link href="/features">See all features</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* About / Problem + Solution */}
      <section className="py-16 lg:py-24 container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <h2 className="text-3xl font-heading font-bold mb-4">Gift-giving shouldn&apos;t be stressful.</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Duplicate gifts, forgotten occasions, and endless guessing — traditional gift-giving is broken. Lieblings fixes it by giving everyone a beautiful, private space to share what they actually want, connected to the people who care about them.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
            {[
              { num: "0", label: "Duplicate gifts" },
              { num: "100%", label: "Surprises preserved" },
              { num: "∞", label: "Occasions covered" },
            ].map((stat) => (
              <div key={stat.label} className="glass-card rounded-2xl p-6 text-center">
                <p className="text-3xl font-heading font-bold gradient-text">{stat.num}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Carousel */}
      <section className="py-16 lg:py-24 relative">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-heading font-bold">Everything you need.</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => scroll("left")} disabled={!canScrollLeft} className="rounded-xl"><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon" onClick={() => scroll("right")} disabled={!canScrollRight} className="rounded-xl"><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
        <div ref={carouselRef} className="flex gap-6 overflow-x-auto scrollbar-hide px-6 pb-4 snap-x snap-mandatory scroll-smooth">
          <div className="w-6 shrink-0" />
          {FEATURES.map((f, i) => (
            <div key={i} className="min-w-[280px] max-w-[300px] snap-start shrink-0 glass-card gradient-border-card p-8 rounded-3xl transition-all hover:-translate-y-2 hover:shadow-xl">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 shadow-sm border border-primary/20">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold font-heading mb-3">{f.title}</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">{f.desc}</p>
            </div>
          ))}
          <div className="w-6 shrink-0" />
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-24 container mx-auto px-6">
        <div className="max-w-2xl mx-auto text-center glass-card gradient-border-card rounded-3xl p-12">
          <h2 className="text-3xl font-heading font-bold mb-4">Ready to start wishing?</h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Join Lieblings for free and never worry about gift-giving again. Your friends and family are waiting.
          </p>
          <Button asChild size="lg" className="h-14 px-10 text-lg btn-gradient shadow-xl rounded-2xl group">
            <Link href="/signup">Create your first wishlist <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" /></Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-muted/20 pb-8 pt-16 mt-auto">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 grayscale opacity-70">
            <Sparkles className="h-4 w-4" />
            <span className="text-lg font-heading font-bold">lieblings</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/features" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Features</Link>
            <Link href="/upcoming-updates" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Updates</Link>
          </nav>
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Lieblings. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}