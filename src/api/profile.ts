import { apiRequest } from "./client";

export type UserProfile = {
  id: string;
  alias: string;
  avatarId: string;
  lifeStage: string;
  gender: string;
  sexualOrientation: string | null;
  startingFeelings: string[];
  appTheme: string;
  city: string;
  saathiCheckIn: string;
  saathiCheckInMode: string;
  saathiCheckInSlots: string[];
  saathiTimezone: string | null;
  saathiTimezoneSource: string | null;
  saathiLanguage: string;
  unwindHabits: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
  onboardingComplete: boolean;
};

export function getProfile(accessToken: string): Promise<UserProfile> {
  return apiRequest<UserProfile>("/profile/", { accessToken });
}
