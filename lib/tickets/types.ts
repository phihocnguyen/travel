export const TICKET_LAYOUTS = ["left", "right", "full"] as const;

export type TicketLayout = (typeof TICKET_LAYOUTS)[number];

export type TicketTheme = {
  background: string;
  ink: string;
  accent: string;
};

export type TicketSticker = {
  id: string;
  emoji: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
};

export type TicketImage = {
  url: string | null;
  scale: number;
  x: number;
  y: number;
};

export type TicketDesign = {
  id: string;
  title: string;
  from: string;
  to: string;
  message: string;
  layout: TicketLayout;
  theme: TicketTheme;
  stickers: TicketSticker[];
  image: TicketImage;
  createdAt: string;
  updatedAt: string;
};

export type TicketInput = {
  title: string;
  from: string;
  to: string;
  message: string;
  layout: TicketLayout;
  theme: TicketTheme;
  stickers: TicketSticker[];
  image: {
    scale: number;
    x: number;
    y: number;
  };
  imageDataUrl?: string | null;
  removeImage?: boolean;
};

export const THEME_PRESETS: {
  id: string;
  label: string;
  theme: TicketTheme;
}[] = [
  {
    id: "forest",
    label: "Rừng tràm",
    theme: { background: "#f7f1e1", ink: "#1d3a2a", accent: "#2f7d4f" },
  },
  {
    id: "mango",
    label: "Xoài chín",
    theme: { background: "#fdf3dc", ink: "#4a2f13", accent: "#d98a1f" },
  },
  {
    id: "river",
    label: "Sông Hậu",
    theme: { background: "#eef4f1", ink: "#143a45", accent: "#2b7a8c" },
  },
  {
    id: "lotus",
    label: "Sen hồng",
    theme: { background: "#fbeaf0", ink: "#46202f", accent: "#b4456c" },
  },
  {
    id: "night",
    label: "Mực đêm",
    theme: { background: "#14231d", ink: "#f4eeda", accent: "#a8c17c" },
  },
];

export const STICKER_CHOICES = [
  "🌴",
  "🛶",
  "🥭",
  "🌾",
  "☀️",
  "🐟",
  "🪷",
  "📍",
  "✈️",
  "❤️",
  "🏞️",
  "🧭",
] as const;
