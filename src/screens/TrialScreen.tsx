import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { register } from "../api/auth";
import { formatErrorMessage } from "../api/formatErrorMessage";
import { useAuthSession } from "../auth/AuthSessionContext";
import { OnboardingBackButton } from "../components/OnboardingBackButton";
import { PrimaryButton } from "../components/PrimaryButton";
import { useOnboardingDraft } from "../onboarding/OnboardingDraftContext";
import { AuthStackParamList } from "../navigation/types";
import { colors, radius, spacing, typeScale } from "../theme";
import { fonts } from "../theme/typography";
import { getOrCreateDeviceId } from "../utils/deviceId";
import { saathiPrefsFromDraft } from "../onboarding/saathiPrefs";
import { formatRecoveryKey } from "../utils/recoveryKeyWords";

type Props = NativeStackScreenProps<AuthStackParamList, "Trial">;

const PLANS = [
  {
    id: "yearly" as const,
    title: "Yearly",
    badge: "Save 41%",
    badgeTint: colors.sunTint,
    badgeInk: colors.sunInk,
    sub: "Just ₹117 a month",
    price: "₹1,399",
    period: "per year",
  },
  {
    id: "quarterly" as const,
    title: "3 Months",
    badge: "Save 16%",
    badgeTint: colors.mintTint,
    badgeInk: colors.mintInk,
    sub: "₹166 a month",
    price: "₹499",
    period: "every 3 months",
  },
  {
    id: "monthly" as const,
    title: "Monthly",
    badge: null,
    badgeTint: "",
    badgeInk: "",
    sub: "Flexible, month to month",
    price: "₹199",
    period: "per month",
  },
];

const TIMELINE = [
  { title: "Today · ₹0", sub: "Everything unlocks instantly", icon: "checkmark" as const, color: colors.primary, bg: colors.primaryTint },
  { title: "Day 5 · 28 Sep", sub: "We'll remind you before the trial ends", icon: "notifications-outline" as const, color: colors.sun, bg: colors.sunTint },
  { title: "Day 8 · 30 Sep", sub: "Your yearly plan begins · ₹1,399", icon: "sparkles-outline" as const, color: colors.mint, bg: colors.mintTint },
];

export function TrialScreen({ navigation }: Props) {
  const { draft, setSubscriptionPlan } = useOnboardingDraft();
  const { establishSession } = useAuthSession();
  const [loading, setLoading] = useState(false);

  const startTrial = async () => {
    if (!draft.lifeStage || !draft.gender || draft.recoveryKeyWords.length !== 12) {
      Alert.alert("Almost there", "Please finish onboarding first.");
      return;
    }
    const saathiPrefs = saathiPrefsFromDraft(draft);
    if (!saathiPrefs) {
      Alert.alert("Almost there", "Please finish personalization (Saathi preferences) first.");
      return;
    }
    setLoading(true);
    try {
      const deviceId = await getOrCreateDeviceId();
      const response = await register({
        recoveryKey: formatRecoveryKey(draft.recoveryKeyWords),
        alias: draft.alias.trim(),
        avatarId: draft.avatarId,
        lifeStage: draft.lifeStage,
        gender: draft.gender,
        startingFeelings: draft.startingFeelings,
        appTheme: draft.appTheme,
        city: draft.city.trim(),
        saathiCheckIn: saathiPrefs.saathiCheckIn,
        saathiLanguage: saathiPrefs.saathiLanguage,
        unwindHabits: saathiPrefs.unwindHabits,
        deviceId,
      });
      await establishSession(response);
    } catch (e) {
      if (__DEV__) {
        console.error("[U Mind] register failed:", e);
      }
      const message = formatErrorMessage(e, "Could not create your account.");
      Alert.alert("Registration failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <OnboardingBackButton onPress={() => navigation.goBack()} style={styles.backBtn} />
          <View style={styles.anonPill}>
            <Ionicons name="lock-closed-outline" size={14} color={colors.primary} />
            <Text style={styles.anonText}>Still anonymous</Text>
          </View>
        </View>

        <Text style={styles.title}>
          Try U Mind <Text style={styles.titleAccent}>free</Text> for 7 days
        </Text>
        <Text style={styles.subFeatures}>Saathi AI • Full audio library • Diary & mood • Picked for your life stage</Text>

        <View style={styles.timelineCard}>
          {TIMELINE.map((row, i) => (
            <View key={row.title} style={styles.timelineRow}>
              <View style={styles.timelineRail}>
                <View style={[styles.timelineDot, { backgroundColor: row.bg }]}>
                  <Ionicons name={row.icon} size={16} color={row.color} />
                </View>
                {i < TIMELINE.length - 1 ? <View style={styles.timelineLine} /> : null}
              </View>
              <View style={styles.timelineCopy}>
                <Text style={styles.timelineTitle}>{row.title}</Text>
                <Text style={styles.timelineSub}>{row.sub}</Text>
              </View>
            </View>
          ))}
        </View>

        {PLANS.map((plan) => {
          const selected = draft.subscriptionPlan === plan.id;
          return (
            <Pressable
              key={plan.id}
              onPress={() => setSubscriptionPlan(plan.id)}
              style={[styles.planCard, selected && styles.planCardSelected]}
            >
              <View style={[styles.planRadio, selected && styles.planRadioOn]} />
              <View style={styles.planCenter}>
                <View style={styles.planTitleRow}>
                  <Text style={styles.planTitle}>{plan.title}</Text>
                  {plan.badge ? (
                    <View style={[styles.planBadge, { backgroundColor: plan.badgeTint }]}>
                      <Text style={[styles.planBadgeText, { color: plan.badgeInk }]}>{plan.badge}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.planSub}>{plan.sub}</Text>
              </View>
              <View style={styles.planPriceCol}>
                <Text style={styles.planPrice}>{plan.price}</Text>
                <Text style={styles.planPeriod}>{plan.period}</Text>
              </View>
            </Pressable>
          );
        })}

        <PrimaryButton label="Start my 7-day free trial" loading={loading} onPress={startTrial} style={styles.cta} />
        <Text style={styles.disclaimer}>
          ₹0 today, then ₹1,399 a year from 30 Sep. Cancel before then and you won't be charged. UPI, cards & net banking.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.flowHorizontal, paddingBottom: spacing.xxl, gap: spacing.md },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  backBtn: { marginBottom: 0 },
  anonPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primaryTint,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  anonText: { fontFamily: fonts.sansBold, fontSize: 12, color: colors.primary },
  title: { ...typeScale.h1, fontSize: 28, lineHeight: 34 },
  titleAccent: { color: colors.primary },
  subFeatures: { fontFamily: fonts.sans, fontSize: 13, color: colors.inkMuted, lineHeight: 19 },
  timelineCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  timelineRow: { flexDirection: "row", gap: spacing.md },
  timelineRail: { alignItems: "center", width: 32 },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  timelineLine: { flex: 1, width: 2, backgroundColor: colors.border, marginVertical: 4 },
  timelineCopy: { flex: 1, paddingBottom: spacing.sm },
  timelineTitle: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.ink },
  timelineSub: { fontFamily: fonts.sans, fontSize: 13, color: colors.inkMuted, marginTop: 2 },
  planCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  planCardSelected: { borderColor: colors.primary, borderWidth: 2 },
  planRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
  },
  planRadioOn: { borderColor: colors.primary, backgroundColor: colors.primary },
  planCenter: { flex: 1, gap: 4 },
  planTitleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flexWrap: "wrap" },
  planTitle: { fontFamily: fonts.sansBold, fontSize: 16, color: colors.ink },
  planBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.chip },
  planBadgeText: { fontFamily: fonts.sansBold, fontSize: 11 },
  planSub: { fontFamily: fonts.sans, fontSize: 13, color: colors.inkMuted },
  planPriceCol: { alignItems: "flex-end" },
  planPrice: { fontFamily: fonts.sansBold, fontSize: 16, color: colors.ink },
  planPeriod: { fontFamily: fonts.sans, fontSize: 11, color: colors.inkMuted },
  cta: { marginTop: spacing.sm },
  disclaimer: { fontFamily: fonts.sans, fontSize: 11, color: colors.inkMuted, textAlign: "center", lineHeight: 16 },
});
