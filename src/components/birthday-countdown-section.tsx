"use client";

import { useMemo, useState, useEffect } from "react";
import {
  differenceInDays,
  differenceInYears,
  format,
  setYear,
  addYears,
  isBefore,
  isToday,
} from "date-fns";
import { Cake, PartyPopper, Calendar, ChevronLeft, ChevronRight, Plus } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

import type { User } from "@/lib/types";

type BirthdayCountdownSectionProps = {
  currentUser: User | null;
  friends: User[];
};

type UpcomingBirthday = {
  id: string; // unique key
  user?: User;
  daysAway: number;
  nextBirthday: Date;
  age: number | null; 
  isToday: boolean;
  isCurrentUser: boolean;
  isCustomEvent?: boolean;
  title?: string;
};

export function BirthdayCountdownSection({
  currentUser,
  friends,
}: BirthdayCountdownSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const supabase = createClient();
  
  // Custom custom countdowns stored locally for this mock since we don't have an explicit table
  const [customCountdowns, setCustomCountdowns] = useState<UpcomingBirthday[]>([]);

  // Load custom countdowns from local storage to persist them
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("customCountdowns");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const withDates = parsed.map((p: any) => ({
            ...p,
            nextBirthday: new Date(p.nextBirthday)
          }));
          setCustomCountdowns(withDates);
        } catch (e) {}
      }
    }
  }, []);

  const saveCustomCountdown = (newCountdown: UpcomingBirthday) => {
    const updated = [...customCountdowns, newCountdown];
    setCustomCountdowns(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("customCountdowns", JSON.stringify(updated));
    }
  };

  const upcomingBirthdays = useMemo(() => {
    const now = new Date();
    // Default: show theirs (currentUser)
    const baseUsers = currentUser ? [currentUser] : [];

    // Also include friends
    const allUsers = [...baseUsers, ...friends];

    const birthdays: UpcomingBirthday[] = allUsers
      .filter((user) => user.birthday)
      .map((user) => {
        const bday = new Date(user.birthday!);
        const today = isToday(bday);

        let nextBday = setYear(bday, now.getFullYear());
        if (isBefore(nextBday, now) && !today) {
          nextBday = addYears(nextBday, 1);
        }

        const daysAway = today ? 0 : differenceInDays(nextBday, now);
        const currentAge = differenceInYears(now, bday);
        const turningAge = today ? currentAge : currentAge + 1;

        return {
          id: user.id,
          user,
          daysAway,
          nextBirthday: nextBday,
          age: turningAge,
          isToday: today,
          isCurrentUser: user.id === currentUser?.id,
        };
      });
      
    // Recompute days away for custom countdowns to ensure freshness
    const freshCustoms = customCountdowns.map(c => {
      const today = isToday(c.nextBirthday);
      const daysAway = today ? 0 : differenceInDays(c.nextBirthday, now);
      return { ...c, daysAway, isToday: today };
    }).filter(c => c.daysAway >= 0); // Remove past ones

    let allCountdowns = [...birthdays, ...freshCustoms]
      .sort((a, b) => a.daysAway - b.daysAway);
      
    // Ensure current user is first if it exists
    const cuIdx = allCountdowns.findIndex(c => c.isCurrentUser);
    if (cuIdx > 0) {
      const cu = allCountdowns.splice(cuIdx, 1)[0];
      allCountdowns.unshift(cu);
    }

    return allCountdowns;
  }, [currentUser, friends, customCountdowns]);

  // Slides configuration
  // The slides are: the calculated countdowns + 1 "End Card"
  const slidesCount = upcomingBirthdays.length + 1;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? slidesCount - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === slidesCount - 1 ? 0 : prev + 1));
  };

  return (
    <Card className="glass-card gradient-border-card flex flex-col min-h-[400px] h-full rounded-2xl overflow-hidden">
      <CardHeader className="pb-3 shrink-0 border-b border-border/40">
        <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <div className="p-1.5 rounded-lg" style={{ background: 'linear-gradient(135deg, var(--gradient-accent), var(--gradient-from))' }}>
                <Cake className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              Countdowns
          </CardTitle>
          <div className="flex gap-1">
            <Button variant="outline" size="icon-xs" onClick={handlePrev} className="h-6 w-6">
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <Button variant="outline" size="icon-xs" onClick={handleNext} className="h-6 w-6">
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-0 relative overflow-hidden flex items-center justify-center bg-muted/5 min-h-[340px]">
        <div 
          className="flex transition-transform duration-300 ease-in-out h-full w-full"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {upcomingBirthdays.map((birthday) => (
            <div key={birthday.id} className="min-w-full h-full flex items-center justify-center p-4 sm:p-6 overflow-y-auto overflow-x-hidden scrollbar-thin">
              <CountdownCard birthday={birthday} />
            </div>
          ))}
          
          {/* End Card */}
          <div className="min-w-full h-full flex items-center justify-center p-6">
            <div className="text-center max-w-xs flex flex-col items-center">
              <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Calendar className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Want more?</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Do you want to add a countdown to another event or birthday?
              </p>
              <Button onClick={() => setAddOpen(true)} className="w-full shadow-sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Countdown
              </Button>
            </div>
          </div>
        </div>
        
        {/* Pagination Dots */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
          {Array.from({ length: slidesCount }).map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all ${i === currentIndex ? "w-4 bg-primary" : "w-1.5 bg-border"}`}
            />
          ))}
        </div>
      </CardContent>

      <AddCountdownDialog 
        open={addOpen} 
        onOpenChange={setAddOpen} 
        onAdd={(data: UpcomingBirthday) => {
          saveCustomCountdown(data);
          setAddOpen(false);
          // Go to the new slide
          setCurrentIndex(upcomingBirthdays.length);
        }}
        friends={friends}
      />
    </Card>
  );
}

function CountdownCard({ birthday }: { birthday: UpcomingBirthday }) {
  const isCustomEvent = birthday.isCustomEvent;
  const isSelf = birthday.isCurrentUser;
  const days = birthday.daysAway;

  return (
    <div className="w-full max-w-sm rounded-2xl p-6 text-center transition-all glass-card gradient-border-card hover:-translate-y-1 my-auto">
      {birthday.user && !isCustomEvent && (
        <div className="relative mx-auto mb-4 w-fit">
          <div className="absolute -inset-1 rounded-full animate-glow-pulse opacity-50" style={{ background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to), var(--gradient-accent))' }} />
          <Avatar className="h-20 w-20 relative border-4 border-background shadow-lg">
            <AvatarImage src={birthday.user.avatar_url ?? undefined} />
            <AvatarFallback className="text-xl font-heading font-bold" style={{ background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))', color: 'white' }}>
              {birthday.user.display_name[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      {isCustomEvent && (
        <div className="relative mx-auto mb-4 w-fit">
          <div className="absolute -inset-1 rounded-full animate-glow-pulse opacity-40" style={{ background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))' }} />
          <div className="relative h-20 w-20 rounded-full flex items-center justify-center border-4 border-background shadow-lg" style={{ background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))' }}>
            <Calendar className="h-8 w-8 text-white" />
          </div>
        </div>
      )}

      <h2 className="text-xl font-heading font-bold mb-1 tracking-tight">
        {isCustomEvent ? birthday.title : isSelf ? "Your Birthday" : `${birthday.user?.display_name}'s Birthday`}
      </h2>
      
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-5" style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)' }}>
        <Calendar className="h-3 w-3" />
        {format(birthday.nextBirthday, "MMMM do, yyyy")}
        {!isCustomEvent && birthday.age && ` • Turning ${birthday.age}`}
      </div>

      <div className="flex flex-col items-center justify-center">
        {birthday.isToday ? (
          <div className="animate-bounce flex flex-col items-center">
            <PartyPopper className="h-10 w-10 mb-2 gradient-text" style={{ color: 'var(--gradient-from)' }} />
            <span className="text-xl font-heading font-bold gradient-text">It's Today! 🎉</span>
          </div>
        ) : (
          <div className="flex items-baseline gap-2">
            <span className="text-6xl font-heading font-extrabold tracking-tighter gradient-text-animated drop-shadow-sm">{days}</span>
            <span className="text-lg font-semibold text-muted-foreground">days away</span>
          </div>
        )}
      </div>
    </div>
  );
}

function AddCountdownDialog({ open, onOpenChange, onAdd, friends }: any) {
  const [type, setType] = useState<"event" | "friend">("event");
  const [date, setDate] = useState("");
  const [title, setTitle] = useState("");
  const [friendId, setFriendId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (type === "event") {
      if (!title || !date) return toast.error("Please fill all fields.");
      const d = new Date(date);
      // add timezone offset back to prevent off-by-one errors with basic date strings
      const utcDate = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
      onAdd({
        id: `custom-${Date.now()}`,
        daysAway: 0,
        nextBirthday: utcDate,
        age: null,
        isToday: false,
        isCurrentUser: false,
        isCustomEvent: true,
        title
      });
      toast.success("Countdown added!");
    } else {
      if (!friendId) return toast.error("Please select a friend.");
      const friend = friends.find((f: User) => f.id === friendId);
      if (!friend || !friend.birthday) return toast.error("Friend does not have a birthday set.");
      
      const now = new Date();
      const bday = new Date(friend.birthday);
      let nextBday = setYear(bday, now.getFullYear());
      if (isBefore(nextBday, now) && !isToday(bday)) {
        nextBday = addYears(nextBday, 1);
      }
      
      onAdd({
        id: `friend-${friend.id}-${Date.now()}`,
        user: friend,
        daysAway: differenceInDays(nextBday, now),
        nextBirthday: nextBday,
        age: differenceInYears(now, bday) + 1,
        isToday: isToday(bday),
        isCurrentUser: false,
      });
      toast.success("Countdown added!");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Countdown</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="flex gap-2 mb-4">
            <Button type="button" variant={type === "event" ? "default" : "outline"} onClick={() => setType("event")} className="flex-1">Custom Event</Button>
            <Button type="button" variant={type === "friend" ? "default" : "outline"} onClick={() => setType("friend")} className="flex-1">Friend's Birthday</Button>
          </div>

          {type === "event" ? (
            <>
              <div className="space-y-2">
                <Label>Event Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Vacation, Anniversary" />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Label>Select Friend</Label>
              <select 
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={friendId}
                onChange={(e) => setFriendId(e.target.value)}
              >
                <option value="">Select someone...</option>
                {friends.filter((f: User) => f.birthday).map((f: User) => (
                  <option key={f.id} value={f.id}>{f.display_name}</option>
                ))}
              </select>
              {friends.filter((f: User) => f.birthday).length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">None of your friends have their birthday set yet.</p>
              )}
            </div>
          )}

          <Button type="submit" className="w-full mt-2">Add to Carousel</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}