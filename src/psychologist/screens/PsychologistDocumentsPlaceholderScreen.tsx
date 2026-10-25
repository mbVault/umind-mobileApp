import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { submitPsychologistApplication } from "../api/psychologistApi";
import { StaffApiError } from "../api/staffClient";
import { OnboardingProgress } from "../components/OnboardingProgress";
import { PsychPrimaryButton } from "../components/PsychPrimaryButton";
import { PsychologistStackParamList } from "../navigation/types";
import { fonts, psychColors, spacing, typeScale } from "../theme";

type Props = NativeStackScreenProps<PsychologistStackParamList, "PsychologistDocumentsPlaceholder">;

/**
 * Temporary bridge until Psycho-4 documents UI is built.
 * Submits application (creates verification checks) and opens Psycho-5.
 */
export function PsychologistDocumentsPlaceholderScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      await submitPsychologistApplication();
      navigation.navigate("PsychologistBackgroundCheck");
    } catch (err) {
      // Already submitted / incomplete draft → still allow viewing BGV status if checks exist
      const message = err instanceof StaffApiError ? err.message : "Could not submit application.";
      if (message.toLowerCase().includes("already") || message.toLowerCase().includes("pending")) {
        navigation.navigate("PsychologistBackgroundCheck");
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
          Full document upload UI (Psycho-4) is not built yet. For now you can submit your
          application draft so verification checks start, then continue to the Background check
          screen.
        </Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PsychPrimaryButton
          label="Submit for background check"
          onPress={onSubmit}
          loading={loading}
        />
        <PsychPrimaryButton
          label="View background check status"
          onPress={() => navigation.navigate("PsychologistBackgroundCheck")}
          style={styles.secondary}
        />
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
