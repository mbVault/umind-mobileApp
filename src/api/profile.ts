import { apiRequest } from "./client";

export type UserProfile = {
  id: string;
  alias: string;
  avatarId: string;
  lifeStage: string;
  gender: string;
  startingFeelings: string[];
  appTheme: string;
  city: string;
  saathiCheckIn: string;
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
