import { v4 as uuidv4 } from "uuid";
import { secureStorage } from "../storage/secureStorage";

export async function getOrCreateDeviceId(): Promise<string> {
  const existing = await secureStorage.getDeviceId();
  if (existing) {
    return existing;
  }
  const id = uuidv4();
  await secureStorage.setDeviceId(id);
  return id;
}
