import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined;

/** Emulator: 10.0.2.2. Physical device: set EXPO_PUBLIC_API_BASE_URL to http://<PC-LAN-IP>:4000/api */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? extra?.apiBaseUrl ?? "http://10.0.2.2:4000/api";

export const CLIENT_PLATFORM = "android" as const;
