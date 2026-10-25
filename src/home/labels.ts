import { LIFE_STAGE_OPTIONS } from "../onboarding/lifeStageOptions";

const FEELING_LABELS: Record<string, string> = {
  STRESSED: "Stress & work",
  ANXIOUS: "Anxiety / ghabrahat",
  GHABRAHAT: "Ghabrahat",
  LOW: "Low",
  CANT_SLEEP: "Sleep",
  LONELY: "Loneliness",
};

const CHECK_IN_LABELS: Record<string, string> = {
  MORNING: "Check-ins: Morning",
  AFTERNOON: "Check-ins: Afternoon",
  EVENING: "Check-ins: Evening",
  BEFORE_BED: "Check-ins: Before bed",
  ONLY_WHEN_I_OPEN: "Check-ins: When I open",
};

export function feelingChipLabel(code: string): string {
  return FEELING_LABELS[code] ?? code;
}

export function checkInChipLabel(code: string): string {
  return CHECK_IN_LABELS[code] ?? code;
}

export function lifeStageForYouLabel(lifeStage: string): string {
  const opt = LIFE_STAGE_OPTIONS.find((o) => o.key === lifeStage);
  if (!opt) return "For you";
  return `For you · ${opt.title}, ${opt.range}`;
}

export function greetingForNow(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
