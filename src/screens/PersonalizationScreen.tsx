import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { OnboardingStepHeader } from "../components/OnboardingStepHeader";
import { PrimaryButton } from "../components/PrimaryButton";
import { SelectChip } from "../components/SelectChip";
import { useOnboardingDraft } from "../onboarding/OnboardingDraftContext";
import type { StartingFeelingKey } from "../onboarding/types";
import { AuthStackParamList } from "../navigation/types";
import { colors, spacing, typeScale } from "../theme";
import { fonts } from "../theme/typography";

type Props = NativeStackScreenProps<AuthStackParamList, "Personalization">;

const BRINGS_YOU_HERE: { key: StartingFeelingKey; label: string }[] = [
  { key: "STRESSED", label: "Stress & work" },
  { key: "ANXIOUS", label: "Anxiety / ghabrahat" },
  { key: "CANT_SLEEP", label: "Sleep" },
  { key: "LONELY", label: "Loneliness" },
  { key: "LOW", label: "Self-care" },
  { key: "GHABRAHAT", label: "Relationships" },
] as const;

const CHECK_IN = ["Morning", "Afternoon", "Evening", "Before bed", "Only when I open it"];
const UNWIND = ["Breathing", "Walking", "Talking it out", "Calm sounds", "Writing", "Ayurveda routines"];
const LANGUAGE = ["Hindi", "English", "Hinglish"];

export function PersonalizationScreen({ navigation }: Props) {
  const { draft, toggleStartingFeeling, setSaathiCheckIn, toggleUnwindHabit, setSaathiLanguage } = useOnboardingDraft();

  const canContinue =
    draft.startingFeelings.length > 0 &&
    draft.saathiCheckIn !== null &&
    draft.unwindHabits.length > 0 &&
    draft.saathiLanguage !== null;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <OnboardingStepHeader step={3} onBack={() => navigation.goBack()} />

        <Text style={typeScale.h1}>Let's make U Mind yours</Text>
        <Text style={[typeScale.bodyLarge, styles.lead]}>4 quick questions. Change them any time in My space.</Text>

        <Text style={styles.question}>1. What brings you here? <Text style={styles.pickAny}>Pick any</Text></Text>
        <View style={styles.chipWrap}>
          {BRINGS_YOU_HERE.map((item) => (
            <SelectChip
              key={item.key}
              label={item.label}
              selected={draft.startingFeelings.includes(item.key)}
              onPress={() => toggleStartingFeeling(item.key)}
            />
          ))}
        </View>

        <Text style={styles.question}>2. When should Saathi check in on you?</Text>
        <View style={styles.chipWrap}>
          {CHECK_IN.map((label) => (
            <SelectChip
              key={label}
              label={label}
              selected={draft.saathiCheckIn === label}
              onPress={() => setSaathiCheckIn(label)}
            />
          ))}
        </View>

        <Text style={styles.question}>3. What helps you unwind? <Text style={styles.pickAny}>Pick any</Text></Text>
        <View style={styles.chipWrap}>
          {UNWIND.map((label) => (
            <SelectChip
              key={label}
              label={label}
              selected={draft.unwindHabits.includes(label)}
              onPress={() => toggleUnwindHabit(label)}
            />
          ))}
        </View>

        <Text style={styles.question}>4. Saathi should talk to me in…</Text>
        <View style={styles.chipWrap}>
          {LANGUAGE.map((label) => (
            <SelectChip
              key={label}
              label={label}
              selected={draft.saathiLanguage === label}
              onPress={() => setSaathiLanguage(label)}
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
  lead: { marginBottom: spacing.sm },
  question: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.ink, marginTop: spacing.sm },
  pickAny: { fontFamily: fonts.sans, fontSize: 13, color: colors.inkMuted },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
});
