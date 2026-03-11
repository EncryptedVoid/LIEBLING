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
  SlidersHorizontal,
  Sparkles
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
import { ProfileCarousel } from "@/components/profile-carousel";
import { toast } from "sonner";

import type { Item, Collection, User } from "@/lib/types";
import { TemplatePicker } from "@/components/template-picker";

// In the component:
type SortOption = "newest" | "oldest" | "price-low" | "price-high" | "name";

export default function WishlistPage() {
  const supabase = createClient();

  // ── State ──────────────────────────────────────────────
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [friends, setFriends] = useState<User[]>([]);
  const [activeUserId, setActiveUserId] = useState<string>("");

  const [items, setItems] = useState<Item[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [collectionSearch, setCollectionSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  const [addItemOpen, setAddItemOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  const [addCollectionOpen, setAddCollectionOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [savingCollection, setSavingCollection] = useState(false);

  const [editCollectionOpen, setEditCollectionOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [editCollectionName, setEditCollectionName] = useState("");
  const [savingEditCollection, setSavingEditCollection] = useState(false);

  const [deleteCollectionOpen, setDeleteCollectionOpen] = useState(false);
  const [deletingCollection, setDeletingCollection] = useState<Collection | null>(null);
  const [deletingCollectionLoading, setDeletingCollectionLoading] = useState(false);

  const isOwnWishlist = activeUserId === currentUser?.id;

  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);

  // ── Initial fetch: user + friends ──────────────────────
  useEffect(() => {
    async function init() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) return;

      // Get own profile
      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();
      setCurrentUser(profile as User);
      setActiveUserId(authUser.id);

      // Get accepted friends
      const { data: friendships } = await supabase
        .from("friendships")
        .select("requester_id, addressee_id")
        .or(`requester_id.eq.${authUser.id},addressee_id.eq.${authUser.id}`)
        .eq("status", "accepted");

      if (friendships && friendships.length > 0) {
        const friendIds = friendships.map((f) =>
          f.requester_id === authUser.id ? f.addressee_id : f.requester_id
        );
        const { data: friendProfiles } = await supabase
          .from("users")
          .select("*")
          .in("id", friendIds);
        setFriends((friendProfiles as User[]) ?? []);
      }
    }
    init();
  }, []);

  // ── Fetch items + collections when activeUserId changes ─
  useEffect(() => {
    if (!activeUserId) return;
    fetchData(activeUserId);
  }, [activeUserId]);

  async function fetchData(userId: string) {
    setLoading(true);
    setActiveCollectionId(null);
    setSearchQuery("");

    const [itemsRes, colsRes] = await Promise.all([
      supabase
        .from("items_visible")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("collections")
        .select("*")
        .eq("user_id", userId)
        .order("name"),
    ]);

    setItems(itemsRes.data ?? []);
    setCollections(colsRes.data ?? []);
    setLoading(false);
  }

  // ── Derived data ───────────────────────────────────────
  const filteredCollections = useMemo(() => {
    if (!collectionSearch.trim()) return collections;
    const q = collectionSearch.toLowerCase();
    return collections.filter((c) => c.name.toLowerCase().includes(q));
  }, [collections, collectionSearch]);

  const filteredItems = useMemo(() => {
    let result =
      activeCollectionId === null
        ? items
        : items.filter((i) => i.collection_ids?.includes(activeCollectionId));

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.link.toLowerCase().includes(q)
      );
    }

    // Sort
    switch (sortBy) {
      case "newest":
        result = [...result].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
      case "oldest":
        result = [...result].sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        break;
      case "price-low":
        result = [...result].sort(
          (a, b) => (a.price ?? Infinity) - (b.price ?? Infinity)
        );
        break;
      case "price-high":
        result = [...result].sort(
          (a, b) => (b.price ?? 0) - (a.price ?? 0)
        );
        break;
      case "name":
        result = [...result].sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return result;
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

  // ── Collection CRUD ────────────────────────────────────
  async function handleCreateCollection() {
    if (!newCollectionName.trim()) return;
    setSavingCollection(true);

    const { error } = await supabase
      .from("collections")
      .insert({ user_id: currentUser!.id, name: newCollectionName.trim() });

    if (error) {
      toast.error("Couldn't create collection.");
    } else {
      toast.success(`"${newCollectionName.trim()}" created.`);
      setNewCollectionName("");
      setAddCollectionOpen(false);
      fetchData(activeUserId);
    }
    setSavingCollection(false);
  }

  function openEditCollection(col: Collection) {
    setEditingCollection(col);
    setEditCollectionName(col.name);
    setEditCollectionOpen(true);
  }

  async function handleSaveEditCollection() {
    if (!editCollectionName.trim() || !editingCollection) return;
    setSavingEditCollection(true);

    const { error } = await supabase
      .from("collections")
      .update({ name: editCollectionName.trim() })
      .eq("id", editingCollection.id);

    if (error) {
      toast.error("Couldn't rename collection.");
    } else {
      toast.success("Collection renamed.");
      setEditCollectionOpen(false);
      setEditingCollection(null);
      fetchData(activeUserId);
    }
    setSavingEditCollection(false);
  }

  function openDeleteCollection(col: Collection) {
    setDeletingCollection(col);
    setDeleteCollectionOpen(true);
  }

  async function handleDeleteCollection() {
    if (!deletingCollection) return;
    setDeletingCollectionLoading(true);

    const { error } = await supabase
      .from("collections")
      .delete()
      .eq("id", deletingCollection.id);

    if (error) {
      toast.error("Couldn't delete collection.");
    } else {
      toast.success(`"${deletingCollection.name}" deleted.`);
      if (activeCollectionId === deletingCollection.id)
        setActiveCollectionId(null);
      setDeleteCollectionOpen(false);
      setDeletingCollection(null);
      fetchData(activeUserId);
    }
    setDeletingCollectionLoading(false);
  }

  const activeLabel =
    activeCollectionId === null
      ? "All items"
      : collections.find((c) => c.id === activeCollectionId)?.name ??
        "Collection";

  const activeViewUser =
    activeUserId === currentUser?.id
      ? currentUser
      : friends.find((f) => f.id === activeUserId);

  const sortLabels: Record<SortOption, string> = {
    newest: "Newest first",
    oldest: "Oldest first",
    "price-low": "Price: low to high",
    "price-high": "Price: high to low",
    name: "Name A-Z",
  };

  return (
    <div>
      {/* ── Profile carousel ─────────────────────────── */}
      {currentUser && (
        <div className="mb-6 -mx-4 px-4 py-3 bg-muted/30 rounded-xl border border-border/50">
          <ProfileCarousel
            currentUser={currentUser}
            friends={friends}
            activeUserId={activeUserId}
            onSelect={(id) => setActiveUserId(id)}
          />
          {!isOwnWishlist && activeViewUser && (
            <p className="text-center text-xs text-muted-foreground mt-2">
              Viewing <strong>{activeViewUser.display_name}</strong>&apos;s
              wishlist
            </p>
          )}
        </div>
      )}

      <div className="flex gap-8">
        {/* ── Sidebar ─────────────────────────────────── */}
        <aside className="w-56 shrink-0 hidden md:block">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Collections
            </h2>
            {isOwnWishlist && (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setAddCollectionOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          {/* Collection search */}
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

          <nav className="flex flex-col gap-0.5">
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
                  <span className="truncate">{col.name}</span>
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

                {isOwnWishlist && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 mr-1 rounded hover:bg-black/10 ${
                          activeCollectionId === col.id
                            ? "hover:bg-white/20"
                            : ""
                        }`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-3 w-3" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuItem
                        onClick={() => openEditCollection(col)}
                      >
                        <Pencil className="h-3 w-3 mr-2" />
                        Rename
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

        {/* ── Main content ────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {activeLabel}
              </h1>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {filteredItems.length}{" "}
                {filteredItems.length === 1 ? "item" : "items"}
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

          {/* Search + Sort bar */}
          <div className="flex gap-2 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="default" className="gap-1.5 shrink-0">
                  <ArrowUpDown className="h-3 w-3" />
                  <span className="hidden sm:inline text-xs">
                    {sortLabels[sortBy]}
                  </span>
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
          <div className="flex gap-2 mt-3 overflow-x-auto pb-2 md:hidden">
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
                {col.name} ({getCount(col.id)})
              </Button>
            ))}
          </div>

          {/* Items grid */}
          <div className="mt-5">
            {isOwnWishlist ? (
              <ItemGrid
                items={filteredItems}
                variant="owner"
                loading={loading}
                onDelete={handleDeleteItem}
                onEdit={handleEditItem}
                emptyMessage={
                  searchQuery
                    ? "No items match your search."
                    : activeCollectionId === null
                      ? "No items yet. Add your first one!"
                      : "No items in this collection."
                }
              />
            ) : (
              <ItemGrid
                items={filteredItems}
                variant="friend"
                currentUserId={currentUser?.id ?? ""}
                loading={loading}
                onClaimChange={() => fetchData(activeUserId)}
                emptyMessage={
                  searchQuery
                    ? "No items match your search."
                    : "Nothing here yet."
                }
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Dialogs ─────────────────────────────────── */}
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

      <Dialog open={addCollectionOpen} onOpenChange={setAddCollectionOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New collection</DialogTitle>
            <Button variant="ghost" size="icon-xs" onClick={() => setTemplatePickerOpen(true)}>
              <Sparkles className="h-3.5 w-3.5" />
            </Button>

            <TemplatePicker
              open={templatePickerOpen}
              onOpenChange={setTemplatePickerOpen}
              onCreated={() => fetchData(activeUserId)}
            />
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-2">
            <Input
              placeholder="e.g. Kitchen, Books, Baby Stuff"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateCollection()}
            />
            <Button
              onClick={handleCreateCollection}
              disabled={savingCollection || !newCollectionName.trim()}
            >
              {savingCollection ? "Creating..." : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editCollectionOpen}
        onOpenChange={(open) => {
          setEditCollectionOpen(open);
          if (!open) setEditingCollection(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename collection</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="editColName">Name</Label>
              <Input
                id="editColName"
                value={editCollectionName}
                onChange={(e) => setEditCollectionName(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && handleSaveEditCollection()
                }
              />
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

      <AlertDialog
        open={deleteCollectionOpen}
        onOpenChange={(open) => {
          setDeleteCollectionOpen(open);
          if (!open) setDeletingCollection(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete &quot;{deletingCollection?.name}&quot;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Items won&apos;t be deleted — they just won&apos;t be in this
              collection anymore.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCollection}
              disabled={deletingCollectionLoading}
            >
              {deletingCollectionLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}