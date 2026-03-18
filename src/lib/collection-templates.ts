export type TemplateItem = {
  name: string;
  placeholder_price?: number;
};

export type CollectionTemplate = {
  id: string;
  name: string;
  emoji: string;
  description: string;
  color: string;
  banner_url: string;
};

export const COLLECTION_TEMPLATES: CollectionTemplate[] = [
  {
    id: "birthday",
    name: "Birthday",
    emoji: "🎂",
    description: "Classic birthday wishlist essentials",
    color: "bg-pink-500",
    banner_url: "https://images.unsplash.com/photo-1558636508-e0db3814bd1d?w=800&h=400&fit=crop&q=80",
  },
  {
    id: "valentines",
    name: "Valentine's Day",
    emoji: "💝",
    description: "Romantic gift ideas for your partner",
    color: "bg-red-500",
    banner_url: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800&h=400&fit=crop&q=80",
  },
  {
    id: "christmas",
    name: "Christmas",
    emoji: "🎄",
    description: "Holiday season gift wishlist",
    color: "bg-green-600",
    banner_url: "https://images.unsplash.com/photo-1512389142860-9c449e58a814?w=800&h=400&fit=crop&q=80",
  },
  {
    id: "wedding",
    name: "Wedding Registry",
    emoji: "💒",
    description: "Essentials for starting a life together",
    color: "bg-amber-500",
    banner_url: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=400&fit=crop&q=80",
  },
  {
    id: "baby-shower",
    name: "Baby Shower",
    emoji: "🍼",
    description: "Must-haves for the new arrival",
    color: "bg-sky-400",
    banner_url: "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=800&h=400&fit=crop&q=80",
  },
  {
    id: "housewarming",
    name: "Housewarming",
    emoji: "🏠",
    description: "Gifts for a new home",
    color: "bg-orange-500",
    banner_url: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=400&fit=crop&q=80",
  },
  {
    id: "graduation",
    name: "Graduation",
    emoji: "🎓",
    description: "Celebrate their achievement",
    color: "bg-violet-500",
    banner_url: "https://images.unsplash.com/photo-1523050854058-8df90110c476?w=800&h=400&fit=crop&q=80",
  },
  {
    id: "back-to-school",
    name: "Back to School",
    emoji: "📚",
    description: "School supplies and essentials",
    color: "bg-blue-500",
    banner_url: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=400&fit=crop&q=80",
  },
  {
    id: "anniversary",
    name: "Anniversary",
    emoji: "🥂",
    description: "Celebrate another wonderful year together",
    color: "bg-rose-500",
    banner_url: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&h=400&fit=crop&q=80",
  },
  {
    id: "mothers-day",
    name: "Mother's Day",
    emoji: "💐",
    description: "Show appreciation for Mom with thoughtful gifts",
    color: "bg-fuchsia-500",
    banner_url: "https://images.unsplash.com/photo-1462275646964-a0e3c11f18a6?w=800&h=400&fit=crop&q=80",
  },
  {
    id: "fathers-day",
    name: "Father's Day",
    emoji: "👔",
    description: "Great gift ideas tailored for Dad",
    color: "bg-cyan-600",
    banner_url: "https://images.unsplash.com/photo-1517639493569-5666a7b2f494?w=800&h=400&fit=crop&q=80",
  },
];