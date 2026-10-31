import * as Crypto from "expo-crypto";

/** Backend Idempotency-Key: max 64 chars. Uses Expo crypto (RN has no crypto.getRandomValues for uuid). */
export function createIdempotencyKey(maxLen = 32): string {
  return Crypto.randomUUID().replace(/-/g, "").slice(0, maxLen);
}
