import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  fetchPsychologistMe,
  patchPsychologistProfile,
  submitForHrReview,
} from "../api/psychologistApi";
import { StaffApiError } from "../api/staffClient";
import { usePsychologistAuth } from "../auth/PsychologistAuthContext";
import { OnboardingProgress } from "../components/OnboardingProgress";
import { PsychPrimaryButton } from "../components/PsychPrimaryButton";
import { PsychTextField } from "../components/PsychTextField";
import { PsychologistStackParamList } from "../navigation/types";
import { avatarColors, fonts, psychColors, radius, spacing, typeScale } from "../theme";

type Props = NativeStackScreenProps<PsychologistStackParamList, "PsychologistProfile">;

type Visibility = "REAL_NAME_AND_PHOTO" | "DISPLAY_NAME_AND_AVATAR";

/** Match Psycho-3 swatch order: green, purple, orange, pink, blue, gold */
const PROFILE_AVATAR_COLORS = [
  avatarColors[2],
  avatarColors[1],
  avatarColors[0],
  avatarColors[3],
  avatarColors[4],
  avatarColors[5],
] as const;

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 1).toUpperCase();
  return `${parts[0]!.slice(0, 1)}${parts[parts.length - 1]!.slice(0, 1)}`.toUpperCase();
}

export function PsychologistProfileScreen({ navigation }: Props) {
  const { isApplicant, refreshAccess } = usePsychologistAuth();
  const [visibility, setVisibility] = useState<Visibility>("DISPLAY_NAME_AND_AVATAR");
  const [displayName, setDisplayName] = useState("");
  const [avatarColor, setAvatarColor] = useState<string>(PROFILE_AVATAR_COLORS[0]);
  const [legalFullName, setLegalFullName] = useState<string | null>(null);
  const [highestDegree, setHighestDegree] = useState<string | null>(null);
  const [yearsPractising, setYearsPractising] = useState<number | null>(null);
  const [languages, setLanguages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await fetchPsychologistMe();
        if (cancelled) return;
        setLegalFullName(me.legalFullName);
        setHighestDegree(me.highestDegree);
        setYearsPractising(me.yearsPractising);
        setLanguages(me.languages);
        if (me.visibilityMode === "REAL_NAME_AND_PHOTO" || me.visibilityMode === "DISPLAY_NAME_AND_AVATAR") {
          setVisibility(me.visibilityMode);
        }
        if (me.displayName) setDisplayName(me.displayName);
        if (me.avatarColor) setAvatarColor(me.avatarColor);
      } catch {
        // Keep defaults if profile fetch fails; save will surface errors.
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const previewName =
    visibility === "REAL_NAME_AND_PHOTO"
      ? legalFullName?.trim() || displayName.trim() || "Your name"
      : displayName.trim() || "Counsellor";

  const previewInitial = useMemo(() => initialsFromName(previewName).slice(0, 1), [previewName]);

  const langLabel = languages
    .map((c) => c.charAt(0) + c.slice(1).toLowerCase())
    .join(", ");

  const subtitleParts = [
    highestDegree?.trim() || "Psychologist",
    yearsPractising != null ? `${yearsPractising} yrs` : null,
    langLabel || null,
  ].filter(Boolean);

  const onSave = async () => {
    setError(null);
    if (visibility === "DISPLAY_NAME_AND_AVATAR" && !displayName.trim()) {
      setError("Enter the display name clients will see.");
      return;
    }
    if (visibility === "REAL_NAME_AND_PHOTO" && !legalFullName?.trim()) {
      setError("Add your legal full name on Apply before choosing real name & photo.");
      return;
    }
    setLoading(true);
    try {
      const initials = initialsFromName(
        visibility === "REAL_NAME_AND_PHOTO" ? legalFullName!.trim() : displayName.trim()
      );
      await patchPsychologistProfile({
        visibilityMode: visibility,
        displayName:
          visibility === "DISPLAY_NAME_AND_AVATAR"
            ? displayName.trim()
            : legalFullName!.trim().slice(0, 80),
        avatarColor,
        avatarInitials: initials.slice(0, 4),
      });
      // F1: applicants submit for HR after profile; documents come after approval (F2).
      if (isApplicant) {
        await submitForHrReview();
        await refreshAccess();
        navigation.navigate("PsychologistPendingReview");
        return;
      }
      await refreshAccess();
      navigation.navigate("PsychologistDocumentsPlaceholder");
    } catch (err) {
      setError(err instanceof StaffApiError ? err.message : "Could not save profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <OnboardingProgress step={2} onBack={() => navigation.goBack()} />

        <Text style={[typeScale.h1, styles.title]}>How should clients see you?</Text>
        <Text style={styles.sub}>Your choice. U Mind verifies your real identity either way.</Text>

        <Pressable
          accessibilityRole="radio"
          accessibilityState={{ selected: visibility === "REAL_NAME_AND_PHOTO" }}
          onPress={() => setVisibility("REAL_NAME_AND_PHOTO")}
          style={[styles.option, visibility === "REAL_NAME_AND_PHOTO" && styles.optionSelected]}
        >
          <View style={[styles.radio, visibility === "REAL_NAME_AND_PHOTO" && styles.radioOn]}>
            {visibility === "REAL_NAME_AND_PHOTO" ? <View style={styles.radioDot} /> : null}
          </View>
          <View style={styles.optionCopy}>
            <Text style={styles.optionTitle}>Real name & photo</Text>
            <Text style={styles.optionSub}>Builds trust fastest with new clients.</Text>
          </View>
        </Pressable>

        <Pressable
          accessibilityRole="radio"
          accessibilityState={{ selected: visibility === "DISPLAY_NAME_AND_AVATAR" }}
          onPress={() => setVisibility("DISPLAY_NAME_AND_AVATAR")}
          style={[styles.option, visibility === "DISPLAY_NAME_AND_AVATAR" && styles.optionSelected]}
        >
          <View style={[styles.radio, visibility === "DISPLAY_NAME_AND_AVATAR" && styles.radioOn]}>
            {visibility === "DISPLAY_NAME_AND_AVATAR" ? <View style={styles.radioDot} /> : null}
          </View>
          <View style={styles.optionCopy}>
            <Text style={styles.optionTitle}>Display name & avatar</Text>
            <Text style={styles.optionSub}>Keep your identity private, like your clients.</Text>
          </View>
        </Pressable>

        {visibility === "DISPLAY_NAME_AND_AVATAR" ? (
          <>
            <PsychTextField
              label="Display name clients will see"
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Counsellor Meher"
              focusedBorder
            />
            <Text style={styles.swatchLabel}>Pick an avatar colour</Text>
            <View style={styles.swatches}>
              {PROFILE_AVATAR_COLORS.map((color) => {
                const selected = color === avatarColor;
                return (
                  <Pressable
                    key={color}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setAvatarColor(color)}
                    style={[
                      styles.swatch,
                      { backgroundColor: color },
                      selected && styles.swatchSelected,
                    ]}
                  >
                    <Text style={styles.swatchLetter}>{previewInitial}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : (
          <Text style={styles.photoHint}>
            Photo upload happens with your documents. Clients will see your verified legal name.
          </Text>
        )}

        <Text style={styles.previewLabel}>CLIENTS WILL SEE</Text>
        <View style={styles.previewCard}>
          <View style={[styles.previewAvatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.previewAvatarText}>{previewInitial}</Text>
          </View>
          <View style={styles.previewCopy}>
            <Text style={styles.previewName}>{previewName}</Text>
            <Text style={styles.previewMeta}>{subtitleParts.join(" · ")}</Text>
            <View style={styles.verifiedPill}>
              <Text style={styles.verifiedText}>Background-verified</Text>
            </View>
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PsychPrimaryButton
          label={isApplicant ? "Submit for HR review" : "Next: upload documents"}
          onPress={onSave}
          loading={loading || booting}
          disabled={booting}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: psychColors.background },
  content: {
    paddingHorizontal: spacing.flowHorizontal,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl * 2,
    gap: spacing.lg,
  },
  title: { marginTop: spacing.sm },
  sub: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    color: psychColors.inkMuted,
    marginTop: -spacing.sm,
  },
  option: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
    backgroundColor: psychColors.surface,
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderColor: psychColors.border,
    padding: spacing.lg,
  },
  optionSelected: {
    borderColor: psychColors.primary,
    backgroundColor: psychColors.primaryTint,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: psychColors.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  radioOn: { borderColor: psychColors.primary },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: psychColors.primary,
  },
  optionCopy: { flex: 1, gap: 4 },
  optionTitle: {
    fontFamily: fonts.sansExtraBold,
    fontSize: 16,
    color: psychColors.ink,
  },
  optionSub: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 18,
    color: psychColors.inkMuted,
  },
  swatchLabel: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    color: psychColors.ink,
  },
  swatches: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  swatch: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  swatchSelected: {
    borderWidth: 3,
    borderColor: psychColors.ink,
  },
  swatchLetter: {
    fontFamily: fonts.sansExtraBold,
    fontSize: 18,
    color: "#FFFFFF",
  },
  photoHint: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 19,
    color: psychColors.inkMuted,
    backgroundColor: psychColors.surface,
    borderRadius: radius.input,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: psychColors.border,
  },
  previewLabel: {
    fontFamily: fonts.sansExtraBold,
    fontSize: 11,
    letterSpacing: 1,
    color: psychColors.inkMuted,
  },
  previewCard: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
    backgroundColor: psychColors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: psychColors.border,
  },
  previewAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  previewAvatarText: {
    fontFamily: fonts.sansExtraBold,
    fontSize: 22,
    color: "#FFFFFF",
  },
  previewCopy: { flex: 1, gap: 4 },
  previewName: {
    fontFamily: fonts.sansExtraBold,
    fontSize: 17,
    color: psychColors.ink,
  },
  previewMeta: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: psychColors.inkMuted,
  },
  verifiedPill: {
    alignSelf: "flex-start",
    marginTop: 4,
    backgroundColor: psychColors.mintTint,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  verifiedText: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    color: psychColors.mintInk,
  },
  error: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: psychColors.coralInk,
  },
});
