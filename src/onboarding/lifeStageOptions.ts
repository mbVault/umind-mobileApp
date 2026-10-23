import { colors } from "../theme";
import type { LifeStageKey } from "./types";

export const LIFE_STAGE_OPTIONS: {
  key: LifeStageKey;
  range: string;
  title: string;
  description: string;
  accent: string;
  tint: string;
}[] = [
  { key: "GROWING_UP", range: "12–19", title: "Growing up", description: "Exams, friends, body changes", accent: "#E0452F", tint: colors.coralTint },
  { key: "STARTING_OUT", range: "20–30", title: "Starting out", description: "Career, relationships, living alone", accent: colors.primary, tint: colors.primaryTint },
  { key: "BUILDING", range: "30–45", title: "Building", description: "Work stress, parenting, burnout", accent: "#0B8A5F", tint: colors.mintTint },
  { key: "SHIFTING", range: "45–60", title: "Shifting", description: "Midlife, caring for others, change", accent: "#1971C2", tint: "#DDEEFF" },
  { key: "WISDOM_YEARS", range: "60+", title: "Wisdom years", description: "Retirement, health, legacy", accent: "#B07600", tint: colors.sunTint },
];
