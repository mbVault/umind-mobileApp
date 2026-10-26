import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { submitForHrReview, submitPsychologistApplication } from "../api/psychologistApi";
import { StaffApiError } from "../api/staffClient";
import { usePsychologistAuth } from "../auth/PsychologistAuthContext";
import { OnboardingProgress } from "../components/OnboardingProgress";
import { PsychPrimaryButton } from "../components/PsychPrimaryButton";
import { PsychologistStackParamList } from "../navigation/types";
import { fonts, psychColors, spacing, typeScale } from "../theme";

type Props = NativeStackScreenProps<PsychologistStackParamList, "PsychologistDocumentsPlaceholder">;

export function PsychologistDocumentsPlaceholderScreen({ navigation }: Props) {
  const { isApplicant, isPsychologist, refreshAccess } = usePsychologistAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      if (isApplicant) {
        await submitForHrReview();
        await refreshAccess();
        navigation.navigate("PsychologistPendingReview");
        return;
      }
      await submitPsychologistApplication();
      navigation.navigate("PsychologistBackgroundCheck");
    } catch (err) {
      const message = err instanceof StaffApiError ? err.message : "Could not submit application.";
      if (message.toLowerCase().includes("already") || message.toLowerCase().includes("pending")) {
        navigation.navigate(isApplicant ? "PsychologistPendingReview" : "PsychologistBackgroundCheck");
        return;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <OnboardingProgress step={3} onBack={() => navigation.goBack()} />
        <Text style={typeScale.h1}>Documents for your background check</Text>
        <Text style={styles.body}>
          {isApplicant
            ? "Full document upload UI is next. For now, submit to HR screening. Sign in unlocks only after approval."
            : "Full document upload UI (Psycho-4) is not built yet. Submit so verification checks start, then continue."}
        </Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PsychPrimaryButton
          label={isApplicant ? "Submit for HR review" : "Submit for background check"}
          onPress={onSubmit}
          loading={loading}
        />
        {isPsychologist ? (
          <PsychPrimaryButton
            label="View background check status"
            onPress={() => navigation.navigate("PsychologistBackgroundCheck")}
            style={styles.secondary}
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: psychColors.background },
  content: {
    flex: 1,
    padding: spacing.flowHorizontal,
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
  body: {
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
  secondary: {
    backgroundColor: psychColors.ink,
  },
});
