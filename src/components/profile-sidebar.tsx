"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { User } from "@/lib/types";

type ProfileSidebarProps = {
  currentUser: User;
  friends: User[];
  activeUserId: string;
  onSelect: (userId: string) => void;
};

export function ProfileSidebar({
  currentUser,
  friends,
  activeUserId,
  onSelect,
}: ProfileSidebarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const allUsers = [currentUser, ...friends];

  function checkOverflow() {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollUp(el.scrollTop > 4);
    setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 4);
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

  function scroll(direction: "up" | "down") {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      top: direction === "up" ? -120 : 120,
      behavior: "smooth",
    });
  }

  const showArrows = canScrollUp || canScrollDown;

  return (
    <TooltipProvider>
      <div className="flex flex-col items-center h-full py-2">
        {/* Header */}
        <p className="text-[8px] text-muted-foreground/60 uppercase tracking-widest font-medium mb-2 rotate-0">
          {friends.length > 0 ? "Lists" : "You"}
        </p>

        {/* Up Arrow */}
        {showArrows && (
          <Button
            variant="ghost"
            size="icon-xs"
            className={`mb-1 transition-opacity ${
              canScrollUp ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            onClick={() => scroll("up")}
          >
            <ChevronUp className="h-3 w-3" />
          </Button>
        )}

        {/* Scrollable Container */}
        <div
          ref={scrollRef}
          className="flex flex-col gap-2 overflow-y-auto scrollbar-hide flex-1 py-1 scroll-smooth"
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
              <Tooltip key={user.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onSelect(user.id)}
                    className={`relative flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all duration-200 ${
                      isActive
                        ? "scale-105"
                        : "opacity-60 hover:opacity-100 hover:scale-[1.02]"
                    }`}
                  >
                    <div
                      className={`relative rounded-full transition-all duration-300 ${
                        isActive
                          ? "ring-[3px] ring-primary ring-offset-2 ring-offset-background shadow-lg shadow-primary/20"
                          : ""
                      }`}
                    >
                      <Avatar className="h-12 w-12 transition-all duration-300">
                        <AvatarImage src={user.avatar_url ?? undefined} />
                        <AvatarFallback
                          className={`text-sm font-semibold ${
                            isActive
                              ? "bg-gradient-to-br from-primary/20 to-primary/5 text-primary"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {initials}
                        </AvatarFallback>
                      </Avatar>

                      {/* "ME" Badge */}
                      {isCurrentUser && (
                        <div className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-primary border-2 border-background flex items-center justify-center shadow-sm">
                          <span className="text-[7px] text-primary-foreground font-bold">
                            ME
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <p className={`text-[9px] font-bold mt-0.5 uppercase tracking-wider ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                      {isCurrentUser ? "YOU" : user.birthday ? format(new Date(user.birthday), "MMM") : "\u00A0"}
                    </p>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  <p className="text-xs font-medium">
                    {isCurrentUser ? "Your Wishlist" : `${user.display_name}'s Wishlist`}
                  </p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Down Arrow */}
        {showArrows && (
          <Button
            variant="ghost"
            size="icon-xs"
            className={`mt-1 transition-opacity ${
              canScrollDown ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            onClick={() => scroll("down")}
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
        )}
      </div>
    </TooltipProvider>
  );
}