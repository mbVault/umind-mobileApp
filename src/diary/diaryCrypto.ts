import { gcm } from "@noble/ciphers/aes.js";
import { randomBytes } from "@noble/hashes/utils.js";
import * as SecureStore from "expo-secure-store";
import { getPrivacyConsent, putPrivacyConsent, type DiaryPlaintext } from "../api/diary";

const DEVICE_KEY_STORE = "umind_diary_device_key_v1";

function b64Encode(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return globalThis.btoa(binary);
}

function b64Decode(value: string): Uint8Array {
  const binary = globalThis.atob(value);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

/**
 * Device-bound diary key in SecureStore for Phase 2 UI.
 * Recovery-phrase → Argon2id unlock on a new device is a follow-up;
 * salt is still registered with the backend for that migration path.
 */
async function getOrCreateDeviceKey(): Promise<Uint8Array> {
  const existing = await SecureStore.getItemAsync(DEVICE_KEY_STORE);
  if (existing) return b64Decode(existing);
  const key = randomBytes(32);
  await SecureStore.setItemAsync(DEVICE_KEY_STORE, b64Encode(key));
  return key;
}

export async function ensureDiarySaltRegistered(accessToken: string): Promise<void> {
  const consent = await getPrivacyConsent(accessToken);
  if (consent.diaryKdfSalt) return;
  const salt = randomBytes(16);
  await putPrivacyConsent(accessToken, {
    shareDiaryWithSaathi: consent.shareDiaryWithSaathi,
    ...(consent.shareDiaryConsentVersion
      ? { shareDiaryConsentVersion: consent.shareDiaryConsentVersion }
      : {}),
    diaryKdfSalt: b64Encode(salt),
  });
}

export async function encryptDiaryPayload(plain: DiaryPlaintext): Promise<{
  ciphertext: string;
  nonce: string;
  encryptionVersion: number;
  schemaVersion: number;
}> {
  const key = await getOrCreateDeviceKey();
  const nonce = randomBytes(12);
  const encoded = new TextEncoder().encode(JSON.stringify(plain));
  const cipher = gcm(key, nonce);
  const ciphertext = cipher.encrypt(encoded);
  return {
    ciphertext: b64Encode(ciphertext),
    nonce: b64Encode(nonce),
    encryptionVersion: 1,
    schemaVersion: 1,
  };
}

export async function decryptDiaryPayload(input: {
  ciphertext: string;
  nonce: string;
}): Promise<DiaryPlaintext> {
  const key = await getOrCreateDeviceKey();
  const nonce = b64Decode(input.nonce);
  const ciphertext = b64Decode(input.ciphertext);
  const cipher = gcm(key, nonce);
  const plain = cipher.decrypt(ciphertext);
  const parsed = JSON.parse(new TextDecoder().decode(plain)) as DiaryPlaintext;
  return {
    causes: Array.isArray(parsed.causes) ? parsed.causes : [],
    prompt: typeof parsed.prompt === "string" ? parsed.prompt : undefined,
    body: typeof parsed.body === "string" ? parsed.body : "",
  };
}
