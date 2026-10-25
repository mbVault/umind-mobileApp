import * as SecureStore from "expo-secure-store";

const KEYS = {
  refreshToken: "umind_refresh_token",
  deviceId: "umind_device_id",
} as const;

export const secureStorage = {
  async getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(KEYS.refreshToken);
  },
  async setRefreshToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(KEYS.refreshToken, token, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED,
    });
  },
  async clearRefreshToken(): Promise<void> {
    await SecureStore.deleteItemAsync(KEYS.refreshToken);
  },
  async getDeviceId(): Promise<string | null> {
    return SecureStore.getItemAsync(KEYS.deviceId);
  },
  async setDeviceId(id: string): Promise<void> {
    await SecureStore.setItemAsync(KEYS.deviceId, id, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED,
    });
  },
};
