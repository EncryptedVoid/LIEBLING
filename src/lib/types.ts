// These match your Supabase tables 1:1.
// Later you can auto-generate these with `supabase gen types typescript`
// and replace this file, but starting manually keeps things clear.

export type User = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  friend_code: string;
  created_at: string;
};

export type Item = {
  id: string;
  user_id: string;
  collection_id: string | null;
  name: string;
  price: number | null;
  image_url: string | null;
  link: string;
  is_claimed: boolean;
  claimed_by: string | null;
  created_at: string;
};

export type Collection = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
};

export type Event = {
  id: string;
  user_id: string;
  collection_id: string | null;
  title: string;
  description: string | null;
  date: string;
  time: string | null;
  location: string | null;
  created_at: string;
};

export type Friendship = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted";
  created_at: string;
};