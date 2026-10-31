import { apiRequest } from "./client";

export type SubscriptionPlanCode = "YEARLY" | "QUARTERLY" | "MONTHLY";

export type RegisterPayload = {
  recoveryKey: string;
  alias: string;
  avatarId: string;
  lifeStage: string;
  gender: string;
  sexualOrientation: string;
  startingFeelings: string[];
  appTheme: string;
  city: string;
  saathiCheckInMode: string;
  saathiCheckInSlots: string[];
  saathiTimezone: string;
  saathiTimezoneSource: "AUTO" | "MANUAL";
  saathiLanguage: string;
  unwindHabits: string[];
  deviceId?: string;
  /** Starts the 7-day free trial in the same register call (Trial screen CTA). */
  subscriptionPlanCode?: SubscriptionPlanCode;
};

export type AuthTokens = {
  accessToken: string;
  accessTokenExpiresIn: number;
  refreshToken: string;
  refreshTokenExpiresAt?: string;
  refreshTokenExpiresIn?: number;
};

export type RegisterResponse = {
  user: { id: string; alias: string; avatarId: string; status: string };
  session: { sessionId: string; expiresAt: string; userDeviceId: string | null };
  tokens: AuthTokens;
};

export type RefreshResponse = {
  session: { sessionId: string; expiresAt: string };
  tokens: AuthTokens;
};

export type SessionResponse = {
  session: { sessionId: string; expiresAt: string; userDeviceId: string | null };
  user: { id: string; alias: string; avatarId: string; status: string };
};

export function register(payload: RegisterPayload): Promise<RegisterResponse> {
  return apiRequest<RegisterResponse>("/auth/register", { method: "POST", body: payload });
}

export function recover(payload: { recoveryKey: string; deviceId?: string }): Promise<RegisterResponse> {
  return apiRequest<RegisterResponse>("/auth/recover", { method: "POST", body: payload });
}

export function refreshSession(refreshToken: string): Promise<RefreshResponse> {
  return apiRequest<RefreshResponse>("/auth/refresh", { method: "POST", body: { refreshToken } });
}

export function getAuthSession(accessToken: string): Promise<SessionResponse> {
  return apiRequest<SessionResponse>("/auth/session", { accessToken });
}

export function logoutSession(refreshToken: string): Promise<{ revoked: boolean }> {
  return apiRequest<{ revoked: boolean }>("/auth/logout", { method: "POST", body: { refreshToken } });
}
