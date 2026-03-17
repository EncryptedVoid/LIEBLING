"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
  { href: "/friends", label: "Friends" },
];

export function Nav({ user }: NavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initials = user.display_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <nav className="sticky top-0 z-40 flex items-center justify-between px-6 py-2.5 border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      {/* Logo */}
      <Link
        href="/dashboard"
        className="text-lg font-semibold tracking-tight text-primary hover:opacity-80 transition-opacity"
      >
        lieblings
      </Link>

      {/* Center nav links */}
      <div className="hidden md:flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
        {navLinks.map((link) => {
          const isActive =
            link.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(link.href);
          return (
            <Button
              key={link.href}
              variant={isActive ? "default" : "ghost"}
              size="sm"
              asChild
              className={
                isActive
                  ? ""
                  : "hover:bg-background/80 text-muted-foreground hover:text-foreground"
              }
            >
              <Link href={link.href}>{link.label}</Link>
            </Button>
          );
        })}
      </div>

      {/* Right: user menu */}
      <div className="flex items-center gap-1">

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-8 w-8 rounded-full ring-2 ring-transparent hover:ring-primary/20 transition-all"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={user.avatar_url ?? undefined}
                  alt={user.display_name}
                />
                <AvatarFallback className="text-[10px]">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user.display_name}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}