import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri, AuthRequest, ResponseType } from "expo-auth-session";
import { StaffApiError } from "../api/staffClient";
import { fonts, psychColors } from "../theme";
import { completeGoogleSignIn, googleAuthRequestConfig, isGoogleClientConfigured } from "./socialSignIn";

WebBrowser.maybeCompleteAuthSession();

/** Shared Google OAuth → SuperTokens session. */
export async function promptGoogleSignIn(): Promise<void> {
  if (!isGoogleClientConfigured()) {
    throw new StaffApiError(400, "Set EXPO_PUBLIC_GOOGLE_* client IDs first.");
  }
  const clientId =
    googleAuthRequestConfig.androidClientId ||
    googleAuthRequestConfig.iosClientId ||
    googleAuthRequestConfig.webClientId;
  if (!clientId) {
    throw new StaffApiError(400, "Missing EXPO_PUBLIC_GOOGLE_* client id");
  }

  const redirectUri = makeRedirectUri();
  const request = new AuthRequest({
    clientId,
    redirectUri,
    scopes: ["openid", "profile", "email"],
    responseType: ResponseType.IdToken,
    extraParams: { nonce: String(Date.now()) },
    usePKCE: false,
  });

  const result = await request.promptAsync({
    authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  });

  if (result.type !== "success") {
    throw new StaffApiError(401, "Google sign-in was cancelled.");
  }

  const idToken = (result.params as { id_token?: string }).id_token;
  const accessToken = result.authentication?.accessToken;
  await completeGoogleSignIn(idToken, accessToken);
}

type Props = {
  enabled: boolean;
  loading: boolean;
  onBusy: (busy: boolean) => void;
  onError: (message: string) => void;
  onSuccess: () => Promise<void>;
};

/** Full-width text button (optional). Prefer icon row + promptGoogleSignIn. */
export function GoogleSignInButton({ enabled, loading, onBusy, onError, onSuccess }: Props) {
  const [localBusy, setLocalBusy] = useState(false);
  const busy = loading || localBusy;

  const onPress = useCallback(() => {
    onBusy(true);
    setLocalBusy(true);
    void (async () => {
      try {
        await promptGoogleSignIn();
        await onSuccess();
      } catch (err) {
        const message =
          err instanceof StaffApiError
            ? err.message
            : err instanceof Error && err.message.includes("ExpoApplication")
              ? "Google needs a native rebuild. Run: npx expo run:android"
              : "Google sign-in failed";
        onError(message);
      } finally {
        setLocalBusy(false);
        onBusy(false);
      }
    })();
  }, [onBusy, onError, onSuccess]);

  if (!enabled || !isGoogleClientConfigured()) return null;

  return (
    <Pressable style={[styles.socialBtn, busy && styles.socialDisabled]} disabled={busy} onPress={onPress}>
      {busy ? (
        <ActivityIndicator color={psychColors.ink} />
      ) : (
        <Text style={styles.socialText}>Continue with Google</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  socialBtn: {
    borderWidth: 1,
    borderColor: psychColors.border,
    backgroundColor: psychColors.surface,
    borderRadius: 28,
    paddingVertical: 14,
    alignItems: "center",
  },
  socialDisabled: { opacity: 0.6 },
  socialText: {
    fontFamily: fonts.sansBold,
    fontSize: 15,
    color: psychColors.ink,
  },
});
