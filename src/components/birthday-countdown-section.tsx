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
    <Card className="shadow-sm flex flex-col h-[400px]">
      <CardHeader className="pb-2 shrink-0 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Cake className="h-4 w-4" />
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
      
      <CardContent className="flex-1 p-0 relative overflow-hidden flex items-center justify-center bg-muted/10">
        <div 
          className="flex transition-transform duration-300 ease-in-out h-full w-full"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {upcomingBirthdays.map((birthday) => (
            <div key={birthday.id} className="min-w-full h-full flex items-center justify-center p-6">
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
    <div className={`w-full max-w-sm rounded-2xl p-6 shadow-sm border text-center transition-all ${
      isSelf ? "bg-gradient-to-br from-pink-50 to-rose-50 border-pink-100 dark:from-pink-950/20 dark:to-rose-950/20 dark:border-pink-900/30" : 
      isCustomEvent ? "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100 dark:from-blue-950/20 dark:to-indigo-950/20 dark:border-blue-900/30" :
      "bg-card"
    }`}>
      {birthday.user && !isCustomEvent && (
        <Avatar className="h-20 w-20 mx-auto mb-4 border-4 border-background shadow-md">
          <AvatarImage src={birthday.user.avatar_url ?? undefined} />
          <AvatarFallback className="text-xl">
            {birthday.user.display_name[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}

      {isCustomEvent && (
        <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center border-4 border-background shadow-md">
          <Calendar className="h-8 w-8 text-blue-500" />
        </div>
      )}

      <h2 className="text-2xl font-bold mb-1 tracking-tight">
        {isCustomEvent ? birthday.title : isSelf ? "Your Birthday" : `${birthday.user?.display_name}'s Birthday`}
      </h2>
      
      <p className="text-sm text-muted-foreground mb-6 font-medium">
        {format(birthday.nextBirthday, "MMMM do, yyyy")}
        {!isCustomEvent && birthday.age && ` • Turning ${birthday.age}`}
      </p>

      <div className="flex flex-col items-center justify-center">
        {birthday.isToday ? (
          <div className="animate-bounce flex flex-col items-center">
            <PartyPopper className="h-10 w-10 text-pink-500 mb-2" />
            <span className="text-xl font-bold text-pink-600 dark:text-pink-400">It's Today!</span>
          </div>
        ) : (
          <div className="flex items-baseline gap-2">
            <span className="text-6xl font-extrabold tracking-tighter text-primary drop-shadow-sm">{days}</span>
            <span className="text-xl font-semibold text-muted-foreground">days</span>
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