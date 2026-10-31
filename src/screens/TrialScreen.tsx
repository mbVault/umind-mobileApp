import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { register, type RegisterPayload, type SubscriptionPlanCode } from "../api/auth";
import { formatErrorMessage } from "../api/formatErrorMessage";
import { listSubscriptionPlans, startSubscriptionCheckout } from "../api/subscriptions";
import { useAuthSession } from "../auth/AuthSessionContext";
import { OnboardingBackButton } from "../components/OnboardingBackButton";
import { OutlineButton } from "../components/OutlineButton";
import { PrimaryButton } from "../components/PrimaryButton";
import { useOnboardingDraft } from "../onboarding/OnboardingDraftContext";
import { AuthStackParamList } from "../navigation/types";
import {
  openRazorpayCheckout,
  RazorpayCheckoutCancelledError,
  RazorpayCheckoutFailedError,
  type RazorpayCheckoutClient,
} from "../payments/razorpayCheckout";
import { waitForSubscriptionPayment } from "../payments/waitForSubscriptionPayment";
import { colors, radius, spacing, typeScale } from "../theme";
import { fonts } from "../theme/typography";
import { getOrCreateDeviceId } from "../utils/deviceId";
import { saathiPrefsFromDraft } from "../onboarding/saathiPrefs";
import { createIdempotencyKey } from "../utils/idempotencyKey";
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
    code: "YEARLY" as SubscriptionPlanCode,
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
    code: "QUARTERLY" as SubscriptionPlanCode,
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
    code: "MONTHLY" as SubscriptionPlanCode,
  },
];

const TIMELINE = [
  { title: "Today · ₹0", sub: "Everything unlocks instantly", icon: "checkmark" as const, color: colors.primary, bg: colors.primaryTint },
  { title: "Day 5 · 28 Sep", sub: "We'll remind you before the trial ends", icon: "notifications-outline" as const, color: colors.sun, bg: colors.sunTint },
  { title: "Day 8 · 30 Sep", sub: "Your yearly plan begins · ₹1,399", icon: "sparkles-outline" as const, color: colors.mint, bg: colors.mintTint },
];

function asRazorpayCheckout(value: unknown): RazorpayCheckoutClient | null {
  if (!value || typeof value !== "object") return null;
  const c = value as Partial<RazorpayCheckoutClient>;
  if (typeof c.keyId !== "string" || typeof c.orderId !== "string") return null;
  if (c.amount === undefined || typeof c.currency !== "string") return null;
  return {
    keyId: c.keyId,
    orderId: c.orderId,
    amount: c.amount,
    currency: c.currency,
  };
}

export function TrialScreen({ navigation }: Props) {
  const { draft, setSubscriptionPlan } = useOnboardingDraft();
  const { establishSession } = useAuthSession();
  const [trialLoading, setTrialLoading] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  const selectedUiPlan = useMemo(
    () => PLANS.find((p) => p.id === draft.subscriptionPlan) ?? PLANS[0],
    [draft.subscriptionPlan],
  );

  const buildRegisterPayload = async (
    withTrialPlan: boolean,
  ): Promise<RegisterPayload> => {
    if (
      !draft.lifeStage ||
      !draft.gender ||
      !draft.sexualOrientation ||
      draft.startingFeelings.length === 0 ||
      draft.recoveryKeyWords.length !== 12
    ) {
      throw new Error("INCOMPLETE_ONBOARDING");
    }
    const saathiPrefs = saathiPrefsFromDraft(draft);
    if (!saathiPrefs) {
      throw new Error("INCOMPLETE_SAATHI");
    }
    const deviceId = await getOrCreateDeviceId();
    return {
      recoveryKey: formatRecoveryKey(draft.recoveryKeyWords),
      alias: draft.alias.trim(),
      avatarId: draft.avatarId,
      lifeStage: draft.lifeStage,
      gender: draft.gender,
      sexualOrientation: draft.sexualOrientation,
      startingFeelings: draft.startingFeelings,
      appTheme: draft.appTheme,
      city: draft.city.trim(),
      saathiCheckInMode: saathiPrefs.saathiCheckInMode,
      saathiCheckInSlots: saathiPrefs.saathiCheckInSlots,
      saathiTimezone: saathiPrefs.saathiTimezone,
      saathiTimezoneSource: saathiPrefs.saathiTimezoneSource,
      saathiLanguage: saathiPrefs.saathiLanguage,
      unwindHabits: saathiPrefs.unwindHabits,
      deviceId,
      ...(withTrialPlan ? { subscriptionPlanCode: selectedUiPlan.code } : {}),
    };
  };

  const explainBuildError = (e: unknown) => {
    if (e instanceof Error && e.message === "INCOMPLETE_ONBOARDING") {
      Alert.alert("Almost there", "Please finish onboarding first.");
      return true;
    }
    if (e instanceof Error && e.message === "INCOMPLETE_SAATHI") {
      Alert.alert("Almost there", "Please finish personalization (Saathi preferences) first.");
      return true;
    }
    return false;
  };

  const startTrial = async () => {
    setTrialLoading(true);
    try {
      const payload = await buildRegisterPayload(true);
      const response = await register(payload);
      await establishSession(response);
    } catch (e) {
      if (explainBuildError(e)) return;
      if (__DEV__) console.error("[U Mind] register failed:", e);
      Alert.alert("Registration failed", formatErrorMessage(e, "Could not create your account."));
    } finally {
      setTrialLoading(false);
    }
  };

  /** Create account without trial, then Razorpay-checkout the selected plan → ACTIVE. */
  const purchaseSelectedPlan = async () => {
    setPurchaseLoading(true);
    try {
      const payload = await buildRegisterPayload(false);
      const response = await register(payload);
      await establishSession(response);

      const { items } = await listSubscriptionPlans();
      const plan = items.find((p) => p.code === selectedUiPlan.code);
      if (!plan) {
        throw new Error(`Plan ${selectedUiPlan.code} not found on server`);
      }

      const checkoutRes = await startSubscriptionCheckout(
        response.tokens.accessToken,
        plan.id,
        createIdempotencyKey(),
      );

      if (checkoutRes.provider !== "RAZORPAY") {
        throw new Error(`Unsupported payment provider: ${checkoutRes.provider}`);
      }

      const razorpayCheckout = asRazorpayCheckout(checkoutRes.checkout);
      if (!razorpayCheckout) {
        throw new Error("Checkout response missing Razorpay fields");
      }

      await openRazorpayCheckout({
        checkout: razorpayCheckout,
        description: `${plan.name} plan`,
        prefillName: draft.alias.trim(),
      });

      const wait = await waitForSubscriptionPayment({
        accessToken: response.tokens.accessToken,
        orderId: checkoutRes.order.id,
      });

      if (wait.outcome === "active") {
        Alert.alert("Welcome", "Payment confirmed. Your plan is active — including psychologist booking.");
      } else {
        Alert.alert(
          "Payment submitted",
          "Account created. We're confirming payment with the bank — check Plans & payments shortly.",
        );
      }
    } catch (e) {
      if (explainBuildError(e)) return;
      if (e instanceof RazorpayCheckoutCancelledError) {
        Alert.alert(
          "Payment cancelled",
          "Your account was created. You can finish purchase anytime from Profile → Plans & payments.",
        );
        return;
      }
      if (e instanceof RazorpayCheckoutFailedError) {
        Alert.alert(
          "Payment failed",
          `${e.message}\n\nYour account was created — retry from Profile → Plans & payments.`,
        );
        return;
      }
      if (__DEV__) console.error("[U Mind] purchase onboarding failed:", e);
      Alert.alert("Could not complete purchase", formatErrorMessage(e, "Something went wrong."));
    } finally {
      setPurchaseLoading(false);
    }
  };

  const busy = trialLoading || purchaseLoading;

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
        <Text style={styles.subFeatures}>
          Saathi AI • Full audio library • Diary & mood • Or pay now to unlock psychologist booking
        </Text>

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

        <PrimaryButton
          label="Start my 7-day free trial"
          loading={trialLoading}
          disabled={busy}
          onPress={() => void startTrial()}
          style={styles.cta}
        />
        <OutlineButton
          label={`Purchase ${selectedUiPlan.title} · ${selectedUiPlan.price}`}
          loading={purchaseLoading}
          disabled={busy}
          onPress={() => void purchaseSelectedPlan()}
          style={styles.purchaseCta}
        />
        <Text style={styles.disclaimer}>
          Free trial: ₹0 today, then the selected plan after 7 days if you upgrade. Or purchase now to
          unlock psychologist booking immediately. UPI, cards & net banking via Razorpay.
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
  purchaseCta: { marginTop: 0 },
  disclaimer: { fontFamily: fonts.sans, fontSize: 11, color: colors.inkMuted, textAlign: "center", lineHeight: 16 },
});
