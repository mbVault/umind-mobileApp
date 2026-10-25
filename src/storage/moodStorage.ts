import AsyncStorage from "@react-native-async-storage/async-storage";

export type MoodKey = "HEAVY" | "LOW" | "OKAY" | "CALM" | "BRIGHT";

const keyForUser = (userId: string) => `umind_mood_${userId}`;

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function getTodayMood(userId: string): Promise<MoodKey | null> {
  const raw = await AsyncStorage.getItem(keyForUser(userId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { date: string; mood: MoodKey };
    if (parsed.date !== todayKey()) return null;
    return parsed.mood;
  } catch {
    return null;
  }
}

export async function setTodayMood(userId: string, mood: MoodKey): Promise<void> {
  await AsyncStorage.setItem(keyForUser(userId), JSON.stringify({ date: todayKey(), mood }));
}
