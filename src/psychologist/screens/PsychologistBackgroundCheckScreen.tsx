import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { fetchPsychologistMe, PsychologistCheckDto, PsychologistProfileDto } from "../api/psychologistApi";
import { StaffApiError } from "../api/staffClient";
import { OnboardingProgress } from "../components/OnboardingProgress";
import { PsychPrimaryButton } from "../components/PsychPrimaryButton";
import { PsychologistStackParamList } from "../navigation/types";
import { fonts, psychColors, radius, spacing } from "../theme";

type Props = NativeStackScreenProps<PsychologistStackParamList, "PsychologistBackgroundCheck">;

type CheckStatus = "QUEUED" | "IN_PROGRESS" | "VERIFIED" | "NEEDS_ATTENTION";

const CHECK_ORDER = ["IDENTITY", "RCI_REGISTRATION", "DEGREE", "YEARS_OF_EXPERIENCE"] as const;

const CHECK_COPY: Record<
  (typeof CHECK_ORDER)[number],
  { title: string; verified: string; inProgress: string; queued: string; needsAttention: string }
> = {
  IDENTITY: {
    title: "Identity",
    verified: "Govt ID matched to your selfie and photo",
    inProgress: "Matching your govt ID to selfie and photo",
    queued: "Waiting to match govt ID to your selfie and photo",
    needsAttention: "Identity needs a clearer ID or selfie",
  },
  RCI_REGISTRATION: {
    title: "RCI registration",
    verified: "Checked against the RCI register",
    inProgress: "Checking against the RCI register",
    queued: "Queued to check against the RCI register",
    needsAttention: "RCI number could not be verified — please re-check",
  },
  DEGREE: {
    title: "Degree",
    verified: "Confirmed with your university",
    inProgress: "Confirming with your university",
    queued: "Queued to confirm with your university",
    needsAttention: "Degree documents need attention",
  },
  YEARS_OF_EXPERIENCE: {
    title: "Years of experience",
    verified: "Experience letters verified",
    inProgress: "Checking experience letters",
    queued: "Queued to check experience letters",
    needsAttention: "Experience letters need attention",
  },
};

const formatShortDate = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
};

const addWorkingDays = (from: Date, days: number): Date => {
  const out = new Date(from);
  let left = days;
  while (left > 0) {
    out.setDate(out.getDate() + 1);
    const dow = out.getDay();
    if (dow !== 0 && dow !== 6) left -= 1;
  }
  return out;
};

const statusBadge = (status: CheckStatus) => {
  switch (status) {
    case "VERIFIED":
      return { label: "Verified", bg: psychColors.mintTint, ink: psychColors.mintInk };
    case "IN_PROGRESS":
      return { label: "In progress", bg: psychColors.sunTint, ink: psychColors.sunInk };
    case "NEEDS_ATTENTION":
      return { label: "Needs attention", bg: psychColors.coralTint, ink: psychColors.coralInk };
    default:
      return { label: "Queued", bg: psychColors.primaryTint, ink: psychColors.primary };
  }
};

const statusIcon = (status: CheckStatus) => {
  switch (status) {
    case "VERIFIED":
      return { bg: psychColors.mintTint, glyph: "✓", color: psychColors.mintInk };
    case "IN_PROGRESS":
      return { bg: psychColors.sunTint, glyph: "◷", color: psychColors.sunInk };
    case "NEEDS_ATTENTION":
      return { bg: psychColors.coralTint, glyph: "!", color: psychColors.coralInk };
    default:
      return { bg: psychColors.primaryTint, glyph: "◷", color: psychColors.primary };
  }
};

const descriptionFor = (
  type: (typeof CHECK_ORDER)[number],
  status: CheckStatus,
  yearsPractising: number | null
): string => {
  const copy = CHECK_COPY[type];
  if (status === "VERIFIED") return copy.verified;
  if (status === "IN_PROGRESS") {
    if (type === "YEARS_OF_EXPERIENCE" && yearsPractising != null) {
      return `Checking experience letters, ${yearsPractising} yrs claimed`;
    }
    return copy.inProgress;
  }
  if (status === "NEEDS_ATTENTION") return copy.needsAttention;
  if (type === "YEARS_OF_EXPERIENCE" && yearsPractising != null) {
    return `Checking experience letters, ${yearsPractising} yrs claimed`;
  }
  return copy.queued;
};

export function PsychologistBackgroundCheckScreen({ navigation }: Props) {
  const [profile, setProfile] = useState<PsychologistProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (mode: "boot" | "refresh" = "boot") => {
    if (mode === "boot") setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const me = await fetchPsychologistMe();
      setProfile(me);
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

  const checksByType = useMemo(() => {
    const map = new Map<string, PsychologistCheckDto>();
    for (const c of profile?.checks ?? []) map.set(c.type, c);
    return map;
  }, [profile]);

  const rows = CHECK_ORDER.map((type) => {
    const row = checksByType.get(type);
    const status = (row?.status as CheckStatus | undefined) ?? "QUEUED";
    return { type, status, id: row?.id };
  });

  const verifiedCount = rows.filter((r) => r.status === "VERIFIED").length;
  const allVerified = verifiedCount === CHECK_ORDER.length;
  const anyNeedsAttention = rows.some((r) => r.status === "NEEDS_ATTENTION");
  const isLive = profile?.publicationStatus === "LIVE";

  const submittedAt = profile?.applicationSubmittedAt
    ? new Date(profile.applicationSubmittedAt)
    : null;
  const expectedStart = submittedAt ? addWorkingDays(submittedAt, 3) : null;
  const expectedEnd = submittedAt ? addWorkingDays(submittedAt, 5) : null;

  const bannerTitle = isLive
    ? "YOU'RE LIVE"
    : anyNeedsAttention
      ? "ACTION NEEDED ON YOUR CHECKS"
      : allVerified
        ? "CHECKS COMPLETE"
        : "BACKGROUND CHECK IN PROGRESS";

  const bannerHeadline = isLive
    ? "Clients can find and book you now."
    : anyNeedsAttention
      ? "Fix the items marked Needs attention, then resubmit docs if asked."
      : allVerified
        ? "All four checks passed. U Mind will publish you shortly."
        : "You'll be live in 3–5 working days";

  const timeline =
    submittedAt && expectedStart && expectedEnd
      ? `Submitted ${formatShortDate(submittedAt.toISOString())} · Expected ${formatShortDate(
          expectedStart.toISOString()
        )}–${formatShortDate(expectedEnd.toISOString()).replace(/^[A-Za-z]+,\s*/, "")}`
      : "Submit your application to start the background check.";

  const progressPct = Math.max(0.08, verifiedCount / CHECK_ORDER.length);

  const onHoursCta = () => {
    // Enter main shell (Today is live). Hours tab is next full build.
    navigation.navigate("PsychologistMain");
  };

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
          <RefreshControl refreshing={refreshing} onRefresh={() => void load("refresh")} tintColor={psychColors.primary} />
        }
      >
        <OnboardingProgress step={4} onBack={() => navigation.goBack()} />

        <View style={styles.banner}>
          <Text style={styles.bannerEyebrow}>{bannerTitle}</Text>
          <Text style={styles.bannerHeadline}>{bannerHeadline}</Text>
          <Text style={styles.bannerTimeline}>{timeline}</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPct * 100}%` }]} />
          </View>
          <Text style={styles.progressLabel}>
            {verifiedCount} of {CHECK_ORDER.length} checks done
          </Text>
        </View>

        <View style={styles.checklist}>
          {rows.map((row) => {
            const badge = statusBadge(row.status);
            const icon = statusIcon(row.status);
            return (
              <View key={row.type} style={styles.checkRow}>
                <View style={[styles.checkIcon, { backgroundColor: icon.bg }]}>
                  <Text style={[styles.checkGlyph, { color: icon.color }]}>{icon.glyph}</Text>
                </View>
                <View style={styles.checkCopy}>
                  <Text style={styles.checkTitle}>{CHECK_COPY[row.type].title}</Text>
                  <Text style={styles.checkSub}>
                    {descriptionFor(row.type, row.status, profile?.yearsPractising ?? null)}
                  </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.badgeText, { color: badge.ink }]}>{badge.label}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.privacy}>
          <View style={styles.privacyBadge}>
            <Text style={styles.privacyBadgeText}>OK</Text>
          </View>
          <Text style={styles.privacyText}>
            Your documents are seen only by the U Mind verification team, never by clients. We&apos;ll
            message you as each check clears.
          </Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PsychPrimaryButton label="Meanwhile, set your hours" onPress={onHoursCta} />
        <Text style={styles.footnote}>Clients can book you only after every check passes.</Text>

        <Pressable onPress={() => void load("refresh")} style={styles.refreshLink}>
          <Text style={styles.refreshText}>Pull to refresh · Tap to reload status</Text>
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
    color: "rgba(255,255,255,0.85)",
    marginBottom: spacing.sm,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.25)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: psychColors.sun,
  },
  progressLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
  },
  checklist: {
    backgroundColor: psychColors.surface,
    borderRadius: radius.card,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: psychColors.border,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  checkIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  checkGlyph: {
    fontFamily: fonts.sansExtraBold,
    fontSize: 16,
  },
  checkCopy: { flex: 1, gap: 2 },
  checkTitle: {
    fontFamily: fonts.sansExtraBold,
    fontSize: 15,
    color: psychColors.ink,
  },
  checkSub: {
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 17,
    color: psychColors.inkMuted,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  badgeText: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
  },
  privacy: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
    backgroundColor: psychColors.sunTint,
    borderRadius: radius.input,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "#F0D9A8",
  },
  privacyBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F5E6C8",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  privacyBadgeText: {
    fontFamily: fonts.sansExtraBold,
    fontSize: 10,
    color: psychColors.sunInk,
  },
  privacyText: {
    flex: 1,
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
