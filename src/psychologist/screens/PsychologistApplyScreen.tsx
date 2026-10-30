import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { putPsychologistApplication, submitForHrReview } from "../api/psychologistApi";
import { StaffApiError } from "../api/staffClient";
import { usePsychologistAuth } from "../auth/PsychologistAuthContext";
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
  const { isApplicant, profile, refreshAccess } = usePsychologistAuth();
  const canResubmit = profile?.applicantNextAction === "RESUBMIT" && !profile?.identityOnboardingBlocked;
  const blocked = Boolean(profile?.identityOnboardingBlocked) || profile?.applicantNextAction === "NONE";
  const editingExisting = Boolean(
    profile?.legalFullName || profile?.rciRegistrationNumber || profile?.applicationSubmittedAt
  );

  const [legalName, setLegalName] = useState("");
  const [rci, setRci] = useState("");
  const [degree, setDegree] = useState("");
  const [years, setYears] = useState(6);
  const [specialisations, setSpecialisations] = useState<string[]>(["STRESS", "SLEEP", "BURNOUT"]);
  const [languages, setLanguages] = useState<string[]>(["HINDI", "ENGLISH"]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prefilled, setPrefilled] = useState(false);

  useEffect(() => {
    if (!profile || prefilled) return;
    if (profile.legalFullName) setLegalName(profile.legalFullName);
    if (profile.rciRegistrationNumber) setRci(profile.rciRegistrationNumber);
    if (profile.highestDegree) setDegree(profile.highestDegree);
    if (profile.yearsPractising != null) setYears(profile.yearsPractising);
    if (profile.specialisations?.length) setSpecialisations(profile.specialisations);
    if (profile.languages?.length) setLanguages(profile.languages);
    setPrefilled(true);
  }, [profile, prefilled]);

  const earn = (499 * 0.7).toFixed(2);

  const onNext = async () => {
    setError(null);
    if (
      !legalName.trim() ||
      !rci.trim() ||
      !degree.trim() ||
      specialisations.length === 0 ||
      languages.length === 0
    ) {
      setError("Fill legal name, RCI, degree, and pick at least one specialisation and language.");
      return;
    }
    setLoading(true);
    try {
      await putPsychologistApplication({
        legalFullName: legalName.trim(),
        rciRegistrationNumber: rci.trim(),
        highestDegree: degree.trim(),
        yearsPractising: years,
        specialisations,
        languages,
      });
      await refreshAccess();

      if (blocked) {
        setError("This application was finally rejected and cannot be edited.");
        return;
      }

      // State 5 / 8A: save + resubmit only when nextAction is RESUBMIT.
      if (canResubmit) {
        await submitForHrReview();
        await refreshAccess();
        navigation.navigate("PsychologistPendingReview");
        return;
      }

      // Already in HR screening — save edits and return to status hub.
      if (isApplicant && profile?.applicationSubmittedAt) {
        navigation.navigate("PsychologistPendingReview");
        return;
      }

      navigation.navigate("PsychologistProfile");
    } catch (err) {
      setError(err instanceof StaffApiError ? err.message : "Could not save application draft.");
    } finally {
      setLoading(false);
    }
  };

  const headline = canResubmit
    ? "Update your application"
    : editingExisting
      ? "Your application details"
      : "Reach people who would never walk into a clinic.";

  const sub = blocked
    ? "This application is closed. You cannot edit or resubmit."
    : canResubmit
      ? "Correct the fields that were returned, then resubmit. Same account — no need to onboard again."
      : isApplicant
        ? "Apply to join U Mind. After you finish your profile, we send this to HR screening. Documents come after approval."
        : "Clients come to you anonymous, already heard by Saathi, with a summary if they choose to share it.";

  const cta = canResubmit
    ? "Save & resubmit for review"
    : editingExisting && profile?.applicationSubmittedAt
      ? "Save changes"
      : "Next: your profile";

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ExpertHeader />
        <Text style={[typeScale.h1, styles.headline]}>{headline}</Text>
        <Text style={styles.sub}>{sub}</Text>

        <PsychTextField
          label="Legal full name"
          value={legalName}
          onChangeText={setLegalName}
          placeholder="As on your ID / RCI"
          focusedBorder
        />

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

        <PsychPrimaryButton label={cta} onPress={onNext} loading={loading} disabled={blocked} />
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
