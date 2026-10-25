import { apiRequest } from "./client";

export type AudioAccessTier = "FREE" | "TRIAL" | "SUBSCRIPTION";

export type AudioListItem = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  accessTier?: AudioAccessTier;
  durationSeconds: number | null;
  language: string;
};

export type AudioTrackDetail = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  durationSeconds: number | null;
  languages: { language: string; durationSeconds: number | null }[];
};

export function listAudioTracks(
  accessToken: string,
  query?: { language?: string; category?: string; q?: string },
): Promise<{ items: AudioListItem[] }> {
  const params = new URLSearchParams();
  if (query?.language) params.set("language", query.language);
  if (query?.category) params.set("category", query.category);
  if (query?.q) params.set("q", query.q);
  const qs = params.toString();
  return apiRequest(`/audio${qs ? `?${qs}` : ""}`, { accessToken });
}

export function getAudioTrack(accessToken: string, trackId: string): Promise<AudioTrackDetail> {
  return apiRequest(`/audio/${trackId}`, { accessToken });
}

export function requestAudioPlayback(
  accessToken: string,
  trackId: string,
  language: string,
): Promise<{ trackId: string; language: string; playbackUrl: string; expiresAt: string }> {
  return apiRequest(`/audio/${trackId}/playback`, {
    method: "POST",
    accessToken,
    body: { language },
  });
}
