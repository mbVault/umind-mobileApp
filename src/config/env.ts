import Constants from "expo-constants";
import { NativeModules, Platform } from "react-native";

const API_PORT = 4000;
const API_PATH = "/api";

const extra = Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined;

function hostFromUrl(url: string | undefined | null): string | null {
  if (!url) {
    return null;
  }
  const match = url.match(/^https?:\/\/([^/:]+)/);
  return match?.[1] ?? null;
}

/** Same machine as Metro (physical device or emulator) → backend on :4000 */
function devMetroHost(): string | null {
  const debuggerHost =
    Constants.expoGoConfig?.debuggerHost ??
    Constants.expoConfig?.hostUri ??
    undefined;

  if (debuggerHost) {
    return debuggerHost.split(":")[0] ?? null;
  }

  const sourceCode = NativeModules.SourceCode as { scriptURL?: string } | undefined;
  return hostFromUrl(sourceCode?.scriptURL);
}

function defaultLocalApiBase(): string {
  if (Platform.OS === "android") {
    return `http://10.0.2.2:${API_PORT}${API_PATH}`;
  }
  return `http://localhost:${API_PORT}${API_PATH}`;
}

function resolveApiBaseUrl(): string {
  const explicit = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }

  if (__DEV__) {
    const metroHost = devMetroHost();
    if (metroHost && metroHost !== "localhost" && metroHost !== "127.0.0.1") {
      return `http://${metroHost}:${API_PORT}${API_PATH}`;
    }
    return defaultLocalApiBase();
  }

  const configured = extra?.apiBaseUrl?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  return defaultLocalApiBase();
}

export const API_BASE_URL = resolveApiBaseUrl();

export const WEATHERAPI_KEY = process.env.EXPO_PUBLIC_WEATHERAPI_KEY?.trim() ?? "";

if (__DEV__) {
  console.log("[U Mind] API_BASE_URL =", API_BASE_URL);
  console.log("[U Mind] WeatherAPI key set =", Boolean(WEATHERAPI_KEY));
}

export const CLIENT_PLATFORM = "android" as const;
