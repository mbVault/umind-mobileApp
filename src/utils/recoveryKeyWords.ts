/** Curated lowercase word pool (BIP-39-style friendly words; not the full BIP-39 list). */
const WORD_POOL = [
  "river", "mango", "lantern", "quiet", "cedar", "monsoon", "pebble", "tulsi", "harbour", "velvet",
  "sparrow", "dawn", "cloud", "ember", "forest", "garden", "honey", "indigo", "jasmine", "kite",
  "lotus", "meadow", "neem", "ocean", "prairie", "quartz", "rain", "saffron", "thistle", "umbra",
  "valley", "willow", "yarrow", "zenith", "anchor", "breeze", "coral", "delta", "falcon", "glade",
  "harvest", "island", "journey", "kindle", "lunar", "mirror", "north", "olive", "pulse", "ripple",
  "stone", "timber", "union", "violet", "wander", "yoga", "amber", "brook", "canyon", "dusk",
] as const;

export function generateRecoveryKeyWords(): string[] {
  const pool = [...WORD_POOL];
  const words: string[] = [];
  while (words.length < 12 && pool.length > 0) {
    const i = Math.floor(Math.random() * pool.length);
    words.push(pool.splice(i, 1)[0]);
  }
  return words;
}

export function formatRecoveryKey(words: string[]): string {
  return words.map((w) => w.trim().toLowerCase()).join(" ");
}
