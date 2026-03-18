"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogOut, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type NavProps = {
  user: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
};

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/wishlist", label: "Wishlists" },
  { href: "/events", label: "Events" },
  { href: "/activities", label: "Activities" },
  { href: "/friends", label: "Friends" },
];

export function Nav({ user }: NavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    // Clear client-side session
    await supabase.auth.signOut();

    // Clear server-side cookies via API route
    try {
      await fetch("/api/auth/signout", { method: "POST" });
    } catch {
      // Continue even if this fails
    }

    // Hard redirect — forces full page reload so middleware sees no session
    // Do NOT use router.push() here — it preserves cached state
    window.location.href = "/login";
  }

  const initials = user.display_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <nav className="sticky top-0 z-40 border-b" style={{ background: 'var(--glass)', backdropFilter: 'blur(24px) saturate(1.6)', WebkitBackdropFilter: 'blur(24px) saturate(1.6)', borderColor: 'var(--glass-border)' }}>
      <div className="flex items-center justify-between px-6 py-2.5 max-w-7xl mx-auto">
        {/* Logo */}
        <Link
          href="/dashboard"
          className="group flex items-center gap-2"
        >
          <span className="text-xl font-heading font-bold tracking-tight gradient-text group-hover:opacity-80 transition-opacity">
            lieblings
          </span>
        </Link>

        {/* Center nav links */}
        <div className="hidden md:flex items-center gap-1 p-1 rounded-2xl" style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)' }}>
          {navLinks.map((link) => {
            const isActive =
              link.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-4 py-1.5 text-sm font-medium rounded-xl transition-all duration-300 ${
                  isActive
                    ? "text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {isActive && (
                  <span
                    className="absolute inset-0 rounded-xl"
                    style={{
                      background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))',
                      boxShadow: '0 2px 12px var(--glow)',
                    }}
                  />
                )}
                <span className="relative z-10">{link.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Right: user menu */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-9 w-9 rounded-full p-0 glow-ring"
              >
                <Avatar className="h-9 w-9 ring-2 ring-primary/20 transition-all duration-300 hover:ring-primary/50">
                  <AvatarImage
                    src={user.avatar_url ?? undefined}
                    alt={user.display_name}
                  />
                  <AvatarFallback className="text-[11px] font-semibold bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 p-1 border border-border/60 shadow-xl" style={{ background: 'var(--popover)', backdropFilter: 'blur(24px) saturate(1.6)' }}>
              <div className="px-3 py-2.5 mb-1">
                <p className="text-sm font-semibold">{user.display_name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Manage your account</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="rounded-lg">
                <Link href="/settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" /> Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="rounded-lg text-destructive focus:text-destructive">
                <LogOut className="h-4 w-4 mr-2" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Gradient line at bottom */}
      <div className="gradient-line" />
    </nav>
  );
}