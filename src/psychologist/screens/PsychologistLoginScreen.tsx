import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePsychologistAuth } from "../auth/PsychologistAuthContext";
import { promptGoogleSignIn } from "../auth/googleSignInButton";
import { isAppleAvailable, isGoogleClientConfigured, signInWithAppleNative } from "../auth/socialSignIn";
import { fetchStaffAuthMethods, OtpCreateResult } from "../auth/staffAuthApi";
import { ExpertHeader } from "../components/ExpertHeader";
import { PsychPrimaryButton } from "../components/PsychPrimaryButton";
import { SocialAuthIcons } from "../components/SocialAuthIcons";
import { PsychologistStackParamList } from "../navigation/types";
import { fonts, psychColors, spacing } from "../theme";
import { StaffApiError } from "../api/staffClient";

type Props = NativeStackScreenProps<PsychologistStackParamList, "PsychologistLogin">;
type Gate = "chooser" | "signin" | "onboard";
type Mode = "password" | "emailOtp" | "phoneOtp";

/**
 * Chooser → Sign in (returning applicants + approved experts) or Onboard me (first identity).
 * Sign in keeps APPLICANT sessions so status hub can resume; clinic only after PSYCHOLOGIST + LIVE.
 */
export function PsychologistLoginScreen(_props: Props) {
  const {
    signInWithPassword,
    requestEmailOtp,
    requestPhoneOtp,
    verifyOtpForSignIn,
    verifyOtpForOnboard,
    completeSessionAsPsychologist,
    completeOnboardIdentity,
  } = usePsychologistAuth();

  const [gate, setGate] = useState<Gate>("chooser");
  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpSession, setOtpSession] = useState<OtpCreateResult | null>(null);
  const [backendGoogle, setBackendGoogle] = useState(false);
  const [backendApple, setBackendApple] = useState(false);
  const [appleOk, setAppleOk] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchStaffAuthMethods()
      .then((res) => {
        setBackendGoogle(res.methods.google);
        setBackendApple(res.methods.apple);
      })
      .catch(() => {
        setBackendGoogle(false);
        setBackendApple(false);
      });
    void isAppleAvailable().then(setAppleOk);
  }, []);

  const run = useCallback(async (fn: () => Promise<void>) => {
    setError(null);
    setLoading(true);
    try {
      await fn();
    } catch (err) {
      setError(
        err instanceof StaffApiError
          ? err.message
          : gate === "onboard"
            ? "Could not start onboarding."
            : "Sign-in failed."
      );
    } finally {
      setLoading(false);
    }
  }, [gate]);

  const onPasswordSubmit = () =>
    void run(async () => {
      if (!email.trim() || !password) throw new StaffApiError(400, "Enter your email and password.");
      await signInWithPassword(email, password);
    });

  const onSendOtp = () =>
    void run(async () => {
      if (mode === "phoneOtp") {
        if (!phone.trim()) throw new StaffApiError(400, "Enter your phone in E.164 format (+91…).");
        const session = await requestPhoneOtp(phone);
        setOtpSession(session);
        setOtpCode("");
        return;
      }
      if (!email.trim()) throw new StaffApiError(400, "Enter your work email.");
      const session = await requestEmailOtp(email);
      setOtpSession(session);
      setOtpCode("");
    });

  const onVerifyOtp = () =>
    void run(async () => {
      if (!otpSession) throw new StaffApiError(400, "Request a code first.");
      if (!otpCode.trim()) throw new StaffApiError(400, "Enter the code.");
      if (gate === "onboard") await verifyOtpForOnboard(otpSession, otpCode);
      else await verifyOtpForSignIn(otpSession, otpCode);
    });

  const onGoogle = () => {
    if (!backendGoogle) {
      setError("Google is not enabled yet.");
      return;
    }
    if (!isGoogleClientConfigured()) {
      setError("Google is not configured on this build.");
      return;
    }
    void run(async () => {
      await promptGoogleSignIn();
      if (gate === "onboard") await completeOnboardIdentity();
      else await completeSessionAsPsychologist();
    });
  };

  const onApple = () => {
    if (!backendApple) {
      setError("Apple Sign In is not enabled yet.");
      return;
    }
    if (!appleOk) {
      setError("Apple Sign In needs iOS.");
      return;
    }
    void run(async () => {
      await signInWithAppleNative();
      if (gate === "onboard") await completeOnboardIdentity();
      else await completeSessionAsPsychologist();
    });
  };

  const resetToChooser = () => {
    setGate("chooser");
    setMode("password");
    setOtpSession(null);
    setError(null);
  };

  if (gate === "chooser") {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ExpertHeader />
          <View style={styles.hero}>
            <Text style={styles.title}>U Mind for experts</Text>
            <Text style={styles.lead}>
              New here? Start with Onboard me. Already applied or approved? Sign in to check your
              status or open the clinic when you’re live.
            </Text>
          </View>

          <PsychPrimaryButton
            label="Onboard me"
            onPress={() => {
              setGate("onboard");
              setMode("emailOtp");
              setError(null);
            }}
          />
          <Pressable
            style={styles.secondaryBtn}
            onPress={() => {
              setGate("signin");
              setMode("password");
              setError(null);
            }}
          >
            <Text style={styles.secondaryLabel}>Sign in</Text>
          </Pressable>

          {__DEV__ ? (
            <Text style={styles.devCred}>Dev sign-in: psych@umind.local / UMindPsych1!</Text>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    );
  }

  const isOnboard = gate === "onboard";

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ExpertHeader />
          <Pressable onPress={resetToChooser} hitSlop={12} style={styles.back}>
            <Text style={styles.backLabel}>← Back</Text>
          </Pressable>

          <View style={styles.hero}>
            <Text style={styles.title}>{isOnboard ? "Onboard me" : "Welcome back"}</Text>
            <Text style={styles.lead}>
              {isOnboard
                ? "Continue with Google, Apple, or a one-time code. That verifies who you are so you can apply. HR approval comes next; documents and the clinic come after."
                : "Use the same Google, Apple, email, or phone as your application. You’ll land on your status if you’re still under review, or the clinic if you’re published."}
            </Text>
            {__DEV__ && !isOnboard ? (
              <Text style={styles.devCred}>Dev: psych@umind.local / UMindPsych1!</Text>
            ) : null}
          </View>

          {!isOnboard && mode === "password" ? (
            <View style={styles.form}>
              <View style={styles.field}>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Work email"
                  placeholderTextColor={psychColors.inkMuted}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  style={styles.pillInput}
                />
              </View>
              <View style={styles.field}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password"
                  placeholderTextColor={psychColors.inkMuted}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  style={[styles.pillInput, styles.pillInputWithIcon]}
                />
                <Pressable
                  style={styles.eye}
                  onPress={() => setShowPassword((v) => !v)}
                  hitSlop={12}
                >
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={22}
                    color={psychColors.inkMuted}
                  />
                </Pressable>
              </View>
              <PsychPrimaryButton label="Sign in" onPress={onPasswordSubmit} loading={loading} />
            </View>
          ) : (
            <View style={styles.form}>
              {mode === "phoneOtp" ? (
                <View style={styles.field}>
                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Phone (+91…)"
                    placeholderTextColor={psychColors.inkMuted}
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    style={styles.pillInput}
                  />
                </View>
              ) : (
                <View style={styles.field}>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Work email"
                    placeholderTextColor={psychColors.inkMuted}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                    style={styles.pillInput}
                  />
                </View>
              )}
              {!otpSession ? (
                <PsychPrimaryButton
                  label={isOnboard ? "Send code to continue" : "Send sign-in code"}
                  onPress={onSendOtp}
                  loading={loading}
                />
              ) : (
                <>
                  <Text style={styles.otpHint}>Enter the code we sent.</Text>
                  <View style={styles.field}>
                    <TextInput
                      value={otpCode}
                      onChangeText={setOtpCode}
                      placeholder="One-time code"
                      placeholderTextColor={psychColors.inkMuted}
                      keyboardType="number-pad"
                      style={styles.pillInput}
                    />
                  </View>
                  <PsychPrimaryButton
                    label={isOnboard ? "Continue" : "Sign in"}
                    onPress={onVerifyOtp}
                    loading={loading}
                  />
                </>
              )}
              {!isOnboard ? (
                <Pressable
                  onPress={() => {
                    setMode("password");
                    setOtpSession(null);
                    setError(null);
                  }}
                >
                  <Text style={styles.switchLink}>Use password instead</Text>
                </Pressable>
              ) : null}
            </View>
          )}

          {(isOnboard || mode === "password") && !otpSession ? (
            <SocialAuthIcons
              loading={loading}
              onGoogle={onGoogle}
              onApple={onApple}
              onEmailOtp={() => {
                setMode("emailOtp");
                setOtpSession(null);
                setError(null);
              }}
              onPhoneOtp={() => {
                setMode("phoneOtp");
                setOtpSession(null);
                setError(null);
              }}
            />
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: psychColors.background },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.flowHorizontal,
    paddingTop: spacing.xxl,
    paddingBottom: 40,
  },
  back: { marginTop: 8, marginBottom: 4 },
  backLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: psychColors.primary,
  },
  hero: { marginTop: 28, marginBottom: 28, gap: 8 },
  title: {
    fontFamily: fonts.serif,
    fontSize: 34,
    lineHeight: 40,
    color: psychColors.ink,
  },
  lead: {
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 22,
    color: psychColors.inkMuted,
  },
  devCred: {
    marginTop: 16,
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: psychColors.primary,
  },
  secondaryBtn: {
    marginTop: 14,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: psychColors.ink,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: psychColors.surface,
  },
  secondaryLabel: {
    fontFamily: fonts.sansExtraBold,
    fontSize: 16,
    color: psychColors.ink,
  },
  form: { gap: 14 },
  field: { position: "relative" },
  pillInput: {
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: psychColors.ink,
    backgroundColor: psychColors.surface,
    paddingHorizontal: 22,
    fontFamily: fonts.sans,
    fontSize: 16,
    color: psychColors.ink,
  },
  pillInputWithIcon: { paddingRight: 52 },
  eye: {
    position: "absolute",
    right: 18,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  otpHint: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: psychColors.inkMuted,
  },
  switchLink: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: psychColors.primary,
    textAlign: "center",
    marginTop: 4,
  },
  error: {
    marginTop: 16,
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: psychColors.coralInk,
    textAlign: "center",
  },
});
