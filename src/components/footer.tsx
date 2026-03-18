import Link from "next/link";
import { Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-muted/10 py-6 mt-auto">
      <div className="container mx-auto px-6 max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 opacity-60">
          <Sparkles className="h-3.5 w-3.5" />
          <span className="text-sm font-heading font-bold">lieblings</span>
        </div>
        <nav className="flex items-center gap-6">
          <Link href="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Home</Link>
          <Link href="/features" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Features</Link>
          <Link href="/upcoming-updates" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Updates</Link>
        </nav>
        <p className="text-[10px] text-muted-foreground">
          © {new Date().getFullYear()} Lieblings
        </p>
      </div>
    </footer>
  );
}