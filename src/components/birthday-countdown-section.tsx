"use client";

import { useMemo } from "react";
import {
  differenceInDays,
  differenceInYears,
  format,
  setYear,
  addYears,
  isBefore,
  isToday,
} from "date-fns";
import { Cake, PartyPopper, Calendar } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

import type { User } from "@/lib/types";

type BirthdayCountdownSectionProps = {
  currentUser: User | null;
  friends: User[];
};

type UpcomingBirthday = {
  user: User;
  daysAway: number;
  nextBirthday: Date;
  age: number | null; // Age they'll be turning
  isToday: boolean;
  isCurrentUser: boolean;
};

export function BirthdayCountdownSection({
  currentUser,
  friends,
}: BirthdayCountdownSectionProps) {
  const upcomingBirthdays = useMemo(() => {
    const now = new Date();
    const allUsers = currentUser ? [currentUser, ...friends] : friends;

    const birthdays: UpcomingBirthday[] = allUsers
      .filter((user) => user.birthday)
      .map((user) => {
        const bday = new Date(user.birthday!);
        const today = isToday(bday);

        // Calculate next birthday
        let nextBday = setYear(bday, now.getFullYear());
        if (isBefore(nextBday, now) && !today) {
          nextBday = addYears(nextBday, 1);
        }

        const daysAway = today ? 0 : differenceInDays(nextBday, now);
        const currentAge = differenceInYears(now, bday);
        const turningAge = today ? currentAge : currentAge + 1;

        return {
          user,
          daysAway,
          nextBirthday: nextBday,
          age: turningAge,
          isToday: today,
          isCurrentUser: user.id === currentUser?.id,
        };
      })
      .filter((b) => b.daysAway <= 60) // Show birthdays within 60 days
      .sort((a, b) => a.daysAway - b.daysAway);

    return birthdays;
  }, [currentUser, friends]);

  if (upcomingBirthdays.length === 0) {
    return null;
  }

  // Separate today's birthdays from upcoming
  const todaysBirthdays = upcomingBirthdays.filter((b) => b.isToday);
  const upcoming = upcomingBirthdays.filter((b) => !b.isToday);

  return (
    <div className="space-y-3">
      {/* Today's Birthdays - Celebration Cards */}
      {todaysBirthdays.map((birthday) => (
        <Card
          key={birthday.user.id}
          className={`overflow-hidden shadow-sm transition-all ${
            birthday.isCurrentUser
              ? "ring-2 ring-pink-500/50 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20"
              : "ring-2 ring-amber-400/50 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20"
          }`}
        >
          <div className={`h-1 ${
            birthday.isCurrentUser
              ? "bg-gradient-to-r from-pink-500 via-rose-400 to-orange-400"
              : "bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400"
          }`} />
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <div className={`h-14 w-14 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${
                birthday.isCurrentUser
                  ? "bg-gradient-to-br from-pink-200 to-rose-200 dark:from-pink-900/50 dark:to-rose-900/50"
                  : "bg-gradient-to-br from-amber-200 to-orange-200 dark:from-amber-900/50 dark:to-orange-900/50"
              }`}>
                <PartyPopper className={`h-7 w-7 ${
                  birthday.isCurrentUser ? "text-pink-600 dark:text-pink-400" : "text-amber-600 dark:text-amber-400"
                }`} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {!birthday.isCurrentUser && (
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={birthday.user.avatar_url ?? undefined} />
                      <AvatarFallback className="text-[8px]">
                        {birthday.user.display_name[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <h2 className={`text-lg font-bold bg-clip-text text-transparent ${
                    birthday.isCurrentUser
                      ? "bg-gradient-to-r from-pink-600 to-rose-500"
                      : "bg-gradient-to-r from-amber-600 to-orange-500"
                  }`}>
                    {birthday.isCurrentUser
                      ? "🎉 Happy Birthday! 🎉"
                      : `🎉 ${birthday.user.display_name}'s Birthday! 🎉`}
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {birthday.isCurrentUser ? "You are" : "They are"}{" "}
                  <span className="font-semibold text-foreground">
                    {birthday.age} years young
                  </span>{" "}
                  today!
                </p>
              </div>

              <div className="hidden sm:flex items-center gap-1 text-2xl">
                🎂🎈🎁
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Upcoming Birthdays */}
      {upcoming.length > 0 && (
        <Card className="overflow-hidden shadow-sm">
          <div className="h-1 bg-gradient-to-r from-primary/60 via-primary/20 to-transparent" />
          <CardContent className="py-3">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Upcoming Birthdays
              </h3>
            </div>

            <div className="space-y-2">
              {upcoming.slice(0, 5).map((birthday) => (
                <div
                  key={birthday.user.id}
                  className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={birthday.user.avatar_url ?? undefined} />
                    <AvatarFallback className="text-xs">
                      {birthday.user.display_name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">
                      {birthday.isCurrentUser ? "You" : birthday.user.display_name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {format(birthday.nextBirthday, "MMMM d")}
                      {birthday.age && ` • Turning ${birthday.age}`}
                    </p>
                  </div>

                  <Badge
                    variant={birthday.daysAway <= 7 ? "default" : "secondary"}
                    className="shrink-0 text-[10px]"
                  >
                    {birthday.daysAway === 1
                      ? "Tomorrow"
                      : `${birthday.daysAway} days`}
                  </Badge>
                </div>
              ))}

              {upcoming.length > 5 && (
                <p className="text-[10px] text-muted-foreground text-center pt-1">
                  +{upcoming.length - 5} more upcoming
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Birthday Set Reminder (only show if user has no birthday) */}
      {currentUser && !currentUser.birthday && (
        <Card className="overflow-hidden shadow-sm card-gradient-accent">
          <div className="h-1 bg-gradient-to-r from-pink-500 to-rose-400" />
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-pink-100 to-pink-50 dark:from-pink-950/30 dark:to-pink-900/10 flex items-center justify-center shrink-0 shadow-inner">
                <Cake className="h-7 w-7 text-pink-500 opacity-50" />
              </div>
              <div>
                <p className="text-sm font-medium">Your birthday isn't set</p>
                <a href="/settings" className="text-xs text-primary hover:underline">
                  Add it in settings →
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}