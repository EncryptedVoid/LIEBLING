"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { User } from "@/lib/types";

type ProfileCarouselProps = {
  currentUser: User;
  friends: User[];
  activeUserId: string;
  onSelect: (userId: string) => void;
};

export function ProfileCarousel({
  currentUser,
  friends,
  activeUserId,
  onSelect,
}: ProfileCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const allUsers = [currentUser, ...friends];

  function scroll(direction: "left" | "right") {
    if (!scrollRef.current) return;
    const amount = 200;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  }

  return (
    <div className="relative group/carousel">
      {/* Left arrow */}
      <Button
        variant="outline"
        size="icon-sm"
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover/carousel:opacity-100 transition-opacity shadow-md bg-background/90 backdrop-blur-sm -translate-x-1/2"
        onClick={() => scroll("left")}
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </Button>

      {/* Scrollable container */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide py-2 px-1 scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {allUsers.map((user, i) => {
          const isActive = user.id === activeUserId;
          const isCurrentUser = user.id === currentUser.id;
          const initials = user.display_name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

          return (
            <button
              key={user.id}
              onClick={() => onSelect(user.id)}
              className={`flex flex-col items-center gap-1.5 shrink-0 transition-all duration-200 rounded-xl px-3 py-2 min-w-[72px] ${
                isActive
                  ? "bg-primary/10 scale-105"
                  : "hover:bg-muted/60 hover:scale-[1.02]"
              }`}
            >
              <div
                className={`relative rounded-full transition-all duration-200 ${
                  isActive
                    ? "ring-[2.5px] ring-primary ring-offset-2 ring-offset-background"
                    : "ring-2 ring-transparent"
                }`}
              >
                <Avatar
                  className={`h-11 w-11 transition-all duration-200 ${
                    isActive ? "" : "opacity-70 hover:opacity-100"
                  }`}
                >
                  <AvatarImage src={user.avatar_url ?? undefined} />
                  <AvatarFallback
                    className={`text-xs ${
                      isActive
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {isCurrentUser && (
                  <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-primary border-2 border-background flex items-center justify-center">
                    <span className="text-[7px] text-primary-foreground font-bold">
                      ME
                    </span>
                  </div>
                )}
              </div>
              <span
                className={`text-[10px] font-medium leading-tight text-center max-w-[60px] truncate ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {isCurrentUser ? "You" : user.display_name.split(" ")[0]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Right arrow */}
      <Button
        variant="outline"
        size="icon-sm"
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover/carousel:opacity-100 transition-opacity shadow-md bg-background/90 backdrop-blur-sm translate-x-1/2"
        onClick={() => scroll("right")}
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}