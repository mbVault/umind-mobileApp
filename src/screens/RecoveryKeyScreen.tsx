import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Clipboard from "expo-clipboard";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { OnboardingBackButton } from "../components/OnboardingBackButton";
import { OutlineButton } from "../components/OutlineButton";
import { PrimaryButton } from "../components/PrimaryButton";
import { useOnboardingDraft } from "../onboarding/OnboardingDraftContext";
import { AuthStackParamList } from "../navigation/types";
import { colors, radius, spacing, typeScale } from "../theme";
import { fonts } from "../theme/typography";
import { formatRecoveryKey, generateRecoveryKeyWords } from "../utils/recoveryKeyWords";

type Props = NativeStackScreenProps<AuthStackParamList, "RecoveryKey">;

export function RecoveryKeyScreen({ navigation }: Props) {
  const { draft, setRecoveryKeyWords } = useOnboardingDraft();
  const [savedConfirmed, setSavedConfirmed] = useState(false);

  useEffect(() => {
    if (draft.recoveryKeyWords.length === 0) {
      setRecoveryKeyWords(generateRecoveryKeyWords());
    }
  }, [draft.recoveryKeyWords.length, setRecoveryKeyWords]);

  const words = draft.recoveryKeyWords;
  const alias = draft.alias.trim() || "you";

  const copyWords = async () => {
    await Clipboard.setStringAsync(formatRecoveryKey(words));
    Alert.alert("Copied", "Your 12 words are on the clipboard. Paste them somewhere safe.");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <OnboardingBackButton onPress={() => navigation.goBack()} />

        <Text style={typeScale.h1}>Your recovery key, {alias}</Text>
        <Text style={[typeScale.bodyLarge, styles.lead]}>
          Write these down or screenshot them. We can't reset them — we never knew who you are.
        </Text>

        <View style={styles.gridCard}>
          <View style={styles.grid}>
            {words.map((word, index) => (
              <View key={`${word}-${index}`} style={styles.wordCell}>
                <Text style={styles.wordIndex}>{index + 1}</Text>
                <Text style={styles.word}>{word}</Text>
              </View>
            ))}
          </View>
        </View>

        <OutlineButton label="Copy words" onPress={() => copyWords().catch(() => undefined)} />

        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: savedConfirmed }}
          onPress={() => setSavedConfirmed((v) => !v)}
          style={styles.checkRow}
        >
          <View style={[styles.checkbox, savedConfirmed && styles.checkboxOn]}>
            {savedConfirmed ? <Ionicons name="checkmark" size={16} color="#FFFFFF" /> : null}
          </View>
          <Text style={typeScale.body}>I've saved my 12 words somewhere safe.</Text>
        </Pressable>

        <PrimaryButton
          label="Continue"
          disabled={!savedConfirmed || words.length !== 12}
          onPress={() => navigation.navigate("LifeStage")}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.flowHorizontal, paddingBottom: spacing.xxl, gap: spacing.md },
  lead: { marginBottom: spacing.sm },
  gridCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: spacing.sm },
  wordCell: {
    width: "31%",
    backgroundColor: "#FCEBCC",
    borderRadius: radius.input,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    minHeight: 52,
  },
  wordIndex: { fontFamily: fonts.sans, fontSize: 11, color: colors.inkMuted },
  word: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.ink },
  checkRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginVertical: spacing.sm },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxOn: { backgroundColor: colors.primary },
});
