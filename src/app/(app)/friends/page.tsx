"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { UserPlus, Check, X, Copy, Trash2, Users, Plus, QrCode } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";

import type { User } from "@/lib/types";

type FriendRequest = {
  id: string;
  status: "pending" | "accepted";
  friend: User;
  isIncoming: boolean;
};

type FriendGroup = {
  id: string;
  name: string;
  members: string[]; // array of user IDs
};

export default function FriendsPage() {
  const supabase = createClient();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // States
  const [friends, setFriends] = useState<User[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [groups, setGroups] = useState<FriendGroup[]>([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const [codeInput, setCodeInput] = useState("");
  const [addingCode, setAddingCode] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [creatingGroup, setCreatingGroup] = useState(false);
  
  // Modals
  const [qrModalOpen, setQrModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single();
    if (profile) setCurrentUser(profile as User);

    // Fetch friendships (both pending and accepted)
    const { data: friendships } = await supabase
      .from("friendships")
      .select("id, status, requester_id, addressee_id")
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

    if (friendships && friendships.length > 0) {
      const friendIds = friendships.map((f) => f.requester_id === user.id ? f.addressee_id : f.requester_id);
      const { data: profiles } = await supabase.from("users").select("*").in("id", friendIds);
      const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

      const accepted: User[] = [];
      const pendingReqs: FriendRequest[] = [];

      friendships.forEach((f) => {
        const friendId = f.requester_id === user.id ? f.addressee_id : f.requester_id;
        const profile = profileMap.get(friendId);
        if (!profile) return;

        if (f.status === "accepted") {
          accepted.push(profile as User);
        } else if (f.status === "pending") {
          pendingReqs.push({
            id: f.id,
            status: "pending",
            friend: profile as User,
            isIncoming: f.addressee_id === user.id,
          });
        }
      });

      setFriends(accepted);
      setRequests(pendingReqs);
    } else {
      setFriends([]);
      setRequests([]);
    }

    // Fetch friend groups
    const { data: groupsData } = await supabase.from("friend_groups").select("*, friend_group_members(user_id)").eq("user_id", user.id);
    if (groupsData) {
      setGroups(groupsData.map(g => ({
        id: g.id,
        name: g.name,
        members: g.friend_group_members.map((m: any) => m.user_id),
      })));
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleAccept(friendshipId: string) {
    const { error } = await supabase.from("friendships").update({ status: "accepted" }).eq("id", friendshipId);
    if (error) { toast.error("Couldn't accept request."); } else { toast.success("Friend added!"); fetchData(); }
  }

  async function handleDenyOrRemove(friendshipId: string, isRemoval = false) {
    const { error } = await supabase.from("friendships").delete().eq("id", friendshipId);
    if (error) { toast.error("Action failed."); } else { toast.success(isRemoval ? "Friend removed." : "Request removed."); fetchData(); }
  }

  async function handleRemoveFriend(friendId: string) {
    if (!currentUser) return;
    const { data: friendship } = await supabase
      .from("friendships")
      .select("id")
      .or(`and(requester_id.eq.${currentUser.id},addressee_id.eq.${friendId}),and(requester_id.eq.${friendId},addressee_id.eq.${currentUser.id})`)
      .single();
    
    if (friendship) {
      handleDenyOrRemove(friendship.id, true);
    }
  }

  async function handleAddByCode() {
    if (!codeInput.trim() || !currentUser) return;
    setAddingCode(true);
    const { data: target } = await supabase.from("users").select("id").eq("friend_code", codeInput.trim().toUpperCase()).single();
    if (!target) { toast.error("No user found with that code."); setAddingCode(false); return; }
    if (target.id === currentUser.id) { toast.error("That's your own code!"); setAddingCode(false); return; }
    
    const { data: existing } = await supabase.from("friendships").select("id").or(`and(requester_id.eq.${currentUser.id},addressee_id.eq.${target.id}),and(requester_id.eq.${target.id},addressee_id.eq.${currentUser.id})`);
    if (existing && existing.length > 0) { toast.error("Already connected or request pending."); setAddingCode(false); return; }
    
    const { error } = await supabase.from("friendships").insert({ requester_id: currentUser.id, addressee_id: target.id, status: "pending" });
    if (error) { toast.error("Couldn't send request."); } else { toast.success("Friend request sent!"); setCodeInput(""); fetchData(); }
    setAddingCode(false);
  }

  async function handleCreateGroup() {
    if (!newGroupName.trim() || !currentUser) return;
    setCreatingGroup(true);
    const { error } = await supabase.from("friend_groups").insert({
      user_id: currentUser.id,
      name: newGroupName.trim(),
    });
    if (error) { toast.error("Couldn't create group."); } else { toast.success("Group created!"); setNewGroupName(""); fetchData(); }
    setCreatingGroup(false);
  }

  async function handleDeleteGroup(groupId: string) {
    const { error } = await supabase.from("friend_groups").delete().eq("id", groupId);
    if (error) { toast.error("Couldn't delete group."); } else { toast.success("Group deleted."); fetchData(); }
  }

  function copyMyCode() {
    if (!currentUser) return;
    navigator.clipboard.writeText(currentUser.friend_code);
    toast.success("Friend code copied!");
  }

  const incomingReqs = requests.filter(r => r.isIncoming);
  const outgoingReqs = requests.filter(r => !r.isIncoming);

  return (
    <div className="page-enter max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Friends</h1>
        <p className="text-muted-foreground mt-0.5 text-xs">Manage your friends, requests, and friend groups.</p>
      </div>

      {currentUser && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <Label className="text-[10px] text-primary/80 uppercase tracking-widest font-semibold mb-1 block">Your Friend Code</Label>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xl font-bold tracking-widest text-primary">{currentUser.friend_code}</span>
                  <Button variant="ghost" size="icon" onClick={copyMyCode} className="text-primary hover:bg-primary/10 hover:text-primary">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <Button variant="default" onClick={() => setQrModalOpen(true)} className="w-full sm:w-auto shadow-sm gap-2">
              <QrCode className="h-4 w-4" /> Share QR Code
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="friends" className="w-full">
        <TabsList className="mb-6 w-full sm:w-auto h-auto p-1 grid grid-cols-3 sm:inline-flex">
          <TabsTrigger value="friends" className="py-2.5">My Friends ({friends.length})</TabsTrigger>
          <TabsTrigger value="requests" className="py-2.5">
            Requests {incomingReqs.length > 0 && <Badge className="ml-2 bg-primary px-1.5 h-5 text-[10px]">{incomingReqs.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="groups" className="py-2.5">Groups</TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-semibold">Add a friend</CardTitle>
              <CardDescription className="text-xs">Enter their friend code to send a request.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 flex gap-3">
              <Input placeholder="LIEB-XXXX" value={codeInput} onChange={(e) => setCodeInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddByCode()} className="flex-1" />
              <Button onClick={handleAddByCode} disabled={addingCode || !codeInput.trim()}>
                {addingCode ? "Sending..." : "Send Request"}
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="text-sm font-medium tracking-tight px-1">All Friends</h3>
            {loading ? (
              <p className="text-sm text-muted-foreground p-4">Loading friends...</p>
            ) : friends.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 stagger-grid">
                {friends.map((friend) => (
                  <Card key={friend.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-10 w-10 border shadow-sm">
                          <AvatarImage src={friend.avatar_url ?? undefined} />
                          <AvatarFallback className="text-xs font-medium">{friend.display_name[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{friend.display_name}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
                            {friend.birthday ? `Born in ${format(new Date(friend.birthday), "MMMM")}` : "Friend"}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveFriend(friend.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState variant="collections" title="No friends yet" description="Add someone using their friend code above." />
            )}
          </div>
        </TabsContent>

        <TabsContent value="requests" className="space-y-8">
          <div>
            <h3 className="text-sm font-medium tracking-tight mb-4 px-1">Incoming Requests</h3>
            {incomingReqs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 stagger-grid">
                {incomingReqs.map((req) => (
                  <Card key={req.id}>
                    <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border">
                          <AvatarImage src={req.friend.avatar_url ?? undefined} />
                          <AvatarFallback className="text-xs">{req.friend.display_name[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{req.friend.display_name}</p>
                          <p className="text-[10px] text-muted-foreground">Wants to be friends</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="default" size="sm" onClick={() => handleAccept(req.id)} className="flex-1 md:flex-none">Accept</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDenyOrRemove(req.id)} className="text-destructive hover:bg-destructive/10">Decline</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-muted/30 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">You have no pending incoming requests.</p>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-medium tracking-tight mb-4 px-1">Sent Requests</h3>
            {outgoingReqs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 stagger-grid">
                {outgoingReqs.map((req) => (
                  <div key={req.id} className="flex items-center justify-between p-3 rounded-lg border bg-background text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={req.friend.avatar_url ?? undefined} />
                        <AvatarFallback className="text-[10px]">{req.friend.display_name[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="truncate">{req.friend.display_name}</span>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">Pending...</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-muted/30 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">You haven't sent any friend requests recently.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="groups" className="space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-semibold">Create a Group</CardTitle>
              <CardDescription className="text-xs">Organize friends for easier sharing (e.g., "Family", "Colleagues").</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 flex gap-3">
              <Input placeholder="Group name..." value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleCreateGroup()} className="flex-1" />
              <Button onClick={handleCreateGroup} disabled={creatingGroup || !newGroupName.trim()}>
                {creatingGroup ? "Creating..." : "Create"}
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="text-sm font-medium tracking-tight px-1">Your Groups</h3>
            {loading ? (
              <p className="text-sm text-muted-foreground p-4">Loading groups...</p>
            ) : groups.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger-grid">
                {groups.map((group) => (
                  <Card key={group.id} className="overflow-hidden">
                    <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between border-b bg-muted/20">
                      <div>
                        <CardTitle className="text-sm font-semibold">{group.name}</CardTitle>
                        <CardDescription className="text-[10px] mt-0.5">{group.members.length} members</CardDescription>
                      </div>
                      <Button variant="ghost" size="icon-xs" onClick={() => handleDeleteGroup(group.id)} className="h-7 w-7 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </CardHeader>
                    <CardContent className="p-4">
                      {/* Placeholder for group member management which will be implemented later, or integrated in standard friends view */}
                      <p className="text-xs text-muted-foreground italic">Add members when setting privacy permissions.</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState variant="collections" title="No groups yet" description="Create a group to easily share wishlists with multiple people." />
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent className="sm:max-w-sm text-center">
          <DialogHeader>
            <DialogTitle className="text-center">Your Friend Code</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-6 gap-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-muted-foreground/10">
              {currentUser && (
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=LIEB-${currentUser.friend_code}&color=000000`} 
                  alt="QR Code" 
                  className="w-48 h-48"
                />
              )}
            </div>
            <div className="bg-muted px-4 py-2 rounded-lg font-mono text-xl tracking-widest font-bold w-full select-all text-center">
              {currentUser?.friend_code}
            </div>
            <p className="text-xs text-muted-foreground">Scan this QR code or share the code above to connect with friends.</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
