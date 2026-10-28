import { apiRequest } from "./client";

export type SaathiConversation = {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SaathiMessage = {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  status: "PENDING" | "COMPLETED" | "FAILED";
  createdAt: string;
};

export type CrisisResource = {
  id: string;
  label: string;
  phone: string;
  note: string;
};

export type AudioRecommendation = {
  trackId: string;
  title: string;
  category: string;
  language: string;
};

export type SendSaathiMessageResult = {
  userMessage: SaathiMessage;
  assistantMessage: SaathiMessage;
  safetyLevel: "NORMAL" | "ELEVATED" | "IMMEDIATE" | "OUT_OF_SCOPE";
  crisisResources: CrisisResource[];
  audioRecommendations: AudioRecommendation[];
  /** First assistant turn: empathy text + matched listen. */
  isFirstAssistantReply?: boolean;
  deduped: boolean;
};

export type DiaryContextPayload = {
  entryDate: string;
  causes?: string[];
  prompt?: string;
  body: string;
};

function localDateYmd(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function saathiHeaders(): Record<string, string> {
  return {
    "X-Client-Local-Date": localDateYmd(),
    "X-Client-Timezone": Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata",
  };
}

export function listSaathiConversations(
  accessToken: string,
  page = 1,
  pageSize = 20,
): Promise<{ items: SaathiConversation[]; page: number; pageSize: number; total: number }> {
  return apiRequest(`/saathi/conversations?page=${page}&pageSize=${pageSize}`, { accessToken });
}

export function createSaathiConversation(
  accessToken: string,
  title?: string,
): Promise<SaathiConversation> {
  return apiRequest("/saathi/conversations", {
    method: "POST",
    accessToken,
    body: title ? { title } : {},
  });
}

export function getSaathiConversation(
  accessToken: string,
  conversationId: string,
  page = 1,
  pageSize = 50,
): Promise<{
  conversation: SaathiConversation;
  messages: { items: SaathiMessage[]; page: number; pageSize: number; total: number };
}> {
  return apiRequest(`/saathi/conversations/${conversationId}?page=${page}&pageSize=${pageSize}`, {
    accessToken,
  });
}

export function sendSaathiMessage(
  accessToken: string,
  conversationId: string,
  content: string,
  diaryContext?: DiaryContextPayload,
): Promise<SendSaathiMessageResult> {
  return apiRequest(`/saathi/conversations/${conversationId}/messages`, {
    method: "POST",
    accessToken,
    headers: saathiHeaders(),
    body: {
      content,
      ...(diaryContext ? { diaryContext } : {}),
    },
  });
}

export function deleteSaathiConversation(
  accessToken: string,
  conversationId: string,
): Promise<{ deleted: true }> {
  return apiRequest(`/saathi/conversations/${conversationId}`, {
    method: "DELETE",
    accessToken,
  });
}
