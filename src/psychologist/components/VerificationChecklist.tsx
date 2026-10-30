import { StyleSheet, Text, View } from "react-native";
import { PsychologistCheckDto } from "../api/psychologistApi";
import { fonts, psychColors, radius, spacing } from "../theme";

export const VERIFICATION_CHECK_ORDER = [
  "IDENTITY",
  "RCI_REGISTRATION",
  "DEGREE",
  "YEARS_OF_EXPERIENCE",
] as const;

export type VerificationCheckType = (typeof VERIFICATION_CHECK_ORDER)[number];
export type VerificationCheckStatus = "QUEUED" | "IN_PROGRESS" | "VERIFIED" | "NEEDS_ATTENTION";

const CHECK_COPY: Record<
  VerificationCheckType,
  { title: string; verified: string; inProgress: string; queued: string; needsAttention: string }
> = {
  IDENTITY: {
    title: "Identity",
    verified: "Govt ID matched to your selfie and photo",
    inProgress: "Matching your govt ID to selfie and photo",
    queued: "Verification not started yet",
    needsAttention: "Additional identity information is required",
  },
  RCI_REGISTRATION: {
    title: "RCI registration",
    verified: "Checked against the RCI register",
    inProgress: "Checking against the RCI register",
    queued: "Verification not started yet",
    needsAttention: "Additional RCI information is required",
  },
  DEGREE: {
    title: "Degree",
    verified: "Degree verification completed",
    inProgress: "Degree verification underway",
    queued: "Verification not started yet",
    needsAttention: "Additional degree information is required",
  },
  YEARS_OF_EXPERIENCE: {
    title: "Years of experience",
    verified: "Experience verification completed",
    inProgress: "Experience verification underway",
    queued: "Verification not started yet",
    needsAttention: "Additional experience information is required",
  },
};

const statusBadge = (status: VerificationCheckStatus) => {
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

const statusIcon = (status: VerificationCheckStatus) => {
  switch (status) {
    case "VERIFIED":
      return { bg: psychColors.mintTint, glyph: "✓", color: psychColors.mintInk };
    case "IN_PROGRESS":
      return { bg: psychColors.sunTint, glyph: "…", color: psychColors.sunInk };
    case "NEEDS_ATTENTION":
      return { bg: psychColors.coralTint, glyph: "!", color: psychColors.coralInk };
    default:
      return { bg: psychColors.primaryTint, glyph: "○", color: psychColors.primary };
  }
};

function descriptionFor(
  type: VerificationCheckType,
  status: VerificationCheckStatus,
  applicantReason: string | null | undefined,
  yearsPractising: number | null
): string {
  // Prefer explicit applicant-safe reason from backend — never invent final-reject copy.
  if (status === "NEEDS_ATTENTION" && applicantReason?.trim()) {
    return applicantReason.trim();
  }
  const copy = CHECK_COPY[type];
  if (status === "VERIFIED") return copy.verified;
  if (status === "IN_PROGRESS") {
    if (type === "YEARS_OF_EXPERIENCE" && yearsPractising != null) {
      return `Checking experience letters (${yearsPractising} yrs claimed)`;
    }
    return copy.inProgress;
  }
  if (status === "NEEDS_ATTENTION") return copy.needsAttention;
  if (type === "YEARS_OF_EXPERIENCE" && yearsPractising != null) {
    return `Queued — ${yearsPractising} yrs claimed`;
  }
  return copy.queued;
}

export type VerificationChecklistRow = {
  type: VerificationCheckType;
  status: VerificationCheckStatus;
  reason: string | null;
};

export function buildVerificationRows(checks: PsychologistCheckDto[] | undefined): VerificationChecklistRow[] {
  const map = new Map(checks?.map((c) => [c.type, c]) ?? []);
  return VERIFICATION_CHECK_ORDER.map((type) => {
    const row = map.get(type);
    return {
      type,
      status: (row?.status as VerificationCheckStatus | undefined) ?? "QUEUED",
      reason: row?.reason ?? null,
    };
  });
}

type Props = {
  checks: PsychologistCheckDto[] | undefined;
  yearsPractising?: number | null;
};

/** Four BGV checks — statuses from backend only; NEEDS_ATTENTION ≠ final rejection. */
export function VerificationChecklist({ checks, yearsPractising = null }: Props) {
  const rows = buildVerificationRows(checks);

  return (
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
                {descriptionFor(row.type, row.status, row.reason, yearsPractising)}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: badge.bg }]}>
              <Text style={[styles.badgeText, { color: badge.ink }]}>{badge.label}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
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
});
