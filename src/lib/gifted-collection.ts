import type { SupabaseClient } from "@supabase/supabase-js";

export const GIFTED_COLLECTION_NAME = "Gifted/Received Items";
export const GIFTED_COLLECTION_EMOJI = "🎁";

/**
 * Gets or creates the system "Gifted" collection for a user.
 * This collection is auto-created once and can never be deleted or renamed.
 */
export async function getOrCreateGiftedCollection(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  // Check if it already exists
  const { data: existing } = await supabase
    .from("collections")
    .select("id")
    .eq("user_id", userId)
    .eq("is_system", true)
    .single();

  if (existing) return existing.id;

  // Create it
  const { data: created, error } = await supabase
    .from("collections")
    .insert({
      user_id: userId,
      name: GIFTED_COLLECTION_NAME,
      emoji: GIFTED_COLLECTION_EMOJI,
      is_system: true,
    })
    .select("id")
    .single();

  if (error) throw new Error("Couldn't create Gifted collection.");
  return created.id;
}