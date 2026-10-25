import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePsychologistAuth } from "../auth/PsychologistAuthContext";
import { ExpertHeader } from "../components/ExpertHeader";
import { PsychPrimaryButton } from "../components/PsychPrimaryButton";
import { PsychTextField } from "../components/PsychTextField";
import { PsychologistStackParamList } from "../navigation/types";
import { fonts, psychColors, spacing, typeScale } from "../theme";
import { StaffApiError } from "../api/staffClient";

type Props = NativeStackScreenProps<PsychologistStackParamList, "PsychologistLogin">;

export function PsychologistLoginScreen(_props: Props) {
  const { signIn } = usePsychologistAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      await signIn(email, password);
      // Navigator switches to Apply stack when isAuthenticated flips.
    } catch (err) {
      const message =
        err instanceof StaffApiError
          ? err.message
          : "Sign-in failed. Check SuperTokens is running and your account is provisioned.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ExpertHeader />
          <Text style={[typeScale.h1, styles.title]}>Welcome back, expert.</Text>
          <Text style={styles.lead}>
            Sign in with the email U Mind provisioned for you. New accounts are invite-only — there
            is no public signup.
          </Text>

          <PsychTextField
            label="Work email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            focusedBorder
            placeholder="you@clinic.com"
          />
          <PsychTextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            placeholder="••••••••"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <PsychPrimaryButton label="Sign in" onPress={onSubmit} loading={loading} />

          <Text style={styles.hint}>
            After sign-in you’ll continue onboarding (Apply → profile → documents) if your
            background check isn’t complete yet.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: psychColors.background },
  flex: { flex: 1 },
  content: {
    paddingHorizontal: spacing.flowHorizontal,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  title: { marginTop: spacing.md },
  lead: {
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 22,
    color: psychColors.inkMuted,
  },
  error: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: psychColors.coralInk,
  },
  hint: {
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 18,
    color: psychColors.inkMuted,
    textAlign: "center",
  },
});
