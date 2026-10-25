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
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  accessToken?: string;
  headers?: Record<string, string>;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Client-Platform": CLIENT_PLATFORM,
    ...options.headers,
  };

  if (options.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError(
      0,
      "Cannot reach the server. Check that the backend is running and your phone is on the same Wi‑Fi.",
    );
  }

  let payload: ApiSuccess<T> | ApiFail;
  try {
    payload = (await response.json()) as ApiSuccess<T> | ApiFail;
  } catch {
    throw new ApiError(
      response.status,
      "Invalid response from server. Check API URL (see Metro log for [U Mind] API_BASE_URL).",
    );
  }

  if (!response.ok || payload.status !== "success") {
    const fail = payload as ApiFail;
    throw new ApiError(response.status, fail.message ?? "Request failed", fail.details);
  }

  return payload.data;
}
