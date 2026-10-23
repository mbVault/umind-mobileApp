import { API_BASE_URL, CLIENT_PLATFORM } from "../config/env";

export type ApiSuccess<T> = { status: "success"; data: T };
export type ApiFail = { status: "fail"; message: string; details?: Record<string, string[]> };

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: Record<string, string[]>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT";
  body?: unknown;
  accessToken?: string;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Client-Platform": CLIENT_PLATFORM,
  };

  if (options.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const payload = (await response.json()) as ApiSuccess<T> | ApiFail;

  if (!response.ok || payload.status !== "success") {
    const fail = payload as ApiFail;
    throw new ApiError(response.status, fail.message ?? "Request failed", fail.details);
  }

  return payload.data;
}
