"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { UserPlus, Check, X, Copy, Trash2, Users, Plus, QrCode, Search } from "lucide-react";
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
  user_id: string;
  members: {
    user_id: string;
    display_name: string;
    avatar_url: string | null;
  }[];
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
  const [manageGroupOpen, setManageGroupOpen] = useState(false);
  const [editingGroupMembers, setEditingGroupMembers] = useState<FriendGroup | null>(null);
  const [groupSearchValue, setGroupSearchValue] = useState("");

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
    const { data: groupsData } = await supabase
      .from("friend_groups")
      .select(`
        id, 
        name, 
        user_id, 
        friend_group_members(
          user_id,
          users(display_name, avatar_url)
        )
      `);

    if (groupsData) {
      setGroups(groupsData.map((g: any) => ({
        id: g.id,
        name: g.name,
        user_id: g.user_id,
        members: g.friend_group_members.map((m: any) => ({
          user_id: m.user_id,
          display_name: m.users?.display_name || "Unknown",
          avatar_url: m.users?.avatar_url || null,
        })),
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
    if (!confirm("Are you sure? This will delete the group for everyone.")) return;
    const { error } = await supabase.from("friend_groups").delete().eq("id", groupId);
    if (error) { toast.error("Couldn't delete group."); } else { toast.success("Group deleted."); fetchData(); }
  }

  async function handleAddMember(groupId: string, memberId: string) {
    const { error } = await supabase.from("friend_group_members").insert({
      group_id: groupId,
      user_id: memberId
    });
    if (error) { toast.error("Couldn't add member."); } else { fetchData(); }
  }

  async function handleRemoveMember(groupId: string, memberId: string) {
    const { error } = await supabase.from("friend_group_members").delete().eq("group_id", groupId).eq("user_id", memberId);
    if (error) { toast.error("Couldn't remove member."); } else { fetchData(); }
  }

  function openManageMembers(group: FriendGroup) {
    setEditingGroupMembers(group);
    setManageGroupOpen(true);
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
      <div className="animate-fade-up">
        <h1 className="text-3xl font-heading font-bold tracking-tight">Friends</h1>
        <p className="text-muted-foreground mt-1 text-sm">Manage your friends, requests, and friend groups.</p>
      </div>

      {currentUser && (
        <Card className="glass-card gradient-border-card rounded-2xl animate-fade-up" style={{ animationDelay: '100ms' }}>
          <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))', boxShadow: '0 4px 20px var(--glow)' }}>
                <Users className="h-7 w-7 text-primary-foreground" />
              </div>
              <div>
                <Label className="text-[10px] text-primary/80 uppercase tracking-widest font-semibold mb-1 block">Your Friend Code</Label>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-2xl font-bold tracking-widest gradient-text">{currentUser.friend_code}</span>
                  <Button variant="ghost" size="icon" onClick={copyMyCode} className="text-primary hover:bg-primary/10 hover:text-primary glow-ring rounded-xl">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <Button onClick={() => setQrModalOpen(true)} className="w-full sm:w-auto shadow-lg gap-2 btn-gradient rounded-xl">
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
          <Card className="glass-card rounded-2xl">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base font-heading font-semibold">Add a friend</CardTitle>
              <CardDescription className="text-xs">Enter their friend code to send a request.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 flex gap-3">
              <Input placeholder="LIEB-XXXX" value={codeInput} onChange={(e) => setCodeInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddByCode()} className="flex-1 rounded-xl" />
              <Button onClick={handleAddByCode} disabled={addingCode || !codeInput.trim()} className="btn-gradient rounded-xl">
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
                  <Card key={friend.id} className="overflow-hidden glass-card rounded-2xl hover:-translate-y-1 transition-all duration-300">
                    <CardContent className="p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-10 w-10 ring-2 ring-primary/20 shadow-sm">
                          <AvatarImage src={friend.avatar_url ?? undefined} />
                          <AvatarFallback className="text-xs font-semibold" style={{ background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))', color: 'var(--primary-foreground)' }}>{friend.display_name[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="font-heading font-semibold text-sm truncate">{friend.display_name}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
                            {friend.birthday ? `Born in ${format(new Date(friend.birthday), "MMMM")}` : "Friend"}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveFriend(friend.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0 rounded-xl">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="glass-card rounded-2xl h-fit">
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="text-base font-heading font-semibold">Create a Group</CardTitle>
                <CardDescription className="text-xs">Organize friends for easier sharing.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 flex gap-3">
                <Input placeholder="Group name..." value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleCreateGroup()} className="flex-1 rounded-xl" />
                <Button onClick={handleCreateGroup} disabled={creatingGroup || !newGroupName.trim()} className="btn-gradient rounded-xl px-6">
                  {creatingGroup ? "..." : "Create"}
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h3 className="text-sm font-medium tracking-tight px-1 flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Your Groups
              </h3>
              {loading ? (
                <p className="text-sm text-muted-foreground p-4">Loading groups...</p>
              ) : groups.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {groups.map((group) => {
                    const isOwner = group.user_id === currentUser?.id;
                    return (
                      <Card key={group.id} className="overflow-hidden glass-card rounded-2xl border-border/50 group/card">
                        <CardHeader className="p-4 flex flex-row items-center justify-between border-b border-border/50 bg-muted/30">
                          <div className="min-w-0">
                            <CardTitle className="text-sm font-bold truncate">{group.name}</CardTitle>
                            <CardDescription className="text-[10px] mt-0.5 flex items-center gap-1.5 font-medium">
                              {isOwner ? (
                                <span className="text-primary/70 uppercase tracking-tighter">Owner</span>
                              ) : (
                                <span className="text-muted-foreground uppercase tracking-tighter">Member</span>
                              )}
                              <span>•</span>
                              <span>{group.members.length} {group.members.length === 1 ? "member" : "members"}</span>
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-1">
                            {isOwner && (
                              <Button variant="ghost" size="icon-xs" onClick={() => openManageMembers(group)} className="h-8 w-8 text-primary hover:bg-primary/10 rounded-xl opacity-0 group-hover/card:opacity-100 transition-opacity">
                                <Plus className="h-4 w-4" />
                              </Button>
                            )}
                            {isOwner && (
                              <Button variant="ghost" size="icon-xs" onClick={() => handleDeleteGroup(group.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-xl opacity-0 group-hover/card:opacity-100 transition-opacity">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 bg-background/50">
                          <div className="flex flex-wrap gap-2">
                            {group.members.length > 0 ? (
                              group.members.slice(0, 5).map((m, idx) => (
                                <Avatar key={idx} className="h-7 w-7 ring-2 ring-background border border-border/50">
                                  <AvatarImage src={m.avatar_url ?? undefined} />
                                  <AvatarFallback className="text-[8px] bg-primary/10 text-primary font-bold">{m.display_name[0]}</AvatarFallback>
                                </Avatar>
                              ))
                            ) : (
                              <p className="text-[11px] text-muted-foreground italic">No members yet.</p>
                            )}
                            {group.members.length > 5 && (
                              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-[8px] font-bold border border-border/50 ring-2 ring-background">
                                +{group.members.length - 5}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <EmptyState variant="collections" title="No groups yet" description="Create a group to easily share things with friends." />
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent className="sm:max-w-sm text-center glass-card rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center font-heading">Your Friend Code</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-6 gap-6">
            <div className="p-4 rounded-2xl shadow-lg animate-scale-in" style={{ background: 'white', boxShadow: '0 0 30px var(--glow)' }}>
              {currentUser && (
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=LIEB-${currentUser.friend_code}&color=000000`} 
                  alt="QR Code" 
                  className="w-48 h-48"
                />
              )}
            </div>
            <div className="px-5 py-3 rounded-xl font-mono text-xl tracking-widest font-bold w-full select-all text-center gradient-text" style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)' }}>
              {currentUser?.friend_code}
            </div>
            <p className="text-xs text-muted-foreground">Scan this QR code or share the code above to connect with friends.</p>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={manageGroupOpen} onOpenChange={setManageGroupOpen}>
        <DialogContent className="sm:max-w-md glass-card rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading">Manage {editingGroupMembers?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-widest text-primary/80">Group Members</h4>
              <div className="space-y-2 max-h-[150px] overflow-y-auto scrollbar-thin pr-2">
                {editingGroupMembers?.members.map((m) => (
                  <div key={m.user_id} className="flex items-center justify-between bg-muted/20 p-2 rounded-xl border border-border/30">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={m.avatar_url ?? undefined} />
                        <AvatarFallback className="text-[8px]">{m.display_name[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-semibold">{m.display_name}</span>
                    </div>
                    <Button variant="ghost" size="icon-xs" onClick={() => handleRemoveMember(editingGroupMembers.id, m.user_id)} className="h-6 w-6 text-muted-foreground hover:text-destructive rounded-lg">
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {editingGroupMembers?.members.length === 0 && (
                  <p className="text-xs text-muted-foreground italic text-center py-4">No members in this group yet.</p>
                )}
              </div>
            </div>

            <Separator className="bg-border/30" />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-widest text-primary/80">Add Friends</h4>
                <div className="relative w-32">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input 
                    placeholder="Search..." 
                    value={groupSearchValue} 
                    onChange={(e) => setGroupSearchValue(e.target.value)} 
                    className="pl-7 h-7 text-[10px] rounded-lg"
                  />
                </div>
              </div>
              <div className="space-y-2 max-h-[200px] overflow-y-auto scrollbar-thin pr-2">
                {friends
                  .filter(f => !editingGroupMembers?.members.some(m => m.user_id === f.id))
                  .filter(f => !groupSearchValue || f.display_name.toLowerCase().includes(groupSearchValue.toLowerCase()))
                  .map((friend) => (
                    <div key={friend.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-muted/30 border border-transparent hover:border-border/30 transition-all group">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={friend.avatar_url ?? undefined} />
                          <AvatarFallback className="text-[10px]">{friend.display_name[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium">{friend.display_name}</span>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleAddMember(editingGroupMembers!.id, friend.id)} className="h-7 text-[10px] rounded-lg glow-ring">
                        Add
                      </Button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
