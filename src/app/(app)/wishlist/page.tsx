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
import { ProfileCarousel } from "@/components/profile-carousel";
import { TemplatePicker } from "@/components/template-picker";
import { THEME_CSS } from "@/lib/theme-colors";
import { toast } from "sonner";

import type { Item, Collection, User } from "@/lib/types";

type SortOption = "newest" | "oldest" | "price-low" | "price-high" | "name";
type ViewMode = "grid" | "list";

export default function WishlistPage() {
  const supabase = createClient();

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
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

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
  const [deleteItemsToo, setDeleteItemsToo] = useState(false);

  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);

  const isOwnWishlist = activeUserId === currentUser?.id;

  // ── Apply friend's accent color ────────────────────────
  const activeViewUser = activeUserId === currentUser?.id
    ? currentUser
    : friends.find((f) => f.id === activeUserId);

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

  // ── Init ───────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;
      const { data: profile } = await supabase.from("users").select("*").eq("id", authUser.id).single();
      setCurrentUser(profile as User);
      setActiveUserId(authUser.id);
      const { data: friendships } = await supabase.from("friendships").select("requester_id, addressee_id").or(`requester_id.eq.${authUser.id},addressee_id.eq.${authUser.id}`).eq("status", "accepted");
      if (friendships && friendships.length > 0) {
        const friendIds = friendships.map((f) => f.requester_id === authUser.id ? f.addressee_id : f.requester_id);
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
    const [itemsRes, colsRes] = await Promise.all([
      supabase.from("items_visible").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("collections").select("*").eq("user_id", userId).order("name"),
    ]);
    setItems(itemsRes.data ?? []);
    setCollections(colsRes.data ?? []);
    setLoading(false);
  }

  // ── Derived ────────────────────────────────────────────
  const filteredCollections = useMemo(() => {
    if (!collectionSearch.trim()) return collections;
    const q = collectionSearch.toLowerCase();
    return collections.filter((c) => c.name.toLowerCase().includes(q));
  }, [collections, collectionSearch]);

  const filteredItems = useMemo(() => {
    let result = activeCollectionId === null ? items : items.filter((i) => i.collection_ids?.includes(activeCollectionId));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((i) => i.name.toLowerCase().includes(q) || i.link.toLowerCase().includes(q));
    }
    switch (sortBy) {
      case "newest": result = [...result].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); break;
      case "oldest": result = [...result].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()); break;
      case "price-low": result = [...result].sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity)); break;
      case "price-high": result = [...result].sort((a, b) => (b.price ?? 0) - (a.price ?? 0)); break;
      case "name": result = [...result].sort((a, b) => a.name.localeCompare(b.name)); break;
    }
    return result;
  }, [items, activeCollectionId, searchQuery, sortBy]);

  function getCount(colId: string | null): number {
    if (colId === null) return items.length;
    return items.filter((i) => i.collection_ids?.includes(colId)).length;
  }

  function handleDeleteItem(id: string) { setItems((prev) => prev.filter((item) => item.id !== id)); }
  function handleEditItem(item: Item) { setEditingItem(item); setAddItemOpen(true); }

  // ── Collection CRUD ────────────────────────────────────
  async function handleCreateCollection() {
    if (!newCollectionName.trim()) return;
    setSavingCollection(true);
    const { error } = await supabase.from("collections").insert({ user_id: currentUser!.id, name: newCollectionName.trim() });
    if (error) { toast.error("Couldn't create collection."); } else {
      toast.success(`"${newCollectionName.trim()}" created.`);
      setNewCollectionName("");
      setAddCollectionOpen(false);
      fetchData(activeUserId);
    }
    setSavingCollection(false);
  }

  function openEditCollection(col: Collection) { setEditingCollection(col); setEditCollectionName(col.name); setEditCollectionOpen(true); }

  async function handleSaveEditCollection() {
    if (!editCollectionName.trim() || !editingCollection) return;
    setSavingEditCollection(true);
    const { error } = await supabase.from("collections").update({ name: editCollectionName.trim() }).eq("id", editingCollection.id);
    if (error) { toast.error("Couldn't rename collection."); } else {
      toast.success("Collection renamed.");
      setEditCollectionOpen(false);
      setEditingCollection(null);
      fetchData(activeUserId);
    }
    setSavingEditCollection(false);
  }

  function openDeleteCollection(col: Collection) { setDeletingCollection(col); setDeleteItemsToo(false); setDeleteCollectionOpen(true); }

  async function handleDeleteCollection() {
    if (!deletingCollection) return;
    setDeletingCollectionLoading(true);

    if (deleteItemsToo) {
      // Delete items that are ONLY in this collection
      const itemsInCol = items.filter((i) => i.collection_ids?.includes(deletingCollection.id));
      const onlyInThis = itemsInCol.filter((i) => (i.collection_ids?.length ?? 0) <= 1);
      if (onlyInThis.length > 0) {
        await supabase.from("items").delete().in("id", onlyInThis.map((i) => i.id));
      }
    }

    const { error } = await supabase.from("collections").delete().eq("id", deletingCollection.id);
    if (error) { toast.error("Couldn't delete collection."); } else {
      toast.success(`"${deletingCollection.name}" deleted.`);
      if (activeCollectionId === deletingCollection.id) setActiveCollectionId(null);
      setDeleteCollectionOpen(false);
      setDeletingCollection(null);
      fetchData(activeUserId);
    }
    setDeletingCollectionLoading(false);
  }

  const activeLabel = activeCollectionId === null ? "All items" : collections.find((c) => c.id === activeCollectionId)?.name ?? "Collection";

  const sortLabels: Record<SortOption, string> = {
    newest: "Newest first", oldest: "Oldest first", "price-low": "Price: low → high", "price-high": "Price: high → low", name: "Name A-Z",
  };

  const itemsInDeletingCol = deletingCollection ? items.filter((i) => i.collection_ids?.includes(deletingCollection.id)) : [];
  const exclusiveItems = deletingCollection ? itemsInDeletingCol.filter((i) => (i.collection_ids?.length ?? 0) <= 1) : [];

  return (
    <div className="page-enter flex flex-col h-[calc(100vh-4rem)]">
      {/* ── Profile carousel ─────────────────────────── */}
      {currentUser && (
        <div className="shrink-0 py-4">
          <ProfileCarousel
            currentUser={currentUser}
            friends={friends}
            activeUserId={activeUserId}
            onSelect={(id) => setActiveUserId(id)}
          />
          {!isOwnWishlist && activeViewUser && (
            <p className="text-center text-xs text-muted-foreground mt-1">
              Viewing <strong>{activeViewUser.display_name}</strong>&apos;s wishlist
            </p>
          )}
        </div>
      )}

      {/* ── Main area (sidebar + content) ─────────────── */}
      <div className="flex gap-6 flex-1 min-h-0">
        {/* Sidebar */}
        <aside className="w-52 shrink-0 hidden md:flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Collections</h2>
            {isOwnWishlist && (
              <Button variant="ghost" size="icon-xs" onClick={() => setAddCollectionOpen(true)}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          {collections.length > 5 && (
            <div className="relative mb-2">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input placeholder="Filter..." className="pl-7 h-6 text-[11px]" value={collectionSearch} onChange={(e) => setCollectionSearch(e.target.value)} />
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
              <span className={`text-[10px] ${activeCollectionId === null ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
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
                  <span className={`text-[10px] shrink-0 ml-2 ${activeCollectionId === col.id ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {getCount(col.id)}
                  </span>
                </button>

                {isOwnWishlist && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 mr-1 rounded hover:bg-black/10 ${activeCollectionId === col.id ? "hover:bg-white/20" : ""}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-3 w-3" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuItem onClick={() => openEditCollection(col)}>
                        <Pencil className="h-3 w-3 mr-2" />Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openDeleteCollection(col)} className="text-destructive focus:text-destructive">
                        <Trash2 className="h-3 w-3 mr-2" />Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ))}
          </nav>
        </aside>

        {/* Main content — scrollable */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between gap-4 shrink-0">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">{activeLabel}</h1>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {filteredItems.length} {filteredItems.length === 1 ? "item" : "items"}
              </p>
            </div>
            {isOwnWishlist && (
              <Button onClick={() => { setEditingItem(null); setAddItemOpen(true); }} className="shadow-sm">
                <Plus className="h-3.5 w-3.5 mr-1.5" />Add item
              </Button>
            )}
          </div>

          {/* Toolbar */}
          <div className="flex gap-2 mt-3 shrink-0">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Search items..." className="pl-8" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
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
                  <DropdownMenuItem key={key} onClick={() => setSortBy(key)} className={sortBy === key ? "font-medium" : ""}>
                    {sortLabels[key]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile collection picker */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-2 md:hidden shrink-0 scrollbar-hide">
            <Button variant={activeCollectionId === null ? "default" : "outline"} size="sm" onClick={() => setActiveCollectionId(null)}>
              All ({getCount(null)})
            </Button>
            {collections.map((col) => (
              <Button key={col.id} variant={activeCollectionId === col.id ? "default" : "outline"} size="sm" onClick={() => setActiveCollectionId(col.id)} className="whitespace-nowrap">
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
                emptyMessage={searchQuery ? "No items match your search." : activeCollectionId === null ? "No items yet. Add your first one!" : "No items in this collection."}
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

      {/* ── Dialogs ─────────────────────────────────── */}
      <AddItemDialog
        open={addItemOpen}
        onOpenChange={(open) => { setAddItemOpen(open); if (!open) setEditingItem(null); }}
        collections={collections}
        defaultCollectionId={activeCollectionId ?? undefined}
        onItemAdded={() => fetchData(activeUserId)}
        editingItem={editingItem}
      />

      {/* New collection dialog */}
      <Dialog open={addCollectionOpen} onOpenChange={setAddCollectionOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>New collection</DialogTitle>
              <Button variant="ghost" size="icon-xs" onClick={() => { setTemplatePickerOpen(true); setAddCollectionOpen(false); }}>
                <Sparkles className="h-3.5 w-3.5" />
              </Button>
            </div>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-2">
            <Input
              placeholder="e.g. Kitchen, Books, Baby Stuff"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateCollection()}
            />
            <Button onClick={handleCreateCollection} disabled={savingCollection || !newCollectionName.trim()}>
              {savingCollection ? "Creating..." : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Template picker */}
      <TemplatePicker
        open={templatePickerOpen}
        onOpenChange={setTemplatePickerOpen}
        onCreated={() => fetchData(activeUserId)}
      />

      {/* Edit collection dialog */}
      <Dialog open={editCollectionOpen} onOpenChange={(open) => { setEditCollectionOpen(open); if (!open) setEditingCollection(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Rename collection</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="editColName">Name</Label>
              <Input id="editColName" value={editCollectionName} onChange={(e) => setEditCollectionName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSaveEditCollection()} />
            </div>
            <Button onClick={handleSaveEditCollection} disabled={savingEditCollection || !editCollectionName.trim()}>
              {savingEditCollection ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete collection dialog — with item deletion choice */}
      <AlertDialog open={deleteCollectionOpen} onOpenChange={(open) => { setDeleteCollectionOpen(open); if (!open) setDeletingCollection(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{deletingCollection?.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              {exclusiveItems.length > 0 ? (
                <>
                  This collection has <strong>{exclusiveItems.length}</strong> item{exclusiveItems.length !== 1 && "s"} that aren&apos;t in any other collection.
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
                  !deleteItemsToo ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/20"
                }`}
              >
                <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${!deleteItemsToo ? "border-primary" : "border-muted-foreground/30"}`}>
                  {!deleteItemsToo && <div className="h-2 w-2 rounded-full bg-primary" />}
                </div>
                <div>
                  <p className="font-medium">Keep items</p>
                  <p className="text-muted-foreground text-[11px]">Items move to &quot;All Items&quot;</p>
                </div>
              </button>
              <button
                onClick={() => setDeleteItemsToo(true)}
                className={`flex items-center gap-3 rounded-lg border-2 p-3 text-left text-xs transition-all ${
                  deleteItemsToo ? "border-destructive bg-destructive/5" : "border-muted hover:border-muted-foreground/20"
                }`}
              >
                <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${deleteItemsToo ? "border-destructive" : "border-muted-foreground/30"}`}>
                  {deleteItemsToo && <div className="h-2 w-2 rounded-full bg-destructive" />}
                </div>
                <div>
                  <p className="font-medium text-destructive">Delete items too</p>
                  <p className="text-muted-foreground text-[11px]">Permanently remove {exclusiveItems.length} item{exclusiveItems.length !== 1 && "s"}</p>
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