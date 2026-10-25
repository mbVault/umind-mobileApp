export const DIARY_CAUSES = [
  "Work",
  "Sleep",
  "Family",
  "Friends",
  "Body",
  "Periods",
  "Money",
] as const;

export type DiaryCause = (typeof DIARY_CAUSES)[number];
