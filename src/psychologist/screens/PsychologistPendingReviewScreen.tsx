import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePsychologistAuth } from "../auth/PsychologistAuthContext";
import { ExpertHeader } from "../components/ExpertHeader";
import { PsychPrimaryButton } from "../components/PsychPrimaryButton";
import { fonts, psychColors, spacing } from "../theme";

/** Waiting on HR — same PsychologistProfile, hrApprovalStatus PENDING_APPROVAL / REJECTED. */
export function PsychologistPendingReviewScreen() {
  const { profile, signOut, refreshAccess } = usePsychologistAuth();
  const rejected = profile?.hrApprovalStatus === "REJECTED";

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <ExpertHeader />
        <Text style={styles.title}>
          {rejected ? "Application needs changes" : "Application under review"}
        </Text>
        <Text style={styles.lead}>
          {rejected
            ? profile?.hrRejectionReason ||
              "HR asked for changes. Update your details and submit again."
            : "Your details are with U Mind screening. After approval you can Sign in with the same Google, Apple, or email/phone."}
        </Text>
        {profile?.applicationSubmittedAt && !rejected ? (
          <Text style={styles.meta}>
            Submitted {new Date(profile.applicationSubmittedAt).toLocaleDateString("en-IN")}
          </Text>
        ) : null}
        <PsychPrimaryButton label="Refresh status" onPress={() => void refreshAccess()} />
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
  title: {
    marginTop: 32,
    fontFamily: fonts.serif,
    fontSize: 32,
    lineHeight: 38,
    color: psychColors.ink,
  },
  lead: {
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 22,
    color: psychColors.inkMuted,
    marginBottom: 16,
  },
  meta: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: psychColors.inkMuted,
    marginBottom: 8,
  },
  logout: {
    marginTop: 8,
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
