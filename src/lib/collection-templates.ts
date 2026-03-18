// ═══════════════════════════════════════════════════════
// COLLECTION TEMPLATES
// Add new templates by appending to the array.
// Each template produces a collection with pre-filled items.
// ═══════════════════════════════════════════════════════

export type TemplateItem = {
  name: string;
  placeholder_price?: number;
};

export type CollectionTemplate = {
  id: string;
  name: string;
  emoji: string;
  description: string;
  color: string; // tailwind bg class for the card accent
  items: TemplateItem[];
};

export const COLLECTION_TEMPLATES: CollectionTemplate[] = [
  {
    id: "birthday",
    name: "Birthday",
    emoji: "🎂",
    description: "Classic birthday wishlist essentials",
    color: "bg-pink-500",
    items: [
      { name: "Birthday outfit" },
      { name: "Perfume / Cologne" },
      { name: "Gift card" },
      { name: "Jewelry" },
      { name: "Experience / tickets" },
      { name: "Tech gadget" },
      { name: "Book" },
      { name: "Candle set" },
    ],
  },
  {
    id: "valentines",
    name: "Valentine's Day",
    emoji: "💝",
    description: "Romantic gift ideas for your partner",
    color: "bg-red-500",
    items: [
      { name: "Flowers / bouquet" },
      { name: "Chocolate box" },
      { name: "Jewelry" },
      { name: "Matching pajamas" },
      { name: "Spa day" },
      { name: "Love letter kit" },
      { name: "Date night experience" },
      { name: "Photo album" },
    ],
  },
  {
    id: "christmas",
    name: "Christmas",
    emoji: "🎄",
    description: "Holiday season gift wishlist",
    color: "bg-green-600",
    items: [
      { name: "Cozy sweater" },
      { name: "Board game" },
      { name: "Skincare set" },
      { name: "Smart home gadget" },
      { name: "Cookbook" },
      { name: "Warm blanket" },
      { name: "Subscription box" },
      { name: "Stocking stuffers" },
    ],
  },
  {
    id: "wedding",
    name: "Wedding Registry",
    emoji: "💒",
    description: "Essentials for starting a life together",
    color: "bg-amber-500",
    items: [
      { name: "Dinnerware set" },
      { name: "Bedding set" },
      { name: "Kitchen appliance" },
      { name: "Luggage set" },
      { name: "Art / wall decor" },
      { name: "Towel set" },
      { name: "Honeymoon fund contribution" },
      { name: "Coffee maker" },
    ],
  },
  {
    id: "baby-shower",
    name: "Baby Shower",
    emoji: "🍼",
    description: "Must-haves for the new arrival",
    color: "bg-sky-400",
    items: [
      { name: "Diapers (various sizes)" },
      { name: "Baby monitor" },
      { name: "Stroller" },
      { name: "Car seat" },
      { name: "Baby clothes (0-3 months)" },
      { name: "Swaddle blankets" },
      { name: "Nursery decor" },
      { name: "Baby bath set" },
    ],
  },
  {
    id: "housewarming",
    name: "Housewarming",
    emoji: "🏠",
    description: "Gifts for a new home",
    color: "bg-orange-500",
    items: [
      { name: "Candles" },
      { name: "Indoor plant" },
      { name: "Kitchen tools" },
      { name: "Welcome mat" },
      { name: "Picture frames" },
      { name: "Throw pillows" },
      { name: "Wine / spirits" },
      { name: "Storage baskets" },
    ],
  },
  {
    id: "graduation",
    name: "Graduation",
    emoji: "🎓",
    description: "Celebrate their achievement",
    color: "bg-violet-500",
    items: [
      { name: "Professional bag / briefcase" },
      { name: "Watch" },
      { name: "Book (career / self-help)" },
      { name: "Gift card" },
      { name: "Desk organizer" },
      { name: "Personalized pen" },
      { name: "Travel voucher" },
      { name: "Tech accessory" },
    ],
  },
  {
    id: "back-to-school",
    name: "Back to School",
    emoji: "📚",
    description: "School supplies and essentials",
    color: "bg-blue-500",
    items: [
      { name: "Backpack" },
      { name: "Laptop / tablet" },
      { name: "Stationery set" },
      { name: "Water bottle" },
      { name: "Lunch box" },
      { name: "Headphones" },
      { name: "Planner / agenda" },
      { name: "Desk lamp" },
    ],
  },
  {
    id: "anniversary",
    name: "Anniversary",
    emoji: "🥂",
    description: "Celebrate another wonderful year together",
    color: "bg-rose-500",
    items: [
      { name: "Dinner reservation contribution" },
      { name: "Couples massage" },
      { name: "Engraved jewelry" },
      { name: "Photo book / album" },
      { name: "Weekend getaway fund" },
      { name: "Fine wine / champagne" },
      { name: "Specialized cooking class" },
      { name: "Custom illustration" },
    ],
  },
  {
    id: "mothers-day",
    name: "Mother's Day",
    emoji: "💐",
    description: "Show appreciation for Mom with thoughtful gifts",
    color: "bg-fuchsia-500",
    items: [
      { name: "Spa gift card" },
      { name: "Personalized necklace" },
      { name: "Flower subscription" },
      { name: "Luxury candle / diffuser" },
      { name: "Comfortable robe" },
      { name: "Gourmet tea set" },
      { name: "Digital photo frame" },
      { name: "Silk pillowcase" },
    ],
  },
  {
    id: "fathers-day",
    name: "Father's Day",
    emoji: "👔",
    description: "Great gift ideas tailored for Dad",
    color: "bg-cyan-600",
    items: [
      { name: "BBQ tool set" },
      { name: "Gourmet coffee / espresso beans" },
      { name: "Smartwatch accessory" },
      { name: "Outdoor gear" },
      { name: "Wallet / cardholder" },
      { name: "Premium shaving kit" },
      { name: "DIY or tool kit" },
      { name: "Whiskey stones / glasses" },
    ],
  },
];