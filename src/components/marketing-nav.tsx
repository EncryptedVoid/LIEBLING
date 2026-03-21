"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Sun, Moon, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/features", label: "Features" },
  { href: "/upcoming-updates", label: "Upcoming Features" },
];

export function MarketingNav() {
  const pathname = usePathname();
  const [scrollY, setScrollY] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  // Load preference from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("lieblings-marketing-theme");
    if (stored === "light") {
      setDarkMode(false);
      document.documentElement.setAttribute("data-marketing-theme", "light");
    } else {
      setDarkMode(true);
      document.documentElement.setAttribute("data-marketing-theme", "dark");
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function toggleTheme() {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("lieblings-marketing-theme", next ? "dark" : "light");
    document.documentElement.setAttribute("data-marketing-theme", next ? "dark" : "light");
  }

  const isScrolled = scrollY > 50;

  return (
    <>
      <header
        className={`fixed top-0 w-full z-50 transition-all duration-500 ${
          isScrolled
            ? "mkt-bg-nav-scrolled backdrop-blur-2xl border-b mkt-border"
            : ""
        }`}
      >
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div
              className="h-9 w-9 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-3"
              style={{ background: "linear-gradient(135deg, #fbbf24, #f43f5e)" }}
            >
              <Sparkles className="h-4 w-4 mkt-text" />
            </div>
            <span className="text-xl font-heading font-bold tracking-tight bg-gradient-to-r from-amber-300 via-rose-400 to-pink-400 bg-clip-text text-transparent">
              lieblings
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm transition-colors relative group ${
                    isActive
                      ? "mkt-text font-medium"
                      : "mkt-text-muted hover:mkt-text"
                  }`}
                >
                  {link.label}
                  <span
                    className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-amber-400 to-rose-400 transition-all duration-300 ${
                      isActive ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="h-9 w-9 rounded-xl flex items-center justify-center mkt-bg-subtle hover:mkt-bg-hover transition-all duration-300 group"
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? (
                <Sun className="h-4 w-4 mkt-text-muted group-hover:mkt-text transition-colors" />
              ) : (
                <Moon className="h-4 w-4 mkt-text-muted group-hover:mkt-text transition-colors" />
              )}
            </button>

            <Button
              asChild
              variant="ghost"
              className="mkt-text-muted hover:mkt-text hover:mkt-bg-subtle font-medium hidden sm:flex"
            >
              <Link href="/login">Log in</Link>
            </Button>
            <Button
              asChild
              className="font-semibold text-black rounded-xl shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-all hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #fbbf24, #fb923c, #f43f5e)",
              }}
            >
              <Link href="/signup">Sign up free</Link>
            </Button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="h-9 w-9 rounded-xl flex items-center justify-center mkt-bg-subtle md:hidden"
            >
              {mobileOpen ? (
                <X className="h-4 w-4 mkt-text" />
              ) : (
                <Menu className="h-4 w-4 mkt-text" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="md:hidden mkt-bg-solid border-t mkt-border animate-in fade-in-0 slide-in-from-top-2 duration-200">
            <div className="container mx-auto px-6 py-4 flex flex-col gap-2">
              {NAV_LINKS.map((link) => {
                const isActive =
                  link.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`px-4 py-2.5 rounded-xl text-sm transition-colors ${
                      isActive
                        ? "mkt-text font-medium mkt-bg-subtle"
                        : "mkt-text-muted hover:mkt-text hover:mkt-bg-subtle"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="px-4 py-2.5 rounded-xl text-sm mkt-text-muted hover:mkt-text hover:mkt-bg-subtle transition-colors"
              >
                Log in
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
}

export function MarketingFooter() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || submitted) return;
    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("newsletter_subscribers")
        .insert({ email: email.trim().toLowerCase() });
      if (error) {
        if (error.message.includes("duplicate") || error.code === "23505") {
          toast.info("You're already subscribed!");
          setSubmitted(true);
        } else {
          toast.error("Something went wrong. Try again.");
        }
      } else {
        setSubmitted(true);
        setEmail("");
        toast.success("Thanks! We'll notify you when our newsletter launches.");
      }
    } catch {
      toast.error("Something went wrong.");
    }
    setSubmitting(false);
  }

  return (
    <footer className="border-t mkt-border py-12">
      <div className="container mx-auto px-6 flex flex-col gap-8">
        <div className="max-w-md mx-auto text-center">
          <h3 className="text-sm font-heading font-semibold mkt-text mb-1">
            Stay in the loop
          </h3>
          <p className="text-xs mkt-text-muted mb-3">
            Get updates on new features and releases.
          </p>
          {submitted ? (
            <p className="text-xs text-amber-400 font-medium animate-fade-up">
              You&apos;re subscribed! We&apos;ll be in touch.
            </p>
          ) : (
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 h-9 rounded-xl border mkt-card-border mkt-bg-card mkt-text px-3 text-sm placeholder:mkt-text-faint focus:outline-none focus:border-amber-500/40 transition-colors"
              />
              <Button
                type="submit"
                disabled={submitting || !email.trim()}
                className="h-9 px-5 font-semibold text-black rounded-xl shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 hover:scale-105 transition-all"
                style={{
                  background:
                    "linear-gradient(135deg, #fbbf24, #fb923c, #f43f5e)",
                }}
              >
                {submitting ? "..." : "Subscribe"}
              </Button>
            </form>
          )}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div
              className="h-7 w-7 rounded-lg flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #fbbf24, #f43f5e)",
              }}
            >
              <Sparkles className="h-3.5 w-3.5 mkt-text" />
            </div>
            <span className="text-sm font-heading font-bold mkt-text-faint">
              lieblings
            </span>
          </div>
          <nav className="flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs mkt-text-faint hover:mkt-text-muted transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/login"
              className="text-xs mkt-text-faint hover:mkt-text-muted transition-colors"
            >
              Log in
            </Link>
          </nav>
          <p className="text-[10px] mkt-text-faint">
            © {new Date().getFullYear()} Lieblings. Made with love.
          </p>
        </div>
      </div>
    </footer>
  );
}