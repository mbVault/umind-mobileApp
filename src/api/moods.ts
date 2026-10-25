import { apiRequest } from "./client";

export type MoodDto = { id: string; name: string };

export type UserMoodDay = {
  date: string;
  mood: MoodDto | null;
  updatedAt?: string;
};

function todayYmd(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export { todayYmd };

export function listMoodCatalogue(accessToken: string): Promise<{ moods: MoodDto[] }> {
  return apiRequest("/moods/", { accessToken });
}

export function getMoodToday(accessToken: string, date = todayYmd()): Promise<UserMoodDay> {
  return apiRequest(`/moods/today?date=${encodeURIComponent(date)}`, { accessToken });
}

export function putMoodToday(
  accessToken: string,
  moodId: string,
  date = todayYmd(),
): Promise<UserMoodDay> {
  return apiRequest("/moods/today", {
    method: "PUT",
    accessToken,
    body: { date, moodId },
  });
}

export function getMoodHistory(
  accessToken: string,
  from: string,
  to: string,
): Promise<{ items: { date: string; mood: MoodDto }[] }> {
  return apiRequest(`/moods/history?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, {
    accessToken,
  });
}
