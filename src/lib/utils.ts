import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// Add this helper function to src/lib/utils.ts or use inline in wishlist/page.tsx

import type { Collection } from "@/lib/types";

/**
 * Sorts collections so that:
 * 1. "Gifted" (is_system=true) comes first
 * 2. All other collections follow in alphabetical order
 */
export function sortCollections(collections: Collection[]): Collection[] {
  return [...collections].sort((a, b) => {
    // System collections (Gifted) come first
    if (a.is_system && !b.is_system) return -1;
    if (!a.is_system && b.is_system) return 1;
    // Then sort alphabetically
    return a.name.localeCompare(b.name);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// In the wishlist page, update the filteredCollections useMemo:
// ─────────────────────────────────────────────────────────────────────────────

// BEFORE:
// const filteredCollections = useMemo(() => {
//   if (!collectionSearch.trim()) return collections;
//   const q = collectionSearch.toLowerCase();
//   return collections.filter((c) => c.name.toLowerCase().includes(q));
// }, [collections, collectionSearch]);

// AFTER:

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
