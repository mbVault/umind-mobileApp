import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { OnboardingStepHeader } from "../components/OnboardingStepHeader";
import { PrimaryButton } from "../components/PrimaryButton";
import { SelectChip } from "../components/SelectChip";
import {
  CHECK_IN_MODE_OPTIONS,
  FEELING_OPTIONS,
  LANGUAGE_OPTIONS,
  UNWIND_CATEGORIES,
  UNWIND_OPTIONS,
  slotsByGroup,
} from "../onboarding/catalog";
import { useOnboardingDraft } from "../onboarding/OnboardingDraftContext";
import { AuthStackParamList } from "../navigation/types";
import { colors, spacing, typeScale } from "../theme";
import { fonts } from "../theme/typography";

type Props = NativeStackScreenProps<AuthStackParamList, "Personalization">;

export function PersonalizationScreen({ navigation }: Props) {
  const {
    draft,
    toggleStartingFeeling,
    setSaathiCheckInMode,
    toggleCheckInSlot,
    toggleUnwindHabit,
    setSaathiLanguage,
  } = useOnboardingDraft();

  const checkInOk =
    draft.saathiCheckInMode === "ONLY_WHEN_OPEN" ||
    (draft.saathiCheckInMode === "SCHEDULED" && draft.saathiCheckInSlots.length > 0);

  const canContinue =
    draft.startingFeelings.length > 0 &&
    draft.saathiLanguage !== null &&
    checkInOk &&
    draft.unwindHabits.length > 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <OnboardingStepHeader step={3} totalSteps={4} onBack={() => navigation.goBack()} />

        <Text style={typeScale.h1}>What brings you here?</Text>
        <Text style={[typeScale.bodyLarge, styles.lead]}>A few quick questions. Change them any time later.</Text>

        <Text style={styles.question}>
          What would you like support with? <Text style={styles.pickAny}>Pick any</Text>
        </Text>
        <View style={styles.chipWrap}>
          {FEELING_OPTIONS.map((item) => (
            <SelectChip
              key={item.id}
              label={item.label}
              selected={draft.startingFeelings.includes(item.id)}
              onPress={() => toggleStartingFeeling(item.id)}
            />
          ))}
        </View>

        <Text style={styles.question}>When would you like a gentle check-in?</Text>
        <View style={styles.chipWrap}>
          {CHECK_IN_MODE_OPTIONS.map((item) => (
            <SelectChip
              key={item.id}
              label={item.label}
              selected={draft.saathiCheckInMode === item.id}
              onPress={() => setSaathiCheckInMode(item.id)}
            />
          ))}
        </View>

        {draft.saathiCheckInMode === "SCHEDULED" ? (
          <>
            <Text style={styles.hint}>Pick one or more hourly windows. At most one check-in per day.</Text>
            {slotsByGroup().map(({ group, slots }) => (
              <View key={group} style={styles.groupBlock}>
                <Text style={styles.groupLabel}>{group}</Text>
                <View style={styles.chipWrap}>
                  {slots.map((slot) => (
                    <SelectChip
                      key={slot.id}
                      label={slot.label}
                      selected={draft.saathiCheckInSlots.includes(slot.id)}
                      onPress={() => toggleCheckInSlot(slot.id)}
                    />
                  ))}
                </View>
              </View>
            ))}
          </>
        ) : null}

        <Text style={styles.question}>
          What helps you unwind? <Text style={styles.pickAny}>Pick any</Text>
        </Text>
        {UNWIND_CATEGORIES.map((category) => {
          const items = UNWIND_OPTIONS.filter((u) => u.category === category);
          if (items.length === 0) return null;
          return (
            <View key={category} style={styles.groupBlock}>
              <Text style={styles.groupLabel}>{category}</Text>
              <View style={styles.chipWrap}>
                {items.map((item) => (
                  <SelectChip
                    key={item.id}
                    label={item.label}
                    selected={draft.unwindHabits.includes(item.id)}
                    onPress={() => toggleUnwindHabit(item.id)}
                  />
                ))}
              </View>
            </View>
          );
        })}
        <View style={styles.chipWrap}>
          {UNWIND_OPTIONS.filter((u) => u.category === null).map((item) => (
            <SelectChip
              key={item.id}
              label={item.label}
              selected={draft.unwindHabits.includes(item.id)}
              onPress={() => toggleUnwindHabit(item.id)}
            />
          ))}
        </View>

        <Text style={styles.question}>I prefer to talk in…</Text>
        <View style={styles.chipWrap}>
          {LANGUAGE_OPTIONS.map((item) => (
            <SelectChip
              key={item.id}
              label={item.label}
              selected={draft.saathiLanguage === item.id}
              onPress={() => setSaathiLanguage(item.id)}
            />
          ))}
        </View>

        <PrimaryButton label="Continue" disabled={!canContinue} onPress={() => navigation.navigate("ThemeCity")} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.flowHorizontal, paddingBottom: spacing.xxl, gap: spacing.md },
  lead: { color: colors.inkMuted },
  question: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.ink, marginTop: spacing.sm },
  pickAny: { fontFamily: fonts.sans, fontSize: 13, color: colors.inkMuted },
  hint: { fontFamily: fonts.sans, fontSize: 13, color: colors.inkMuted, lineHeight: 19 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  groupBlock: { gap: spacing.sm },
  groupLabel: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.inkMuted },
});
