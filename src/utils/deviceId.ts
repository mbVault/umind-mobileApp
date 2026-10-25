import { secureStorage } from "../storage/secureStorage";

/** Dev-friendly UUID v4 without native modules (fine for anonymous deviceId). */
function randomUuidV4(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function getOrCreateDeviceId(): Promise<string> {
  const existing = await secureStorage.getDeviceId();
  if (existing) {
    return existing;
  }
  const id = randomUuidV4();
  await secureStorage.setDeviceId(id);
  return id;
}
