"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  Search,
  ArrowUpDown,
  Sparkles,
  LayoutGrid,
  List,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ItemGrid } from "@/components/item-grid";
import { AddItemDialog } from "@/components/add-item-dialog";
import { ProfileSidebar } from "@/components/profile-sidebar";
import { CollectionEventBanner } from "@/components/collection-event-banner";
import { TemplatePicker } from "@/components/template-picker";
import { NewCollectionDialog } from "@/components/add-collection-dialog";
import { EmojiPicker } from "@/components/emoji-picker";
import { BannerUpload } from "@/components/banner-upload";
import { THEME_CSS } from "@/lib/theme-colors";
import { toast } from "sonner";

import type { Item, Collection, User, Event } from "@/lib/types";

type SortOption = "newest" | "oldest" | "price-low" | "price-high" | "name";
type ViewMode = "grid" | "list";

export default function WishlistPage() {
  const supabase = createClient();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [friends, setFriends] = useState<User[]>([]);
  const [activeUserId, setActiveUserId] = useState<string>("");

  const [items, setItems] = useState<Item[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [collectionSearch, setCollectionSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const [addItemOpen, setAddItemOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  const [addCollectionOpen, setAddCollectionOpen] = useState(false);

  const [editCollectionOpen, setEditCollectionOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [editCollectionName, setEditCollectionName] = useState("");
  const [editCollectionEmoji, setEditCollectionEmoji] = useState<string | null>(null);
  const [editCollectionBanner, setEditCollectionBanner] = useState<string | null>(null);
  const [savingEditCollection, setSavingEditCollection] = useState(false);

  const [deleteCollectionOpen, setDeleteCollectionOpen] = useState(false);
  const [deletingCollection, setDeletingCollection] = useState<Collection | null>(null);
  const [deletingCollectionLoading, setDeletingCollectionLoading] = useState(false);
  const [deleteItemsToo, setDeleteItemsToo] = useState(false);

  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);

  const isOwnWishlist = activeUserId === currentUser?.id;

  // Get active user for theme
  const activeViewUser = activeUserId === currentUser?.id
    ? currentUser
    : friends.find((f) => f.id === activeUserId);

  // Apply friend's accent color
  useEffect(() => {
    const styleId = "friend-theme-override";
    let el = document.getElementById(styleId) as HTMLStyleElement | null;

    if (!isOwnWishlist && activeViewUser?.theme_color) {
      const css = THEME_CSS[activeViewUser.theme_color] ?? "";
      if (css) {
        if (!el) {
          el = document.createElement("style");
          el.id = styleId;
          document.head.appendChild(el);
        }
        el.textContent = `:root, .dark { ${css} }`;
      }
    }

    return () => {
      const existing = document.getElementById(styleId);
      if (existing) existing.remove();
    };
  }, [isOwnWishlist, activeViewUser?.theme_color]);

  // Restore own theme when switching back
  useEffect(() => {
    if (isOwnWishlist) {
      const existing = document.getElementById("friend-theme-override");
      if (existing) existing.remove();
    }
  }, [isOwnWishlist]);

  // Init
  useEffect(() => {
    async function init() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;
      const { data: profile } = await supabase.from("users").select("*").eq("id", authUser.id).single();
      setCurrentUser(profile as User);
      setActiveUserId(authUser.id);
      const { data: friendships } = await supabase
        .from("friendships")
        .select("requester_id, addressee_id")
        .or(`requester_id.eq.${authUser.id},addressee_id.eq.${authUser.id}`)
        .eq("status", "accepted");
      if (friendships && friendships.length > 0) {
        const friendIds = friendships.map((f) =>
          f.requester_id === authUser.id ? f.addressee_id : f.requester_id
        );
        const { data: friendProfiles } = await supabase.from("users").select("*").in("id", friendIds);
        setFriends((friendProfiles as User[]) ?? []);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (!activeUserId) return;
    fetchData(activeUserId);
  }, [activeUserId]);

  async function fetchData(userId: string) {
    setLoading(true);
    setActiveCollectionId(null);
    setSearchQuery("");

    const [itemsRes, colsRes, eventsRes] = await Promise.all([
      supabase.from("items_visible").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("collections").select("*").eq("user_id", userId).order("name"),
      supabase.from("events").select("*").eq("user_id", userId).order("date", { ascending: true }),
    ]);

    setItems(itemsRes.data ?? []);
    setCollections(colsRes.data ?? []);
    setEvents(eventsRes.data ?? []);
    setLoading(false);
  }

  // Get event linked to active collection
  const linkedEvent = useMemo(() => {
    if (!activeCollectionId) return null;
    return events.find((e) => e.collection_id === activeCollectionId) ?? null;
  }, [activeCollectionId, events]);

  // Filtered collections
  const filteredCollections = useMemo(() => {
    const sorted = [...collections].sort((a, b) => {
      if (a.is_system && !b.is_system) return -1;
      if (!a.is_system && b.is_system) return 1;
      return a.name.localeCompare(b.name);
    });

    if (!collectionSearch.trim()) return sorted;
    const q = collectionSearch.toLowerCase();
    return sorted.filter((c) => c.name.toLowerCase().includes(q));
  }, [collections, collectionSearch]);

  // Filtered items
  const filteredItems = useMemo(() => {
    let result = activeCollectionId === null
      ? items
      : items.filter((i) => i.collection_ids?.includes(activeCollectionId));

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((i) =>
        i.name.toLowerCase().includes(q) || i.link.toLowerCase().includes(q)
      );
    }

    switch (sortBy) {
      case "newest":
        result = [...result].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case "oldest":
        result = [...result].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case "price-low":
        result = [...result].sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
        break;
      case "price-high":
        result = [...result].sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
        break;
      case "name":
        result = [...result].sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    // Sort gifted items to end
    const active = result.filter((i) => !i.gifted_at);
    const gifted = result.filter((i) => !!i.gifted_at);
    return [...active, ...gifted];
  }, [items, activeCollectionId, searchQuery, sortBy]);

  function getCount(colId: string | null): number {
    if (colId === null) return items.length;
    return items.filter((i) => i.collection_ids?.includes(colId)).length;
  }

  function handleDeleteItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  function handleEditItem(item: Item) {
    setEditingItem(item);
    setAddItemOpen(true);
  }

  function handleGiftedToggle() {
    fetchData(activeUserId);
  }

  // Get active collection
  const activeCollection = activeCollectionId
    ? collections.find((c) => c.id === activeCollectionId)
    : null;

  // Collection edit handlers
  function openEditCollection(col: Collection) {
    setEditingCollection(col);
    setEditCollectionName(col.name);
    setEditCollectionEmoji(col.emoji ?? null);
    setEditCollectionBanner(col.banner_url ?? null);
    setEditCollectionOpen(true);
  }

  async function handleSaveEditCollection() {
    if (!editCollectionName.trim() || !editingCollection) return;
    setSavingEditCollection(true);
    const { error } = await supabase
      .from("collections")
      .update({
        name: editCollectionName.trim(),
        emoji: editCollectionEmoji,
      })
      .eq("id", editingCollection.id);
    if (error) {
      toast.error("Couldn't rename collection.");
    } else {
      toast.success("Collection updated.");
      setEditCollectionOpen(false);
      setEditingCollection(null);
      fetchData(activeUserId);
    }
    setSavingEditCollection(false);
  }

  function openDeleteCollection(col: Collection) {
    setDeletingCollection(col);
    setDeleteItemsToo(false);
    setDeleteCollectionOpen(true);
  }

  async function handleDeleteCollection() {
    if (!deletingCollection) return;
    setDeletingCollectionLoading(true);

    if (deleteItemsToo) {
      const itemsInCol = items.filter((i) => i.collection_ids?.includes(deletingCollection.id));
      const onlyInThis = itemsInCol.filter((i) => (i.collection_ids?.length ?? 0) <= 1);
      if (onlyInThis.length > 0) {
        await supabase.from("items").delete().in("id", onlyInThis.map((i) => i.id));
      }
    }

    const { error } = await supabase.from("collections").delete().eq("id", deletingCollection.id);
    if (error) {
      toast.error("Couldn't delete collection.");
    } else {
      toast.success(`"${deletingCollection.name}" deleted.`);
      if (activeCollectionId === deletingCollection.id) setActiveCollectionId(null);
      setDeleteCollectionOpen(false);
      setDeletingCollection(null);
      fetchData(activeUserId);
    }
    setDeletingCollectionLoading(false);
  }

  const activeLabel = activeCollectionId === null
    ? "All items"
    : collections.find((c) => c.id === activeCollectionId)?.name ?? "Collection";

  const sortLabels: Record<SortOption, string> = {
    newest: "Newest first",
    oldest: "Oldest first",
    "price-low": "Price: low → high",
    "price-high": "Price: high → low",
    name: "Name A-Z",
  };

  const itemsInDeletingCol = deletingCollection
    ? items.filter((i) => i.collection_ids?.includes(deletingCollection.id))
    : [];
  const exclusiveItems = deletingCollection
    ? itemsInDeletingCol.filter((i) => (i.collection_ids?.length ?? 0) <= 1)
    : [];

  return (
    <div className="page-enter flex h-[calc(100vh-4rem)]">
      {/* Profile Sidebar - Left Side */}
      {currentUser && (
        <aside className="w-20 shrink-0 border-r bg-muted/20 hidden md:block">
          <ProfileSidebar
            currentUser={currentUser}
            friends={friends}
            activeUserId={activeUserId}
            onSelect={(id) => setActiveUserId(id)}
          />
        </aside>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex gap-6 p-4 min-w-0 overflow-hidden">
        {/* Collections Sidebar */}
        <aside className="w-52 shrink-0 hidden lg:flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
              Collections
            </h2>
            {isOwnWishlist && (
              <div className="flex gap-0.5">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setTemplatePickerOpen(true)}
                  title="Templates"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setAddCollectionOpen(true)}
                  title="New collection"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>

          {collections.length > 5 && (
            <div className="relative mb-2">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input
                placeholder="Filter..."
                className="pl-7 h-6 text-[11px]"
                value={collectionSearch}
                onChange={(e) => setCollectionSearch(e.target.value)}
              />
            </div>
          )}

          <nav className="flex flex-col gap-0.5 overflow-y-auto scrollbar-thin flex-1">
            <button
              onClick={() => setActiveCollectionId(null)}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs transition-all text-left ${
                activeCollectionId === null
                  ? "bg-primary text-primary-foreground font-medium shadow-sm"
                  : "hover:bg-muted/80"
              }`}
            >
              <span>All items</span>
              <span
                className={`text-[10px] ${
                  activeCollectionId === null
                    ? "text-primary-foreground/70"
                    : "text-muted-foreground"
                }`}
              >
                {getCount(null)}
              </span>
            </button>

            {filteredCollections.map((col) => (
              <div
                key={col.id}
                className={`group flex items-center rounded-lg transition-all ${
                  activeCollectionId === col.id
                    ? "bg-primary text-primary-foreground font-medium shadow-sm"
                    : "hover:bg-muted/80"
                }`}
              >
                <button
                  onClick={() => setActiveCollectionId(col.id)}
                  className="flex-1 flex items-center justify-between px-3 py-2 text-xs text-left min-w-0"
                >
                  <span className="truncate flex items-center gap-1.5">
                    {(col.emoji || (col.is_system ? "🎁" : null)) && (
                      <span className="text-sm">{col.emoji || "🎁"}</span>
                    )}
                    {col.name}
                  </span>
                  <span
                    className={`text-[10px] shrink-0 ml-2 ${
                      activeCollectionId === col.id
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    }`}
                  >
                    {getCount(col.id)}
                  </span>
                </button>

                {isOwnWishlist && !col.is_system && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 mr-1 rounded hover:bg-black/10 ${
                          activeCollectionId === col.id ? "hover:bg-white/20" : ""
                        }`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-3 w-3" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuItem onClick={() => openEditCollection(col)}>
                        <Pencil className="h-3 w-3 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => openDeleteCollection(col)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-3 w-3 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ))}
          </nav>
        </aside>

        {/* Main content - scrollable */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Viewing friend's wishlist indicator */}
          {!isOwnWishlist && activeViewUser && (
            <div className="mb-3 px-3 py-2 rounded-lg bg-muted/50 border border-border/50">
              <p className="text-xs text-muted-foreground">
                Viewing <strong className="text-foreground">{activeViewUser.display_name}</strong>&apos;s wishlist
              </p>
            </div>
          )}

          {/* Event-Linked Collection Banner */}
          {linkedEvent && (
            <CollectionEventBanner
              event={linkedEvent}
              bannerUrl={activeCollection?.banner_url || linkedEvent.banner_url}
            />
          )}

          {/* Regular Collection Banner (when no event linked) */}
          {activeCollection?.banner_url && !linkedEvent && (
            <div className="relative h-32 -mx-4 mb-4 rounded-xl overflow-hidden">
              <img
                src={activeCollection.banner_url}
                alt=""
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
              <div className="absolute bottom-3 left-4 flex items-center gap-2">
                {activeCollection.emoji && (
                  <span className="text-2xl">{activeCollection.emoji}</span>
                )}
                <h1 className="text-xl font-semibold tracking-tight text-foreground drop-shadow-sm">
                  {activeCollection.name}
                </h1>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between gap-4 shrink-0">
            <div>
              {!activeCollection?.banner_url && !linkedEvent && (
                <h1 className="text-xl font-semibold tracking-tight">{activeLabel}</h1>
              )}
              <p className="text-muted-foreground mt-0.5 text-xs">
                {filteredItems.length} {filteredItems.length === 1 ? "item" : "items"}
              </p>
            </div>
            {isOwnWishlist && (
              <Button
                onClick={() => {
                  setEditingItem(null);
                  setAddItemOpen(true);
                }}
                className="shadow-sm"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add item
              </Button>
            )}
          </div>

          {/* Toolbar */}
          <div className="flex gap-2 mt-3 shrink-0">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* View toggle */}
            <div className="flex ring-1 ring-foreground/10 rounded-md overflow-hidden">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="icon"
                className="rounded-none h-7 w-7"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-3 w-3" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="icon"
                className="rounded-none h-7 w-7"
                onClick={() => setViewMode("list")}
              >
                <List className="h-3 w-3" />
              </Button>
            </div>

            {/* Sort */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="default" className="gap-1.5 shrink-0">
                  <ArrowUpDown className="h-3 w-3" />
                  <span className="hidden sm:inline text-xs">{sortLabels[sortBy]}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(Object.keys(sortLabels) as SortOption[]).map((key) => (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => setSortBy(key)}
                    className={sortBy === key ? "font-medium" : ""}
                  >
                    {sortLabels[key]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile collection picker */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-2 lg:hidden shrink-0 scrollbar-hide">
            <Button
              variant={activeCollectionId === null ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCollectionId(null)}
            >
              All ({getCount(null)})
            </Button>
            {collections.map((col) => (
              <Button
                key={col.id}
                variant={activeCollectionId === col.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCollectionId(col.id)}
                className="whitespace-nowrap"
              >
                {(col.emoji || (col.is_system ? "🎁" : null)) && (
                  <span className="mr-1">{col.emoji || "🎁"}</span>
                )}
                {col.name} ({getCount(col.id)})
              </Button>
            ))}
          </div>

          {/* Scrollable item area */}
          <div className="flex-1 overflow-y-auto mt-4 pr-1 scrollbar-thin">
            {isOwnWishlist ? (
              <ItemGrid
                items={filteredItems}
                variant="owner"
                viewMode={viewMode}
                loading={loading}
                onDelete={handleDeleteItem}
                onEdit={handleEditItem}
                onGiftedToggle={handleGiftedToggle}
                emptyMessage={
                  searchQuery
                    ? "No items match your search."
                    : activeCollectionId === null
                    ? "No items yet. Add your first one!"
                    : "No items in this collection."
                }
                emptyVariant={searchQuery ? "search" : "items"}
              />
            ) : (
              <ItemGrid
                items={filteredItems}
                variant="friend"
                viewMode={viewMode}
                currentUserId={currentUser?.id ?? ""}
                loading={loading}
                onClaimChange={() => fetchData(activeUserId)}
                emptyMessage={searchQuery ? "No items match your search." : "Nothing here yet."}
                emptyVariant={searchQuery ? "search" : "items"}
              />
            )}
          </div>
        </div>
      </div>

      {/* Mobile Profile Selector */}
      {currentUser && (
        <div className="fixed bottom-4 left-4 md:hidden z-40">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="shadow-lg bg-background">
                {activeViewUser?.display_name?.split(" ")[0] ?? "Wishlist"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setActiveUserId(currentUser.id)}>
                Your Wishlist
              </DropdownMenuItem>
              {friends.map((friend) => (
                <DropdownMenuItem key={friend.id} onClick={() => setActiveUserId(friend.id)}>
                  {friend.display_name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Dialogs */}
      <AddItemDialog
        open={addItemOpen}
        onOpenChange={(open) => {
          setAddItemOpen(open);
          if (!open) setEditingItem(null);
        }}
        collections={collections}
        defaultCollectionId={activeCollectionId ?? undefined}
        onItemAdded={() => fetchData(activeUserId)}
        editingItem={editingItem}
      />

      <NewCollectionDialog
        open={addCollectionOpen}
        onOpenChange={setAddCollectionOpen}
        onCreated={() => fetchData(activeUserId)}
      />

      <TemplatePicker
        open={templatePickerOpen}
        onOpenChange={setTemplatePickerOpen}
        onCreated={() => fetchData(activeUserId)}
      />

      {/* Edit collection dialog */}
      <Dialog
        open={editCollectionOpen}
        onOpenChange={(open) => {
          setEditCollectionOpen(open);
          if (!open) setEditingCollection(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit collection</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-2">
            {editingCollection && (
              <div className="flex flex-col gap-1.5">
                <Label>Banner Image</Label>
                <BannerUpload
                  currentUrl={editCollectionBanner}
                  entityType="collection"
                  entityId={editingCollection.id}
                  onUploaded={(url) => setEditCollectionBanner(url)}
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="editColName">Name & Icon</Label>
              <div className="flex gap-2">
                <EmojiPicker value={editCollectionEmoji} onChange={setEditCollectionEmoji} />
                <Input
                  id="editColName"
                  value={editCollectionName}
                  onChange={(e) => setEditCollectionName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveEditCollection()}
                  className="flex-1"
                />
              </div>
            </div>
            <Button
              onClick={handleSaveEditCollection}
              disabled={savingEditCollection || !editCollectionName.trim()}
            >
              {savingEditCollection ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete collection dialog */}
      <AlertDialog
        open={deleteCollectionOpen}
        onOpenChange={(open) => {
          setDeleteCollectionOpen(open);
          if (!open) setDeletingCollection(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{deletingCollection?.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              {exclusiveItems.length > 0 ? (
                <>
                  This collection has <strong>{exclusiveItems.length}</strong> item
                  {exclusiveItems.length !== 1 && "s"} that aren&apos;t in any other collection.
                </>
              ) : (
                <>Items in this collection will remain in &quot;All Items&quot;.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {exclusiveItems.length > 0 && (
            <div className="flex flex-col gap-2 my-1">
              <button
                onClick={() => setDeleteItemsToo(false)}
                className={`flex items-center gap-3 rounded-lg border-2 p-3 text-left text-xs transition-all ${
                  !deleteItemsToo
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-muted-foreground/20"
                }`}
              >
                <div
                  className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                    !deleteItemsToo ? "border-primary" : "border-muted-foreground/30"
                  }`}
                >
                  {!deleteItemsToo && <div className="h-2 w-2 rounded-full bg-primary" />}
                </div>
                <div>
                  <p className="font-medium">Keep items</p>
                  <p className="text-muted-foreground text-[11px]">
                    Items move to &quot;All Items&quot;
                  </p>
                </div>
              </button>
              <button
                onClick={() => setDeleteItemsToo(true)}
                className={`flex items-center gap-3 rounded-lg border-2 p-3 text-left text-xs transition-all ${
                  deleteItemsToo
                    ? "border-destructive bg-destructive/5"
                    : "border-muted hover:border-muted-foreground/20"
                }`}
              >
                <div
                  className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                    deleteItemsToo ? "border-destructive" : "border-muted-foreground/30"
                  }`}
                >
                  {deleteItemsToo && <div className="h-2 w-2 rounded-full bg-destructive" />}
                </div>
                <div>
                  <p className="font-medium text-destructive">Delete items too</p>
                  <p className="text-muted-foreground text-[11px]">
                    Permanently remove {exclusiveItems.length} item
                    {exclusiveItems.length !== 1 && "s"}
                  </p>
                </div>
              </button>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCollection} disabled={deletingCollectionLoading}>
              {deletingCollectionLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}