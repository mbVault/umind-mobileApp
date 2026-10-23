const POOL = [
  "Neela",
  "Megh",
  "Raahi",
  "Tara",
  "Kavi",
  "Ira",
  "Anay",
  "Diya",
  "Rohan",
  "Sana",
  "Vivaan",
  "Zoya",
  "Arjun",
  "Priya",
  "Dev",
  "Mira",
  "Kabir",
  "Lila",
  "Noor",
  "Reyansh",
] as const;

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const MOCK_CHIP_ROW = ["Neela", "Megh", "Raahi", "Tara", "Kavi"] as const;

/** Five name chips — mock order first, then shuffle on refresh. */
export function pickAliasSuggestions(exclude?: string, fresh = false): string[] {
  if (!fresh) {
    return [...MOCK_CHIP_ROW];
  }
  const filtered = POOL.filter((name) => name.toLowerCase() !== exclude?.trim().toLowerCase());
  return shuffle(filtered).slice(0, 5);
}

export const DEFAULT_ALIAS = "Neela";
