export type User = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  friend_code: string;
  birthday: string | null;
  theme_mode: "light" | "dark";
  theme_color: "zinc" | "rose" | "blue" | "green" | "orange" | "violet";
  time_format: "12h" | "24h"; // NEW
  onboarded: boolean;
  created_at: string;
};

export type Item = {
  id: string;
  user_id: string;
  collection_ids: string[];
  name: string;
  price: number | null;
  image_url: string | null;
  link: string;
  is_claimed: boolean;
  claimed_by: string | null;
  gifted_at: string | null;
  created_at: string;
};

export type Collection = {
  id: string;
  user_id: string;
  name: string;
  emoji: string | null;
  banner_url: string | null; // NEW
  is_system: boolean;
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
  banner_url: string | null; // NEW
  created_at: string;
};

export type Friendship = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted";
  created_at: string;
};