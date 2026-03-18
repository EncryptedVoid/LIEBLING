import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sparkles, Gift, Users, CalendarDays, ShieldCheck, Palette, Layers,
  Star, Snowflake, Heart, ArrowRight, LayoutTemplate,
} from "lucide-react";

const FEATURES = [
  { icon: Gift, title: "Wishlists & Collections", desc: "Create unlimited wishlists organized into collections. Auto-fetch item details from any URL with our smart scraper." },
  { icon: Users, title: "Friend Network", desc: "Connect with friends via unique friend codes. See their wishlists, claim items privately, and never buy duplicates." },
  { icon: ShieldCheck, title: "Claim & Surprise System", desc: "Claim gifts from friends' wishlists without them knowing. Mark items as bought and track your gift-buying progress." },
  { icon: CalendarDays, title: "Event Management", desc: "Create events with dates, locations, and linked wishlists. See countdowns and get organized for any occasion." },
  { icon: Snowflake, title: "Secret Santa", desc: "Run Secret Santa exchanges with automatic matching. Share a join link, add members, and let the algorithm ensure no self-assignments." },
  { icon: Star, title: "Gift Roulette", desc: "Like Secret Santa but year-round. Perfect for birthday circles, office teams, or any group gift exchange." },
  { icon: Heart, title: "Wedding Blueprint", desc: "A step-by-step wizard that creates your wedding event, registry collection, and template items all at once." },
  { icon: Palette, title: "Themes & Customization", desc: "Choose from 6 accent colors and light/dark mode. Your theme applies to gradients, glows, and the entire experience." },
  { icon: LayoutTemplate, title: "Templates", desc: "Start from curated templates for birthdays, Christmas, weddings, graduations, and more — complete with banner images." },
  { icon: Layers, title: "Mass Add", desc: "Paste multiple URLs at once and we'll scrape details for each. Add them all to one or more collections simultaneously." },
  { icon: ShieldCheck, title: "Privacy Controls", desc: "Make collections and events public or exclusive. Control exactly which friends can see each wishlist." },
  { icon: Users, title: "Friend Groups", desc: "Organize friends into groups for easier sharing and privacy management across your wishlists and events." },
];

export default function FeaturesPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="fixed top-0 w-full z-50 bg-background/50 backdrop-blur-2xl border-b border-border/40">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center shadow-lg" style={{ background: "linear-gradient(135deg, var(--gradient-from), var(--gradient-to))", color: "white" }}>
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-xl font-heading font-bold tracking-tight gradient-text">lieblings</span>
          </Link>
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost"><Link href="/login">Log in</Link></Button>
            <Button asChild className="btn-gradient shadow-md"><Link href="/signup">Sign up free</Link></Button>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-32 pb-16 container mx-auto px-6 max-w-5xl">
        <div className="text-center mb-16 animate-fade-up">
          <h1 className="text-4xl lg:text-5xl font-extrabold font-heading tracking-tight mb-4">
            Every feature, <span className="gradient-text">built with love.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Lieblings is packed with thoughtful features to make gift-giving joyful and stress-free.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-grid">
          {FEATURES.map((f, i) => (
            <div key={i} className="glass-card gradient-border-card p-6 rounded-2xl transition-all hover:-translate-y-1 hover:shadow-lg">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 border border-primary/20">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-base font-bold font-heading mb-2">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <Button asChild size="lg" className="h-14 px-10 text-lg btn-gradient shadow-xl rounded-2xl group">
            <Link href="/signup">Get started free <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" /></Link>
          </Button>
        </div>
      </main>

      <footer className="border-t border-border/40 bg-muted/20 pb-8 pt-16">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 grayscale opacity-70"><Sparkles className="h-4 w-4" /><span className="text-lg font-heading font-bold">lieblings</span></div>
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Lieblings. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}