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
    id: "easter",
    name: "Easter",
    emoji: "🐣",
    description: "Spring treats and surprises",
    color: "bg-yellow-400",
    banner_url: "https://images.unsplash.com/photo-1521967906867-14ec9d64bee8?w=800&h=400&fit=crop&q=80",
  },
  {
    id: "mothers-day",
    name: "Mother's Day",
    emoji: "💐",
    description: "Show appreciation for Mom",
    color: "bg-fuchsia-500",
    banner_url: "https://images.unsplash.com/photo-1490750967868-88aa4f44baee?w=800&h=400&fit=crop&q=80",
  },
  {
    id: "fathers-day",
    name: "Father's Day",
    emoji: "👔",
    description: "Great gift ideas tailored for Dad",
    color: "bg-cyan-600",
    banner_url: "https://images.unsplash.com/photo-1542652694-40abf526446e?w=800&h=400&fit=crop&q=80",
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
    id: "halloween",
    name: "Halloween",
    emoji: "🎃",
    description: "Spooky season costumes and decor",
    color: "bg-orange-500",
    banner_url: "https://images.unsplash.com/photo-1509557965875-b88c97052f0e?w=800&h=400&fit=crop&q=80",
  },
  {
    id: "thanksgiving",
    name: "Thanksgiving",
    emoji: "🦃",
    description: "Cozy gifts for the gratitude season",
    color: "bg-amber-600",
    banner_url: "https://images.unsplash.com/photo-1474564862106-1f23d10b9d72?w=800&h=400&fit=crop&q=80",
  },
  {
    id: "anniversary",
    name: "Anniversary",
    emoji: "🥂",
    description: "Celebrate another wonderful year together",
    color: "bg-rose-500",
    banner_url: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&h=400&fit=crop&q=80",
  },
  {
    id: "new-year",
    name: "New Year",
    emoji: "🎆",
    description: "Fresh start gifts and resolutions",
    color: "bg-violet-500",
    banner_url: "https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=800&h=400&fit=crop&q=80",
  },
];