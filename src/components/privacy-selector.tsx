"use client";

import { useState, useMemo } from "react";
import { Users, Lock, Unlock, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { User } from "@/lib/types";

// Note: In the future, this can also accept friendGroups as a prop
export type PrivacySelectorProps = {
  visibility: "public" | "exclusive";
  setVisibility: (v: "public" | "exclusive") => void;
  allowedUsers: string[];
  setAllowedUsers: (users: string[]) => void;
  friends: User[];
  friendGroups?: any[]; // optional for now
};

export function PrivacySelector({
  visibility,
  setVisibility,
  allowedUsers,
  setAllowedUsers,
  friends,
  friendGroups = [],
}: PrivacySelectorProps) {
  const [open, setOpen] = useState(false);

  function toggleUser(id: string) {
    if (allowedUsers.includes(id)) {
      setAllowedUsers(allowedUsers.filter((u) => u !== id));
    } else {
      setAllowedUsers([...allowedUsers, id]);
    }
  }

  function toggleGroup(groupUserIds: string[]) {
    // If all members are in allowedUsers, remove them. Otherwise, add them.
    const allIn = groupUserIds.every((id) => allowedUsers.includes(id));
    if (allIn) {
      setAllowedUsers(allowedUsers.filter((u) => !groupUserIds.includes(u)));
    } else {
      const newAllowed = new Set([...allowedUsers, ...groupUserIds]);
      setAllowedUsers(Array.from(newAllowed));
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Label>Privacy</Label>
      <div className="flex rounded-lg border-2 overflow-hidden ring-1 ring-border shadow-sm p-1 gap-1">
        <button
          type="button"
          onClick={() => setVisibility("public")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-md transition-all ${
            visibility === "public" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <Unlock className="h-4 w-4" />
          Public
        </button>
        <button
          type="button"
          onClick={() => setVisibility("exclusive")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-md transition-all ${
            visibility === "exclusive" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <Lock className="h-4 w-4" />
          Exclusive
        </button>
      </div>
      
      {visibility === "exclusive" && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200 bg-muted/30 p-3 rounded-lg border">
          <p className="text-xs font-medium mb-2">Who can see this?</p>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between font-normal text-xs h-9">
                <span className="flex items-center gap-2 truncate">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  {allowedUsers.length === 0 
                    ? "Select friends or groups" 
                    : `${allowedUsers.length} friend${allowedUsers.length !== 1 ? 's' : ''} selected`}
                </span>
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
              <div className="max-h-[250px] overflow-y-auto p-2 scrollbar-thin flex flex-col gap-1">
                {friendGroups.length > 0 && (
                  <div className="mb-2">
                    <p className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Groups</p>
                    {friendGroups.map((group) => {
                      // assume group object has { id, name, members: string[] }
                      const members = group.members || [];
                      const allIn = members.length > 0 && members.every((id: string) => allowedUsers.includes(id));
                      return (
                        <button
                          key={`group-${group.id}`}
                          onClick={() => toggleGroup(members)}
                          className="w-full flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors text-left"
                        >
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                              <Users className="h-3 w-3" />
                            </div>
                            <span className="text-xs font-medium">{group.name}</span>
                          </div>
                          {allIn && <Check className="h-3.5 w-3.5 text-primary" />}
                        </button>
                      );
                    })}
                  </div>
                )}
                
                <p className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Friends</p>
                {friends.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-2 text-center">No friends yet.</p>
                ) : (
                  friends.map((friend) => {
                    const selected = allowedUsers.includes(friend.id);
                    return (
                      <button
                        key={friend.id}
                        onClick={() => toggleUser(friend.id)}
                        className="w-full flex items-center justify-between p-1.5 rounded-md hover:bg-muted transition-colors text-left"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={friend.avatar_url ?? undefined} />
                            <AvatarFallback className="text-[10px]">{friend.display_name[0]?.toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs">{friend.display_name}</span>
                        </div>
                        {selected && <Check className="h-3.5 w-3.5 text-primary" />}
                      </button>
                    )
                  })
                )}
              </div>
            </PopoverContent>
          </Popover>
          {allowedUsers.length === 0 && (
            <p className="text-[10px] text-destructive mt-2 flex items-center gap-1">
              You must select at least one person to share with.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
