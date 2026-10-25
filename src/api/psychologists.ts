import { apiRequest } from "./client";

export type PublicPsychologist = {
  id: string;
  publicName: string;
  avatarColor: string | null;
  avatarInitials: string | null;
  yearsPractising: number | null;
  highestDegree: string | null;
  specialisations: string[];
  languages: string[];
};

export function listPsychologists(
  accessToken: string,
  opts?: { specialisation?: string },
): Promise<{ items: PublicPsychologist[]; total: number }> {
  const params = new URLSearchParams();
  if (opts?.specialisation) params.set("specialisation", opts.specialisation);
  const qs = params.toString();
  return apiRequest(`/psychologists/${qs ? `?${qs}` : ""}`, { accessToken });
}
