"use client";

import { useRef, useState, useEffect } from "react";
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
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const allUsers = [currentUser, ...friends];

  function checkOverflow() {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }

  useEffect(() => {
    checkOverflow();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkOverflow, { passive: true });
    const ro = new ResizeObserver(checkOverflow);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", checkOverflow);
      ro.disconnect();
    };
  }, [allUsers.length]);

  function scroll(direction: "left" | "right") {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -200 : 200,
      behavior: "smooth",
    });
  }

  const showArrows = canScrollLeft || canScrollRight;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Helper text */}
      <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium">
        {friends.length > 0 ? "Switch wishlists" : "Your wishlist"}
      </p>

      <div className="relative w-full">
        {/* Left arrow */}
        {showArrows && canScrollLeft && (
          <Button
            variant="outline"
            size="icon-sm"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 shadow-md bg-background/95 backdrop-blur-sm -translate-x-1/2 opacity-90 hover:opacity-100 transition-opacity"
            onClick={() => scroll("left")}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
        )}

        {/* Scrollable container */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide py-3 px-2 scroll-smooth justify-center"
        >
          {allUsers.map((user) => {
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
                className={`flex flex-col items-center gap-2.5 shrink-0 transition-all duration-300 rounded-2xl px-4 py-3 min-w-[100px] ${
                  isActive
                    ? "scale-105"
                    : "hover:scale-[1.03] opacity-60 hover:opacity-100"
                }`}
              >
                <div
                  className={`relative rounded-full transition-all duration-300 ${
                    isActive
                      ? "ring-[3px] ring-primary ring-offset-[3px] ring-offset-background shadow-lg shadow-primary/20"
                      : ""
                  }`}
                >
                  {/* LARGER AVATAR: h-20 w-20 (was h-16 w-16) */}
                  <Avatar className="h-20 w-20 transition-all duration-300">
                    <AvatarImage src={user.avatar_url ?? undefined} />
                    <AvatarFallback
                      className={`text-lg font-semibold ${
                        isActive
                          ? "bg-gradient-to-br from-primary/20 to-primary/5 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {isCurrentUser && (
                    <div className="absolute -bottom-0.5 -right-0.5 h-6 w-6 rounded-full bg-primary border-[2.5px] border-background flex items-center justify-center shadow-sm">
                      <span className="text-[8px] text-primary-foreground font-bold">
                        ME
                      </span>
                    </div>
                  )}
                </div>
                <span
                  className={`text-xs font-medium leading-tight text-center max-w-[80px] truncate transition-colors duration-200 ${
                    isActive ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {isCurrentUser ? "You" : user.display_name.split(" ")[0]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right arrow */}
        {showArrows && canScrollRight && (
          <Button
            variant="outline"
            size="icon-sm"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 shadow-md bg-background/95 backdrop-blur-sm translate-x-1/2 opacity-90 hover:opacity-100 transition-opacity"
            onClick={() => scroll("right")}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}