import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, Gift, Users, CalendarDays, ShieldCheck } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden selection:bg-primary/20 bg-background text-foreground">
      {/* Dynamic Animated Background */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] mix-blend-screen opacity-50 animate-glow-pulse" />
        <div className="absolute top-[40%] right-[10%] w-[400px] h-[400px] bg-[var(--gradient-to)]/10 rounded-full blur-[100px] mix-blend-screen opacity-50 animate-glow-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute -bottom-[20%] left-[30%] w-[600px] h-[600px] bg-primary/15 rounded-full blur-[140px] mix-blend-screen opacity-40 animate-glow-pulse" style={{ animationDelay: '4s' }} />
      </div>

      {/* Navigation Layer */}
      <header className="fixed top-0 w-full z-50 bg-background/50 backdrop-blur-2xl border-b border-border/40 transition-all duration-300">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))', color: 'white' }}>
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-xl font-heading font-bold tracking-tight gradient-text">lieblings</span>
          </div>
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" className="font-medium hover:bg-primary/10">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild className="btn-gradient shadow-md font-medium">
              <Link href="/signup">Sign up free</Link>
            </Button>
          </div>
        </div>
        <div className="gradient-line absolute bottom-0 left-0 w-full h-[1px]" />
      </header>

      {/* Hero Section */}
      <main className="flex-1 pt-32 lg:pt-48 pb-16 lg:pb-32 container mx-auto px-6 relative z-10">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto animate-fade-up">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8" style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)' }}>
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-semibold tracking-wide uppercase text-primary">The smarter way to wish</span>
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-extrabold font-heading tracking-tight leading-[1.1] mb-6 drop-shadow-sm">
            Wishlists shared with <br className="hidden md:block"/>
            <span className="gradient-text">the people you love.</span>
          </h1>
          
          <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mb-12 leading-relaxed">
            Organize gifts by event, connect with friends, and claim items without spoiling the surprise. The most beautiful way to manage registries for free.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Button asChild size="lg" className="h-14 px-8 text-lg btn-gradient shadow-xl rounded-2xl group transition-all hover:scale-105">
              <Link href="/signup">
                Get started — it's free
                <Sparkles className="ml-2 h-5 w-5 opacity-70 group-hover:animate-pulse" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-14 px-8 text-lg glass-card gradient-border-card rounded-2xl transition-all hover:bg-muted/50">
              <Link href="/login">View live demo</Link>
            </Button>
          </div>
        </div>

        {/* Mockup / Visualizer */}
        <div className="mt-20 lg:mt-32 max-w-6xl mx-auto rounded-3xl overflow-hidden glass-card gradient-border-card shadow-2xl relative animate-fade-up" style={{ animationDelay: '0.2s', border: '1px solid var(--glass-border)' }}>
          <div className="h-8 bg-muted/30 border-b border-border/40 flex items-center px-4 gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500/80" />
            <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
            <div className="h-3 w-3 rounded-full bg-green-500/80" />
          </div>
          <div className="aspect-video bg-muted/10 relative flex items-center justify-center p-8 lg:p-12 overflow-hidden">
             {/* Abstract Dashboard Representation */}
             <div className="w-full h-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6 opacity-80 pointer-events-none">
                <div className="col-span-1 md:col-span-2 space-y-6">
                  <div className="h-24 w-full rounded-2xl glass-card gradient-border-card flex items-center p-6">
                    <div className="h-12 w-12 rounded-full skeleton-shimmer bg-primary/20" />
                    <div className="ml-4 space-y-2 flex-1">
                      <div className="h-4 w-1/3 rounded-lg skeleton-shimmer bg-primary/20" />
                      <div className="h-3 w-1/2 rounded-lg skeleton-shimmer bg-primary/10" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6 h-48">
                    <div className="rounded-2xl glass-card gradient-border-card p-6 flex flex-col gap-4">
                      <div className="h-24 w-full rounded-lg skeleton-shimmer bg-primary/10" />
                      <div className="h-4 w-3/4 rounded-lg skeleton-shimmer bg-primary/20" />
                    </div>
                     <div className="rounded-2xl glass-card gradient-border-card p-6 flex flex-col gap-4">
                      <div className="h-24 w-full rounded-lg skeleton-shimmer bg-primary/10" />
                      <div className="h-4 w-3/4 rounded-lg skeleton-shimmer bg-primary/20" />
                    </div>
                  </div>
                </div>
                <div className="col-span-1 space-y-6">
                   <div className="h-[200px] w-full rounded-2xl glass-card gradient-border-card flex flex-col justify-center items-center p-6">
                      <div className="h-16 w-16 rounded-full skeleton-shimmer bg-primary/30" />
                      <div className="h-8 w-1/2 mt-4 rounded-lg skeleton-shimmer bg-primary/20" />
                      <div className="h-4 w-1/3 mt-2 rounded-lg skeleton-shimmer bg-primary/10" />
                   </div>
                   <div className="h-32 w-full rounded-2xl glass-card gradient-border-card" />
                </div>
             </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="py-24 lg:py-32 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 stagger-grid">
          <FeatureCard 
            icon={<Gift className="h-6 w-6 text-primary" />}
            title="Curate Collections"
            description="Add gifts from any website securely. Organize by holiday, birthday, or just because."
          />
          <FeatureCard 
            icon={<Users className="h-6 w-6 text-primary" />}
            title="Friend Network"
            description="Connect via secure friend codes to see exactly what your circle is wishing for."
          />
          <FeatureCard 
            icon={<ShieldCheck className="h-6 w-6 text-primary" />}
            title="Surprise Intact"
            description="Friends can claim gifts without the recipient ever knowing until the big day."
          />
          <FeatureCard 
            icon={<CalendarDays className="h-6 w-6 text-primary" />}
            title="Event Management"
            description="Link wishlists to specific events with dates and locations to make planning easy."
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-muted/20 pb-8 pt-16 mt-auto">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 grayscale opacity-70">
            <Sparkles className="h-4 w-4" />
            <span className="text-lg font-heading font-bold">lieblings</span>
          </div>
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Lieblings. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="glass-card gradient-border-card p-8 rounded-3xl transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
      <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 shadow-sm border border-primary/20">
        {icon}
      </div>
      <h3 className="text-xl font-bold font-heading mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}