import { API_BASE_URL } from "../config/env";

/** Strip trailing /api so SuperTokens apiDomain is origin only. */
export function staffApiDomain(): string {
  return API_BASE_URL.replace(/\/api\/?$/, "");
}

export const STAFF_AUTH_BASE_PATH = "/api/v1/staff/auth";
export const STAFF_API_PREFIX = "/v1/staff";
