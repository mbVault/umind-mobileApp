import { apiRequest } from "./client";

export type DiaryEntryEnvelope = {
  id: string;
  entryDate: string;
  ciphertext: string;
  nonce: string;
  encryptionVersion: number;
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
};

export type DiaryPlaintext = {
  causes: string[];
  prompt?: string;
  body: string;
};

export function listDiaryEntries(
  accessToken: string,
  from: string,
  to: string,
): Promise<{ entries: DiaryEntryEnvelope[] }> {
  return apiRequest(`/diary?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, {
    accessToken,
  });
}

export function getDiaryEntry(
  accessToken: string,
  entryDate: string,
): Promise<DiaryEntryEnvelope> {
  return apiRequest(`/diary/${encodeURIComponent(entryDate)}`, { accessToken });
}

export function putDiaryEntry(
  accessToken: string,
  entryDate: string,
  payload: {
    ciphertext: string;
    nonce: string;
    encryptionVersion?: number;
    schemaVersion?: number;
  },
): Promise<{
  id: string;
  entryDate: string;
  encryptionVersion: number;
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
}> {
  return apiRequest(`/diary/${encodeURIComponent(entryDate)}`, {
    method: "PUT",
    accessToken,
    body: {
      ciphertext: payload.ciphertext,
      nonce: payload.nonce,
      encryptionVersion: payload.encryptionVersion ?? 1,
      schemaVersion: payload.schemaVersion ?? 1,
    },
  });
}

export function getDiaryStreak(accessToken: string): Promise<{ daysWithEntries: number }> {
  return apiRequest("/diary/streak", { accessToken });
}

export type PrivacyConsent = {
  shareDiaryWithSaathi: boolean;
  shareDiaryConsentVersion: number | null;
  shareDiaryConsentAt: string | null;
  diaryKdfSalt: string | null;
  diaryKeyVersion: number;
};

export function getPrivacyConsent(accessToken: string): Promise<PrivacyConsent> {
  return apiRequest("/privacy/consent", { accessToken });
}

export function putPrivacyConsent(
  accessToken: string,
  body: {
    shareDiaryWithSaathi: boolean;
    shareDiaryConsentVersion?: number;
    diaryKdfSalt?: string;
  },
): Promise<PrivacyConsent> {
  return apiRequest("/privacy/consent", { method: "PUT", accessToken, body });
}
