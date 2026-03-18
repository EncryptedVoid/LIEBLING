export type UpdateStatus = "completed" | "in-progress" | "upcoming";

export type UpcomingUpdate = {
  id: string;
  title: string;
  description: string;
  status: UpdateStatus;
  link?: string;
};

export const UPCOMING_UPDATES: UpcomingUpdate[] = [
  {
    id: "dynamic-themes",
    title: "Dynamic Theme Gradients",
    description: "All gradients and glows now adapt to your chosen accent color.",
    status: "completed",
  },
  {
    id: "auto-logout",
    title: "Auto Logout on Inactivity",
    description: "Sessions automatically end after 5 minutes of inactivity for security.",
    status: "completed",
  },
  {
    id: "gifts-modal-redesign",
    title: "Gifts to Buy Redesign",
    description: "Browse gifts by person or by event with countdown timers.",
    status: "completed",
  },
  {
    id: "activities",
    title: "Secret Santa & Gift Roulette",
    description: "Create activities, invite friends, and get matched for gift exchanges.",
    status: "in-progress",
  },
  {
    id: "wedding-blueprint",
    title: "Wedding Blueprint",
    description: "A step-by-step wizard to set up your wedding event and registry.",
    status: "in-progress",
  },
  {
    id: "potluck",
    title: "Potluck Activities",
    description: "Organize potlucks where friends sign up to bring dishes or buy items.",
    status: "upcoming",
  },
  {
    id: "baby-shower-blueprint",
    title: "Baby Shower Blueprint",
    description: "A wizard to create baby shower events with full registries.",
    status: "upcoming",
  },
  {
    id: "bbq-event",
    title: "BBQ / Communal Eating Events",
    description: "A potluck variant focused on BBQs — coordinate food, drinks, and supplies like cutlery.",
    status: "upcoming",
  },
  {
    id: "activity-sidebar-badges",
    title: "Activity Badges on Wishlists",
    description: "See your Secret Santa or Gift Roulette match directly in the wishlist sidebar.",
    status: "upcoming",
  },
  {
    id: "features-page",
    title: "Features Showcase Page",
    description: "A dedicated page highlighting all features of Lieblings.",
    status: "upcoming",
  },
];