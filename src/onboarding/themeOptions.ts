import type { AppThemeKey } from "./types";

export const THEME_OPTIONS: {
  key: AppThemeKey;
  label: string;
  swatches: [string, string];
  cardTint: string;
}[] = [
  { key: "LAVENDER", label: "Lavender", swatches: ["#B6A8FF", "#5B45E0"], cardTint: "#ECE8FF" },
  { key: "OCEAN", label: "Ocean", swatches: ["#8FB8F5", "#1971C2"], cardTint: "#DDEEFF" },
  { key: "FOREST", label: "Forest", swatches: ["#3CCFA0", "#0B8A5F"], cardTint: "#D9F5EA" },
  { key: "SUNSET", label: "Sunset", swatches: ["#FFB938", "#D9480F"], cardTint: "#FFEFD0" },
  { key: "ROSE", label: "Rose", swatches: ["#FF8A73", "#C2255C"], cardTint: "#FFE1DB" },
];

export const CITY_SUGGESTIONS = [
  "Delhi",
  "Gurugram",
  "Mumbai",
  "Bengaluru",
  "Pune",
  "Hyderabad",
  "Chennai",
  "Kolkata",
  "Jaipur",
  "Lucknow",
  "Chandigarh",
] as const;
