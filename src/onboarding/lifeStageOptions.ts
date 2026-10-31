import { colors } from "../theme";
import { LIFE_STAGE_META } from "./catalog";
import type { LifeStageKey } from "./types";

const ACCENTS: Record<LifeStageKey, { accent: string; tint: string; description: string }> = {
  GROWING_UP: { accent: "#E0452F", tint: colors.coralTint, description: "Exams, friends, body changes" },
  STARTING_OUT: {
    accent: colors.primary,
    tint: colors.primaryTint,
    description: "Career, relationships, living alone",
  },
  BUILDING: { accent: "#0B8A5F", tint: colors.mintTint, description: "Work stress, parenting, burnout" },
  SHIFTING: { accent: "#1971C2", tint: "#DDEEFF", description: "Midlife, caring for others, change" },
  WISDOM_YEARS: { accent: "#B07600", tint: colors.sunTint, description: "Retirement, health, legacy" },
};

export const LIFE_STAGE_OPTIONS = LIFE_STAGE_META.map((m) => ({
  key: m.id,
  range: m.range,
  title: m.label,
  description: ACCENTS[m.id].description,
  accent: ACCENTS[m.id].accent,
  tint: ACCENTS[m.id].tint,
}));
