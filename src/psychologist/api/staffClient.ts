import { API_BASE_URL, CLIENT_PLATFORM } from "../../config/env";
import { STAFF_API_PREFIX } from "../config";

export type StaffApiSuccess<T> = { status: "success"; data: T };
export type StaffApiFail = { status: "fail"; message: string; details?: Record<string, string[]> };

export class StaffApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: Record<string, string[]>
  ) {
    super(message);
    this.name = "StaffApiError";
  }
}

type Options = {
  method?: "GET" | "POST" | "PUT" | "PATCH";
  body?: unknown;
};

/**
 * Staff JSON API under /api/v1/staff/*.
 * Session cookies/headers are attached by SuperTokens when initialized.
 */
export async function staffRequest<T>(path: string, options: Options = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Client-Platform": CLIENT_PLATFORM,
  };

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${STAFF_API_PREFIX}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new StaffApiError(
      0,
      "Cannot reach the server. Check that the backend is running and your phone is on the same Wi‑Fi."
    );
  }

  let payload: StaffApiSuccess<T> | StaffApiFail;
  try {
    payload = (await response.json()) as StaffApiSuccess<T> | StaffApiFail;
  } catch {
    throw new StaffApiError(response.status, "Invalid response from server.");
  }

  if (!response.ok || payload.status !== "success") {
    const fail = payload as StaffApiFail;
    throw new StaffApiError(response.status, fail.message ?? "Request failed", fail.details);
  }

  return payload.data;
}
