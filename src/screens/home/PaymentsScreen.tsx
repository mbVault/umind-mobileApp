import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ApiError } from "../../api/client";
import { formatErrorMessage } from "../../api/formatErrorMessage";
import {
  getSubscriptionMe,
  listSubscriptionPlans,
  startSubscriptionCheckout,
  type SubscriptionMe,
  type SubscriptionPlan,
} from "../../api/subscriptions";
import { useAuthSession } from "../../auth/AuthSessionContext";
import type { HomeStackParamList } from "../../navigation/types";
import {
  openRazorpayCheckout,
  RazorpayCheckoutCancelledError,
  RazorpayCheckoutFailedError,
  type RazorpayCheckoutClient,
} from "../../payments/razorpayCheckout";
import { waitForSubscriptionPayment } from "../../payments/waitForSubscriptionPayment";
import { useProfile } from "../../profile/ProfileContext";
import { colors, radius, spacing } from "../../theme";
import { fonts, typeScale } from "../../theme/typography";
import { createIdempotencyKey } from "../../utils/idempotencyKey";

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

function formatInr(minor: number): string {
  const major = Math.round(minor / 100);
  return `₹${major.toLocaleString("en-IN")}`;
}

function planBadge(code: string): { label: string; tint: string; ink: string } | null {
  if (code === "YEARLY") return { label: "Best value", tint: colors.sunTint, ink: colors.sunInk };
  if (code === "QUARTERLY") return { label: "Popular", tint: colors.mintTint, ink: colors.mintInk };
  return null;
}

function planSubtitle(plan: SubscriptionPlan): string {
  const monthly = Math.round(plan.priceMinorUnits / 100 / Math.max(plan.durationDays / 30, 1));
  if (plan.code === "YEARLY") return `Just ₹${monthly} a month`;
  if (plan.code === "QUARTERLY") return `₹${monthly} a month`;
  return "Flexible, month to month";
}

function periodLabel(plan: SubscriptionPlan): string {
  if (plan.interval === "YEARLY" || plan.code === "YEARLY") return "per year";
  if (plan.code === "QUARTERLY") return "every 3 months";
  return "per month";
}

export function PaymentsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const { accessToken, user } = useAuthSession();
  const { profile } = useProfile();

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [me, setMe] = useState<SubscriptionMe | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const [planRes, subMe] = await Promise.all([
        listSubscriptionPlans(),
        getSubscriptionMe(accessToken),
      ]);
      const ordered = [...planRes.items].sort((a, b) => b.durationDays - a.durationDays);
      setPlans(ordered);
      setMe(subMe);

      const preferredCode = subMe.subscription?.planCode;
      const preferred =
        ordered.find((p) => p.code === preferredCode) ??
        ordered.find((p) => p.code === "YEARLY") ??
        ordered[0];
      setSelectedPlanId((prev) => prev ?? preferred?.id ?? null);
    } catch (e) {
      setError(formatErrorMessage(e, "Could not load plans"));
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedPlan = useMemo(
    () => plans.find((p) => p.id === selectedPlanId) ?? null,
    [plans, selectedPlanId],
  );

  const isActive = me?.subscription?.status === "ACTIVE";
  const isTrialing = me?.subscription?.status === "TRIALING";

  const ctaLabel = useMemo(() => {
    if (!selectedPlan) return "Choose a plan";
    if (isActive) return "Plan already active";
    if (isTrialing) return `Upgrade · ${formatInr(selectedPlan.priceMinorUnits)}`;
    return `Purchase · ${formatInr(selectedPlan.priceMinorUnits)}`;
  }, [selectedPlan, isActive, isTrialing]);

  const onPurchase = async () => {
    if (!accessToken || !selectedPlan) return;
    if (isActive) {
      Alert.alert("Already subscribed", "You already have an active paid plan.");
      return;
    }

    setPurchasing(true);
    try {
      const checkoutRes = await startSubscriptionCheckout(
        accessToken,
        selectedPlan.id,
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
        description: `${selectedPlan.name} plan`,
        prefillName: user?.alias ?? profile?.alias,
      });

      const wait = await waitForSubscriptionPayment({
        accessToken,
        orderId: checkoutRes.order.id,
      });

      await load();

      if (wait.outcome === "active") {
        Alert.alert(
          "You're subscribed",
          "Payment confirmed. Psychologist booking is unlocked with your ACTIVE plan.",
        );
      } else {
        Alert.alert(
          "Payment submitted",
          "We're confirming with the bank. Pull to refresh this screen in a moment.",
        );
      }
    } catch (e) {
      if (e instanceof RazorpayCheckoutCancelledError) {
        Alert.alert("Payment cancelled", "No charge was completed.");
      } else if (e instanceof RazorpayCheckoutFailedError) {
        Alert.alert("Payment failed", e.message);
      } else if (e instanceof ApiError && e.statusCode === 409) {
        Alert.alert("Already subscribed", e.message);
        void load();
      } else {
        Alert.alert("Checkout failed", formatErrorMessage(e, "Could not start payment"));
      }
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => navigation.goBack()}
            hitSlop={12}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={24} color={colors.ink} />
          </Pressable>
          <Text style={styles.screenTitle}>Payments</Text>
          <View style={{ width: 44 }} />
        </View>

        <Text style={styles.lead}>
          Choose a plan. Money goes to U Mind; psychologist sessions are billed separately (₹499).
        </Text>

        {me?.subscription ? (
          <View style={styles.statusCard}>
            <Text style={styles.statusLabel}>Current access</Text>
            <Text style={styles.statusValue}>
              {me.subscription.planName} · {me.subscription.status}
            </Text>
            {isTrialing && me.subscription.trialEndsAt ? (
              <Text style={styles.statusHint}>
                Trial ends{" "}
                {new Intl.DateTimeFormat("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                }).format(new Date(me.subscription.trialEndsAt))}
              </Text>
            ) : null}
            {isActive && me.subscription.currentPeriodEnd ? (
              <Text style={styles.statusHint}>
                Renews / ends{" "}
                {new Intl.DateTimeFormat("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                }).format(new Date(me.subscription.currentPeriodEnd))}
              </Text>
            ) : null}
            <Text style={styles.entitlement}>
              Book psychologist: {me.entitlements.canBookPsychologist ? "Yes" : "No (needs ACTIVE)"}
            </Text>
          </View>
        ) : null}

        {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.planList}>
          {plans.map((plan) => {
            const selected = selectedPlanId === plan.id;
            const badge = planBadge(plan.code);
            return (
              <Pressable
                key={plan.id}
                onPress={() => setSelectedPlanId(plan.id)}
                disabled={isActive}
                style={[
                  styles.planCard,
                  selected && styles.planCardSelected,
                  isActive && styles.planCardDisabled,
                ]}
              >
                <View style={[styles.planRadio, selected && styles.planRadioOn]} />
                <View style={styles.planCenter}>
                  <View style={styles.planTitleRow}>
                    <Text style={styles.planTitle}>{plan.name}</Text>
                    {badge ? (
                      <View style={[styles.planBadge, { backgroundColor: badge.tint }]}>
                        <Text style={[styles.planBadgeText, { color: badge.ink }]}>{badge.label}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.planSub}>{planSubtitle(plan)}</Text>
                </View>
                <View style={styles.planPriceCol}>
                  <Text style={styles.planPrice}>{formatInr(plan.priceMinorUnits)}</Text>
                  <Text style={styles.planPeriod}>{periodLabel(plan)}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => void onPurchase()}
          disabled={!selectedPlan || purchasing || isActive || loading}
          style={({ pressed }) => [
            styles.cta,
            (!selectedPlan || purchasing || isActive || loading) && styles.ctaDisabled,
            pressed && !isActive && styles.ctaPressed,
          ]}
        >
          {purchasing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.ctaText}>{ctaLabel}</Text>
          )}
        </Pressable>

        <Text style={styles.footnote}>
          Test payments use Razorpay sandbox. Confirmation comes from the bank webhook — keep backend +
          ngrok running.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: spacing.tabHorizontal,
    paddingBottom: 40,
    gap: spacing.md,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.sm,
  },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  screenTitle: { ...typeScale.h1, fontSize: 24, lineHeight: 28 },
  lead: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    color: colors.inkMuted,
  },
  statusCard: {
    backgroundColor: colors.primaryTint,
    borderRadius: radius.card,
    padding: spacing.lg,
    gap: 4,
  },
  statusLabel: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.inkMuted },
  statusValue: { fontFamily: fonts.sansBold, fontSize: 16, color: colors.ink },
  statusHint: { fontFamily: fonts.sans, fontSize: 13, color: colors.inkMuted },
  entitlement: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.primary, marginTop: 6 },
  planList: { gap: spacing.sm, marginTop: spacing.sm },
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
  planCardDisabled: { opacity: 0.55 },
  planRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
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
  cta: {
    marginTop: spacing.md,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaPressed: { opacity: 0.9 },
  ctaDisabled: { opacity: 0.45 },
  ctaText: { fontFamily: fonts.sansBold, fontSize: 16, color: "#FFFFFF" },
  footnote: {
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 18,
    color: colors.inkMuted,
    marginTop: spacing.sm,
  },
  error: { color: colors.coralInk, fontFamily: fonts.sans, fontSize: 13 },
});
