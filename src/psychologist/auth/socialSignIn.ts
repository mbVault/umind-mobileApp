import { Platform } from "react-native";
import { thirdPartySignInWithOAuthTokens } from "./staffAuthApi";
import { StaffApiError } from "../api/staffClient";

const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() ?? "";
const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() ?? "";
const googleAndroidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim() ?? "";

export const isGoogleClientConfigured = (): boolean =>
  Boolean(googleWebClientId || googleIosClientId || googleAndroidClientId);

export const googleAuthRequestConfig = {
  webClientId: googleWebClientId || undefined,
  iosClientId: googleIosClientId || undefined,
  androidClientId: googleAndroidClientId || undefined,
};

type AppleAuthModule = typeof import("expo-apple-authentication");

function loadAppleAuthentication(): AppleAuthModule | null {
  if (Platform.OS !== "ios") return null;
  try {
    // Lazy require avoids pulling Apple native code into Android startup.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("expo-apple-authentication") as AppleAuthModule;
  } catch {
    return null;
  }
}

/** Apple UI only on iOS after native module is present. */
export const isAppleAvailable = async (): Promise<boolean> => {
  const AppleAuthentication = loadAppleAuthentication();
  if (!AppleAuthentication) return false;
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
};

export async function completeGoogleSignIn(
  idToken: string | null | undefined,
  accessToken: string | null | undefined
): Promise<void> {
  if (!idToken && !accessToken) {
    throw new StaffApiError(401, "Google did not return tokens.");
  }
  await thirdPartySignInWithOAuthTokens({
    thirdPartyId: "google",
    oAuthTokens: {
      ...(idToken ? { id_token: idToken } : {}),
      ...(accessToken ? { access_token: accessToken } : {}),
    },
  });
}

export async function signInWithAppleNative(): Promise<void> {
  const AppleAuthentication = loadAppleAuthentication();
  if (!AppleAuthentication) {
    throw new StaffApiError(400, "Apple Sign In requires iOS and a rebuilt native app.");
  }
  const available = await AppleAuthentication.isAvailableAsync();
  if (!available) {
    throw new StaffApiError(400, "Apple Sign In is not available on this device.");
  }

  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  if (!credential.identityToken) {
    throw new StaffApiError(401, "Apple did not return an identity token.");
  }

  await thirdPartySignInWithOAuthTokens({
    thirdPartyId: "apple",
    oAuthTokens: { id_token: credential.identityToken },
  });
}
