import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  fetchPsychologistMe,
  PsychologistProfileDto,
  submitClarificationResponse,
} from "../api/psychologistApi";
import { StaffApiError } from "../api/staffClient";
import { OnboardingProgress } from "../components/OnboardingProgress";
import { PsychPrimaryButton } from "../components/PsychPrimaryButton";
import {
  buildVerificationRows,
  VerificationChecklist,
  VERIFICATION_CHECK_ORDER,
} from "../components/VerificationChecklist";
import { PsychologistStackParamList } from "../navigation/types";
import { fonts, psychColors, radius, spacing } from "../theme";

type Props = NativeStackScreenProps<PsychologistStackParamList, "PsychologistBackgroundCheck">;

const formatShortDate = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
};

/**
 * F3 — verification experience (States 6, 7A, 7B).
 * Clinic / LIVE only after publication. NEEDS_ATTENTION is clarification, not final reject.
 */
export function PsychologistBackgroundCheckScreen({ navigation }: Props) {
  const [profile, setProfile] = useState<PsychologistProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clarifyNote, setClarifyNote] = useState("");
  const [clarifyBusy, setClarifyBusy] = useState(false);

  const load = useCallback(async (mode: "boot" | "refresh" = "boot") => {
    if (mode === "boot") setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const me = await fetchPsychologistMe();
      setProfile(me);
      if (me.publicationStatus === "LIVE") {
        // Navigator remounts Main when access/profile refresh lands LIVE.
      }
    } catch (err) {
      setError(err instanceof StaffApiError ? err.message : "Could not load verification status.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load("boot");
    }, [load])
  );

  const rows = useMemo(() => buildVerificationRows(profile?.checks), [profile?.checks]);
  const verifiedCount = rows.filter((r) => r.status === "VERIFIED").length;
  const allVerified = verifiedCount === VERIFICATION_CHECK_ORDER.length;
  const anyNeedsAttention = rows.some((r) => r.status === "NEEDS_ATTENTION");
  const anyInProgress = rows.some((r) => r.status === "IN_PROGRESS");
  const publication = profile?.publicationStatus ?? "NOT_SUBMITTED";
  const isLive = publication === "LIVE";
  const awaitingPublish = publication === "VERIFIED_UNPUBLISHED" || (allVerified && !isLive);
  const needsDocs = profile?.applicantNextAction === "UPLOAD_DOC";
  const clarifyAction = profile?.applicantNextAction === "CLARIFY";
  const clarify = clarifyAction || anyNeedsAttention;

  const onSubmitClarification = async () => {
    if (!clarifyAction) return;
    setError(null);
    setClarifyBusy(true);
    try {
      const me = await submitClarificationResponse(clarifyNote.trim());
      setProfile(me);
      setClarifyNote("");
    } catch (err) {
      setError(err instanceof StaffApiError ? err.message : "Could not send clarification.");
    } finally {
      setClarifyBusy(false);
    }
  };

  // 7B / 7A / State 6 banners — never claim public bookability before LIVE.
  let bannerTitle = "BACKGROUND CHECK IN PROGRESS";
  let bannerHeadline = "Verification is underway. We’ll update each check as it moves.";
  let bannerNote =
    "This is not a final decision. You don’t need to do anything unless a check asks for attention.";

  if (isLive) {
    bannerTitle = "YOU'RE LIVE";
    bannerHeadline = "Your profile is published. Clients can find and book you.";
    bannerNote = "Open your professional workspace when you’re ready.";
  } else if (awaitingPublish) {
    bannerTitle = "VERIFICATION COMPLETE";
    bannerHeadline = "All checks are done. Awaiting publication.";
    bannerNote =
      "You’re not publicly bookable yet. U Mind will publish your profile when ready — the clinic opens only after that.";
  } else if (clarify) {
    bannerTitle = "CLARIFICATION NEEDED";
    bannerHeadline = "One or more checks need more information.";
    bannerNote =
      "Needs attention is not a final rejection. Update documents or details as asked, then wait for re-review.";
  } else if (anyInProgress || publication === "PENDING_VERIFICATION") {
    bannerTitle = "HR APPROVED · VERIFICATION PENDING";
    bannerHeadline = "Thanks — your application cleared HR screening.";
    bannerNote =
      "Background verification is next. Keep documents ready; we’ll flag anything that needs a clearer file.";
  }

  const submittedAt = profile?.applicationSubmittedAt;
  const applicantNote = profile?.applicantMessage?.trim();

  if (loading && !profile) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.boot}>
          <ActivityIndicator color={psychColors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void load("refresh")}
            tintColor={psychColors.primary}
          />
        }
      >
        <OnboardingProgress step={4} onBack={() => navigation.goBack()} />

        <View style={[styles.banner, clarify && !isLive ? styles.bannerWarn : null]}>
          <Text style={styles.bannerEyebrow}>{bannerTitle}</Text>
          <Text style={styles.bannerHeadline}>{bannerHeadline}</Text>
          <Text style={styles.bannerTimeline}>{bannerNote}</Text>
          {submittedAt ? (
            <Text style={styles.bannerMeta}>Submitted {formatShortDate(submittedAt)}</Text>
          ) : null}
          <Text style={styles.progressLabel}>
            {verifiedCount} of {VERIFICATION_CHECK_ORDER.length} checks verified
          </Text>
        </View>

        {applicantNote && (clarify || needsDocs) ? (
          <View style={styles.actionCard}>
            <Text style={styles.actionLabel}>What we need</Text>
            <Text style={styles.actionBody}>{applicantNote}</Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Verification checklist</Text>
        <VerificationChecklist checks={profile?.checks} yearsPractising={profile?.yearsPractising} />

        {clarifyAction ? (
          <TextInput
            style={styles.clarifyInput}
            value={clarifyNote}
            onChangeText={setClarifyNote}
            placeholder="Your response to the verification team"
            placeholderTextColor={psychColors.inkMuted}
            multiline
            maxLength={500}
            editable={!clarifyBusy}
          />
        ) : null}

        <View style={styles.privacy}>
          <Text style={styles.privacyText}>
            Documents are seen only by the U Mind verification team, never by clients. Needs attention
            means clarification — not a closed application.
          </Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {isLive ? (
          <PsychPrimaryButton
            label="Open professional workspace"
            onPress={() => navigation.navigate("PsychologistMain")}
          />
        ) : needsDocs ? (
          <PsychPrimaryButton
            label="Update documents"
            onPress={() => navigation.navigate("PsychologistDocumentsPlaceholder")}
          />
        ) : clarifyAction ? (
          <>
            <PsychPrimaryButton
              label="Send clarification"
              onPress={() => void onSubmitClarification()}
              loading={clarifyBusy}
              disabled={clarifyNote.trim().length < 3}
            />
            <PsychPrimaryButton
              label="Update documents"
              onPress={() => navigation.navigate("PsychologistDocumentsPlaceholder")}
              style={styles.secondaryBtn}
            />
          </>
        ) : clarify ? (
          <PsychPrimaryButton
            label="Review documents"
            onPress={() => navigation.navigate("PsychologistDocumentsPlaceholder")}
          />
        ) : (
          <PsychPrimaryButton label="Refresh status" onPress={() => void load("refresh")} loading={refreshing} />
        )}

        {!isLive ? (
          <Text style={styles.footnote}>
            Professional workspace opens only when your profile is published (LIVE).
          </Text>
        ) : null}

        <Pressable onPress={() => void load("refresh")} style={styles.refreshLink}>
          <Text style={styles.refreshText}>Pull to refresh · Tap to reload</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: psychColors.background },
  boot: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: {
    paddingHorizontal: spacing.flowHorizontal,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl * 2,
    gap: spacing.lg,
  },
  banner: {
    backgroundColor: psychColors.primary,
    borderRadius: radius.card,
    padding: spacing.xl + 4,
    gap: spacing.sm,
  },
  bannerWarn: {
    backgroundColor: psychColors.flagInk,
  },
  bannerEyebrow: {
    fontFamily: fonts.sansExtraBold,
    fontSize: 11,
    letterSpacing: 1.2,
    color: "rgba(255,255,255,0.85)",
  },
  bannerHeadline: {
    fontFamily: fonts.serif,
    fontSize: 26,
    lineHeight: 32,
    color: "#FFFFFF",
  },
  bannerTimeline: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 18,
    color: "rgba(255,255,255,0.9)",
  },
  bannerMeta: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
  },
  progressLabel: {
    marginTop: 4,
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
  },
  sectionTitle: {
    fontFamily: fonts.sansExtraBold,
    fontSize: 13,
    letterSpacing: 0.6,
    color: psychColors.inkMuted,
    textTransform: "uppercase",
    marginBottom: -8,
  },
  actionCard: {
    backgroundColor: psychColors.flagBg,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: psychColors.flagBorder,
    padding: spacing.lg,
    gap: 6,
  },
  actionLabel: {
    fontFamily: fonts.sansExtraBold,
    fontSize: 12,
    color: psychColors.flagInk,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  actionBody: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    color: psychColors.ink,
  },
  clarifyInput: {
    minHeight: 96,
    borderRadius: radius.input,
    borderWidth: 1.5,
    borderColor: psychColors.border,
    backgroundColor: psychColors.surface,
    padding: 14,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: psychColors.ink,
    textAlignVertical: "top",
  },
  secondaryBtn: {
    backgroundColor: psychColors.ink,
  },
  privacy: {
    backgroundColor: psychColors.sunTint,
    borderRadius: radius.input,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "#F0D9A8",
  },
  privacyText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 19,
    color: psychColors.sunInk,
  },
  footnote: {
    textAlign: "center",
    fontFamily: fonts.sans,
    fontSize: 12,
    color: psychColors.inkMuted,
    marginTop: -spacing.sm,
  },
  error: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: psychColors.coralInk,
  },
  refreshLink: { alignItems: "center", paddingVertical: spacing.sm },
  refreshText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: psychColors.primary,
  },
});
