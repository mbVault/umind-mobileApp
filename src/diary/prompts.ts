export const DIARY_PROMPTS = [
  "What felt heavy today — and what felt light?",
  "What do you wish someone had asked you today?",
  "Where did your body feel tension — and where did it soften?",
  "What are you carrying that isn’t yours to hold alone?",
  "One kind thing you can offer yourself tomorrow morning?",
] as const;

export function pickPrompt(index = 0): string {
  return DIARY_PROMPTS[index % DIARY_PROMPTS.length]!;
}
