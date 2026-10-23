import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { OnboardingStepHeader } from "../components/OnboardingStepHeader";
import { PrimaryButton } from "../components/PrimaryButton";
import { SelectChip } from "../components/SelectChip";
import { LIFE_STAGE_OPTIONS } from "../onboarding/lifeStageOptions";
import { useOnboardingDraft } from "../onboarding/OnboardingDraftContext";
import type { GenderKey } from "../onboarding/types";
import { AuthStackParamList } from "../navigation/types";
import { colors, radius, spacing, typeScale } from "../theme";
import { fonts } from "../theme/typography";

type Props = NativeStackScreenProps<AuthStackParamList, "LifeStage">;

const GENDERS: { key: GenderKey; label: string }[] = [
  { key: "WOMAN", label: "Woman" },
  { key: "MAN", label: "Man" },
  { key: "PREFER_NOT_TO_SAY", label: "Rather not say" },
];

export function LifeStageScreen({ navigation }: Props) {
  const { draft, setGender, setLifeStage } = useOnboardingDraft();
  const canContinue = draft.gender !== null && draft.lifeStage !== null;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <OnboardingStepHeader step={2} onBack={() => navigation.goBack()} />

        <Text style={typeScale.h1}>A little about you</Text>

        <Text style={styles.sectionLabel}>I am…</Text>
        <View style={styles.chipRow}>
          {GENDERS.map((g) => (
            <SelectChip key={g.key} label={g.label} selected={draft.gender === g.key} onPress={() => setGender(g.key)} />
          ))}
        </View>
        <Text style={styles.hint}>Optional. Helps Saathi suggest things like cycle care or men's health sessions.</Text>

        <Text style={[styles.sectionLabel, styles.sectionGap]}>Which stage of life are you in?</Text>
        <Text style={styles.hint}>So Saathi can suggest what fits you. No birthday needed.</Text>

        <View style={styles.cards}>
          {LIFE_STAGE_OPTIONS.map((option) => {
            const selected = draft.lifeStage === option.key;
            return (
              <Pressable
                key={option.key}
                onPress={() => setLifeStage(option.key)}
                style={[
                  styles.stageCard,
                  { backgroundColor: selected ? option.tint : colors.surface },
                  selected && styles.stageCardSelected,
                ]}
              >
                <Text style={[styles.range, { color: option.accent }]}>{option.range}</Text>
                <View style={styles.stageCopy}>
                  <Text style={styles.stageTitle}>{option.title}</Text>
                  <Text style={styles.stageDesc}>{option.description}</Text>
                </View>
                <View style={[styles.radio, selected && styles.radioOn]} />
              </Pressable>
            );
          })}
        </View>

        <PrimaryButton label="Continue" disabled={!canContinue} onPress={() => navigation.navigate("Personalization")} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.flowHorizontal, paddingBottom: spacing.xxl, gap: spacing.md },
  sectionLabel: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.ink, marginTop: spacing.sm },
  sectionGap: { marginTop: spacing.lg },
  hint: { fontFamily: fonts.sans, fontSize: 13, color: colors.inkMuted, lineHeight: 19 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  cards: { gap: spacing.sm, marginTop: spacing.sm },
  stageCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stageCardSelected: { borderColor: colors.primary, borderWidth: 2 },
  range: { fontFamily: fonts.serif, fontSize: 22, width: 56 },
  stageCopy: { flex: 1, gap: 2 },
  stageTitle: { fontFamily: fonts.sansBold, fontSize: 16, color: colors.ink },
  stageDesc: { fontFamily: fonts.sans, fontSize: 13, color: colors.inkMuted },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
  },
  radioOn: { borderColor: colors.primary, backgroundColor: colors.primary },
});
