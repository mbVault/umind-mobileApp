import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { OnboardingStepHeader } from "../components/OnboardingStepHeader";
import { PrimaryButton } from "../components/PrimaryButton";
import { SelectChip } from "../components/SelectChip";
import { CITY_SUGGESTIONS, THEME_OPTIONS } from "../onboarding/themeOptions";
import { useOnboardingDraft } from "../onboarding/OnboardingDraftContext";
import { AuthStackParamList } from "../navigation/types";
import { colors, radius, spacing, typeScale } from "../theme";
import { fonts } from "../theme/typography";

type Props = NativeStackScreenProps<AuthStackParamList, "ThemeCity">;

export function ThemeCityScreen({ navigation }: Props) {
  const { draft, setAppTheme, setCity } = useOnboardingDraft();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <OnboardingStepHeader step={4} onBack={() => navigation.goBack()} />

        <Text style={typeScale.h1}>Pick your colours</Text>
        <Text style={[typeScale.bodyLarge, styles.lead]}>The whole app changes to match. Tap to try.</Text>

        <View style={styles.themeGrid}>
          {THEME_OPTIONS.map((theme) => {
            const selected = draft.appTheme === theme.key;
            return (
              <Pressable
                key={theme.key}
                onPress={() => setAppTheme(theme.key)}
                style={[
                  styles.themeCard,
                  { backgroundColor: theme.cardTint },
                  selected && styles.themeCardSelected,
                ]}
              >
                <View style={styles.swatches}>
                  <View style={[styles.swatch, { backgroundColor: theme.swatches[0] }]} />
                  <View style={[styles.swatch, { backgroundColor: theme.swatches[1] }]} />
                </View>
                <Text style={styles.themeLabel}>{theme.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.cityTitle}>Your city</Text>
        <Text style={styles.cityHint}>Only for weather-based tips, like the best time for a walk. Never shared.</Text>
        <TextInput
          value={draft.city}
          onChangeText={setCity}
          style={styles.cityInput}
          placeholder="Delhi"
          placeholderTextColor={colors.inkMuted}
        />
        <View style={styles.chipWrap}>
          {CITY_SUGGESTIONS.map((city) => (
            <SelectChip key={city} label={city} selected={draft.city === city} onPress={() => setCity(city)} />
          ))}
        </View>

        <PrimaryButton label="Continue" onPress={() => navigation.navigate("Trial")} style={styles.cta} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.flowHorizontal, paddingBottom: spacing.xxl, gap: spacing.md },
  lead: { marginBottom: spacing.sm },
  themeGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  themeCard: {
    width: "31%",
    flexGrow: 1,
    minWidth: 100,
    padding: spacing.lg,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "transparent",
    gap: spacing.sm,
  },
  themeCardSelected: { borderColor: colors.primary, borderWidth: 2 },
  swatches: { flexDirection: "row", gap: spacing.sm },
  swatch: { width: 28, height: 28, borderRadius: 14 },
  themeLabel: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.ink },
  cityTitle: { fontFamily: fonts.sansBold, fontSize: 16, color: colors.ink, marginTop: spacing.lg },
  cityHint: { fontFamily: fonts.sans, fontSize: 13, color: colors.inkMuted },
  cityInput: {
    height: 52,
    borderRadius: radius.input,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    fontFamily: fonts.sansBold,
    fontSize: 16,
    color: colors.ink,
  },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  cta: { marginTop: spacing.lg },
});
