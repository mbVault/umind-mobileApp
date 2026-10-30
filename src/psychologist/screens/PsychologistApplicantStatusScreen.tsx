import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import { Linking, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  fetchPsychologistMe,
  submitClarificationResponse,
  submitForHrReview,
} from "../api/psychologistApi";
import { StaffApiError } from "../api/staffClient";
import { usePsychologistAuth } from "../auth/PsychologistAuthContext";
import { ExpertHeader } from "../components/ExpertHeader";
import { PsychPrimaryButton } from "../components/PsychPrimaryButton";
import { PsychologistStackParamList } from "../navigation/types";
import { fonts, psychColors, spacing } from "../theme";

type Props = NativeStackScreenProps<PsychologistStackParamList, "PsychologistPendingReview">;

const SUPPORT_MAILTO = "mailto:support@umind.care?subject=Psychologist%20application";

/**
 * F4 Status Hub — every CTA maps to applicantNextAction from the backend.
 * Never infer resubmit / final-reject from free-text reasons.
 */
export function PsychologistApplicantStatusScreen({ navigation }: Props) {
  const { profile, signOut, refreshAccess } = usePsychologistAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localProfile, setLocalProfile] = useState(profile);
  const [clarifyNote, setClarifyNote] = useState("");

  useEffect(() => {
    setLocalProfile(profile);
  }, [profile]);

  const nextAction = localProfile?.applicantNextAction ?? "WAIT";
  const blocked = Boolean(localProfile?.identityOnboardingBlocked) || nextAction === "NONE";
  const canResubmit = nextAction === "RESUBMIT" && !blocked;
  const submittedAt = localProfile?.applicationSubmittedAt;
  const finalAt = localProfile?.finalRejectionAt;
  // Prefer applicantMessage (admin-safe). hrRejectionReason only as fallback for legacy rows.
  const message =
    localProfile?.applicantMessage?.trim() ||
    (canResubmit || blocked ? localProfile?.hrRejectionReason?.trim() : null) ||
    null;

  const refresh = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      await refreshAccess();
      const me = await fetchPsychologistMe();
      setLocalProfile(me);
      if (me.hrApprovalStatus === "APPROVED" && !me.identityOnboardingBlocked) {
        await refreshAccess();
      }
    } catch (err) {
      setError(err instanceof StaffApiError ? err.message : "Could not refresh status.");
    } finally {
      setBusy(false);
    }
  }, [refreshAccess]);

  const onEditApplication = () => {
    if (!canResubmit) return;
    navigation.navigate("PsychologistApply");
  };

  const onResubmit = async () => {
    if (!canResubmit) return;
    setError(null);
    setBusy(true);
    try {
      const me = await submitForHrReview();
      setLocalProfile(me);
      await refreshAccess();
    } catch (err) {
      setError(err instanceof StaffApiError ? err.message : "Could not resubmit application.");
    } finally {
      setBusy(false);
    }
  };

  const onSubmitClarification = async () => {
    if (nextAction !== "CLARIFY") return;
    setError(null);
    setBusy(true);
    try {
      const me = await submitClarificationResponse(clarifyNote.trim());
      setLocalProfile(me);
      setClarifyNote("");
      await refreshAccess();
    } catch (err) {
      setError(err instanceof StaffApiError ? err.message : "Could not send clarification.");
    } finally {
      setBusy(false);
    }
  };

  let title = "Under HR screening";
  let lead =
    "Your application is with U Mind for screening. You don’t need to do anything right now.";
  let cardLabel = "Next";
  let cardBody =
    "After HR approval you’ll upload documents and complete verification. The clinic opens only when your profile is published.";

  if (blocked) {
    title = "Application closed";
    lead =
      message ||
      "This application was finally rejected and cannot be resubmitted. You cannot start a new application with this identity.";
    cardLabel = "What this means";
    cardBody = "There is no Edit or Resubmit path. Contact support only if you believe this is a mistake.";
  } else if (canResubmit) {
    title = "Application needs changes";
    lead = message || "Corrections were requested. Update your application and resubmit when ready.";
    cardLabel = "What you can do";
    cardBody =
      "Edit your application, then resubmit. Same account — only available because admin permitted resubmission.";
  } else if (nextAction === "UPLOAD_DOC") {
    title = "Document update needed";
    lead = message || "One or more documents need to be replaced.";
    cardLabel = "Next";
    cardBody = "Replace only the returned document. Other uploads stay valid.";
  } else if (nextAction === "CLARIFY") {
    title = "Clarification needed";
    lead = message || "Additional information was requested.";
    cardLabel = "Next";
    cardBody =
      "This is not a final rejection. Send a short response below, or update documents if that was requested.";
  } else if (nextAction === "CONTACT_SUPPORT") {
    title = "Contact support";
    lead = message || "Please contact U Mind support about your application.";
    cardLabel = "Support";
    cardBody = "Resubmission is not available from the app for this decision.";
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <ExpertHeader />
        <Text style={styles.eyebrow}>APPLICATION STATUS</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.lead}>{lead}</Text>

        {submittedAt && nextAction === "WAIT" ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Submitted</Text>
            <Text style={styles.cardValue}>
              {new Date(submittedAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </Text>
          </View>
        ) : null}

        {finalAt && blocked ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Decision date</Text>
            <Text style={styles.cardValue}>
              {new Date(finalAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </Text>
          </View>
        ) : null}

        <View
          style={[
            styles.card,
            canResubmit || blocked || nextAction === "CONTACT_SUPPORT" ? styles.cardWarn : null,
          ]}
        >
          <Text style={styles.cardLabel}>{cardLabel}</Text>
          <Text style={styles.cardBody}>{cardBody}</Text>
        </View>

        {nextAction === "CLARIFY" ? (
          <TextInput
            style={styles.clarifyInput}
            value={clarifyNote}
            onChangeText={setClarifyNote}
            placeholder="Your response to the verification team"
            placeholderTextColor={psychColors.inkMuted}
            multiline
            maxLength={500}
            editable={!busy}
          />
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {canResubmit ? (
          <>
            <PsychPrimaryButton label="Edit application" onPress={onEditApplication} disabled={busy} />
            <PsychPrimaryButton
              label="Resubmit for HR review"
              onPress={() => void onResubmit()}
              loading={busy}
            />
          </>
        ) : nextAction === "UPLOAD_DOC" ? (
          <PsychPrimaryButton
            label="Open documents"
            onPress={() => navigation.navigate("PsychologistDocumentsPlaceholder")}
            disabled={busy}
          />
        ) : nextAction === "CLARIFY" ? (
          <>
            <PsychPrimaryButton
              label="Send clarification"
              onPress={() => void onSubmitClarification()}
              loading={busy}
              disabled={clarifyNote.trim().length < 3}
            />
            <PsychPrimaryButton
              label="Open documents"
              onPress={() => navigation.navigate("PsychologistDocumentsPlaceholder")}
              disabled={busy}
              style={styles.secondaryFill}
            />
            <Pressable
              style={styles.secondary}
              onPress={() => navigation.navigate("PsychologistBackgroundCheck")}
              disabled={busy}
            >
              <Text style={styles.secondaryLabel}>View verification checklist</Text>
            </Pressable>
          </>
        ) : nextAction === "CONTACT_SUPPORT" || blocked ? (
          <>
            <PsychPrimaryButton
              label="Email support"
              onPress={() => void Linking.openURL(SUPPORT_MAILTO)}
              disabled={busy}
            />
            <PsychPrimaryButton label="Refresh status" onPress={() => void refresh()} loading={busy} />
          </>
        ) : (
          <PsychPrimaryButton label="Refresh status" onPress={() => void refresh()} loading={busy} />
        )}

        {nextAction === "WAIT" ? (
          <Pressable
            style={styles.secondary}
            onPress={() => navigation.navigate("PsychologistApply")}
            disabled={busy}
          >
            <Text style={styles.secondaryLabel}>View application details</Text>
          </Pressable>
        ) : null}

        <Pressable style={styles.logout} onPress={() => void signOut()}>
          <Text style={styles.logoutLabel}>Log out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: psychColors.background },
  content: {
    flex: 1,
    paddingHorizontal: spacing.flowHorizontal,
    paddingTop: spacing.xxl,
    gap: 12,
  },
  eyebrow: {
    marginTop: 24,
    fontFamily: fonts.sansExtraBold,
    fontSize: 11,
    letterSpacing: 1.2,
    color: psychColors.inkMuted,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 30,
    lineHeight: 36,
    color: psychColors.ink,
  },
  lead: {
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 22,
    color: psychColors.inkMuted,
    marginBottom: 8,
  },
  card: {
    backgroundColor: psychColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: psychColors.border,
    padding: 16,
    gap: 6,
  },
  cardWarn: {
    backgroundColor: psychColors.flagBg,
    borderColor: psychColors.flagBorder,
  },
  cardLabel: {
    fontFamily: fonts.sansExtraBold,
    fontSize: 12,
    color: psychColors.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  cardValue: {
    fontFamily: fonts.sansBold,
    fontSize: 16,
    color: psychColors.ink,
  },
  cardBody: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    color: psychColors.ink,
  },
  clarifyInput: {
    minHeight: 96,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: psychColors.border,
    backgroundColor: psychColors.surface,
    padding: 14,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: psychColors.ink,
    textAlignVertical: "top",
  },
  error: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: psychColors.coralInk,
  },
  secondary: {
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: psychColors.primary,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: psychColors.surface,
  },
  secondaryFill: {
    backgroundColor: psychColors.ink,
  },
  secondaryLabel: {
    fontFamily: fonts.sansExtraBold,
    fontSize: 15,
    color: psychColors.primary,
  },
  logout: {
    marginTop: 4,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: psychColors.coralInk,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: psychColors.surface,
  },
  logoutLabel: {
    fontFamily: fonts.sansExtraBold,
    fontSize: 16,
    color: psychColors.coralInk,
  },
});
