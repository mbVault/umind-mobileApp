import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { putPsychologistApplication } from "../api/psychologistApi";
import { StaffApiError } from "../api/staffClient";
import { ExpertHeader } from "../components/ExpertHeader";
import { PsychChipGroup } from "../components/PsychChipGroup";
import { PsychPrimaryButton } from "../components/PsychPrimaryButton";
import { PsychTextField } from "../components/PsychTextField";
import { YearsStepper } from "../components/YearsStepper";
import { LANGUAGE_OPTIONS, SPECIALISATION_OPTIONS } from "../onboarding/constants";
import { PsychologistStackParamList } from "../navigation/types";
import { fonts, psychColors, radius, spacing, typeScale } from "../theme";

type Props = NativeStackScreenProps<PsychologistStackParamList, "PsychologistApply">;

export function PsychologistApplyScreen({ navigation }: Props) {
  const [rci, setRci] = useState("");
  const [degree, setDegree] = useState("");
  const [years, setYears] = useState(6);
  const [specialisations, setSpecialisations] = useState<string[]>(["STRESS", "SLEEP", "BURNOUT"]);
  const [languages, setLanguages] = useState<string[]>(["HINDI", "ENGLISH"]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const earn = (499 * 0.7).toFixed(2);

  const onNext = async () => {
    setError(null);
    if (!rci.trim() || !degree.trim() || specialisations.length === 0 || languages.length === 0) {
      setError("Fill RCI, degree, and pick at least one specialisation and language.");
      return;
    }
    setLoading(true);
    try {
      await putPsychologistApplication({
        rciRegistrationNumber: rci.trim(),
        highestDegree: degree.trim(),
        yearsPractising: years,
        specialisations,
        languages,
      });
      navigation.navigate("PsychologistProfile");
    } catch (err) {
      setError(err instanceof StaffApiError ? err.message : "Could not save application draft.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ExpertHeader />
        <Text style={[typeScale.h1, styles.headline]}>
          Reach people who would never walk into a clinic.
        </Text>
        <Text style={styles.sub}>
          Clients come to you anonymous, already heard by Saathi, with a summary if they choose to
          share it.
        </Text>

        <PsychTextField
          label="RCI registration number"
          value={rci}
          onChangeText={setRci}
          autoCapitalize="characters"
          placeholder="e.g. A12345"
          focusedBorder
        />

        <View style={styles.row}>
          <View style={styles.degree}>
            <PsychTextField
              label="Highest degree"
              value={degree}
              onChangeText={setDegree}
              placeholder="M.Phil Clinical Psych."
            />
          </View>
          <YearsStepper label="Years practising" value={years} onChange={setYears} />
        </View>

        <PsychChipGroup
          label="What do you help with?"
          options={[...SPECIALISATION_OPTIONS]}
          selected={specialisations}
          onChange={setSpecialisations}
        />
        <PsychChipGroup
          label="Languages you can counsel in"
          options={[...LANGUAGE_OPTIONS]}
          selected={languages}
          onChange={setLanguages}
        />

        <View style={styles.earnRow}>
          <Text style={styles.earnCopy}>₹499 per 40-min session · you keep 70%</Text>
          <Text style={styles.earnAmount}>₹{earn}</Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PsychPrimaryButton label="Next: your profile" onPress={onNext} loading={loading} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: psychColors.background },
  content: {
    paddingHorizontal: spacing.flowHorizontal,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl * 2,
    gap: spacing.lg,
  },
  headline: { marginTop: spacing.md },
  sub: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    color: psychColors.inkMuted,
  },
  row: { flexDirection: "row", gap: spacing.md, alignItems: "flex-start" },
  degree: { flex: 1.2 },
  earnRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: psychColors.primaryTint,
    borderRadius: radius.input,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  earnCopy: {
    flex: 1,
    fontFamily: fonts.sansBold,
    fontSize: 13,
    color: psychColors.ink,
  },
  earnAmount: {
    fontFamily: fonts.sansExtraBold,
    fontSize: 15,
    color: psychColors.expertInk,
  },
  error: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: psychColors.coralInk,
  },
});
