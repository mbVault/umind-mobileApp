import type { MoodKey } from "../storage/moodStorage";

export const MOOD_OPTIONS: { key: MoodKey; label: string; color: string; textOn: string }[] = [
  { key: "HEAVY", label: "Heavy", color: "#5B5F97", textOn: "#FFFFFF" },
  { key: "LOW", label: "Low", color: "#8FB8F5", textOn: "#1F1B3A" },
  { key: "OKAY", label: "Okay", color: "#B6A8FF", textOn: "#1F1B3A" },
  { key: "CALM", label: "Calm", color: "#3CCFA0", textOn: "#1F1B3A" },
  { key: "BRIGHT", label: "Bright", color: "#FFB938", textOn: "#1F1B3A" },
];
