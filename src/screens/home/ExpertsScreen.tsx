import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ApiError } from "../../api/client";
import {
  createBooking,
  listPsychologistAvailability,
  startBookingCheckout,
  type AvailabilitySlot,
  type CommunicationMode,
} from "../../api/bookings";
import { formatErrorMessage } from "../../api/formatErrorMessage";
import { listPsychologists, type PublicPsychologist } from "../../api/psychologists";
import { useAuthSession } from "../../auth/AuthSessionContext";
import {
  openRazorpayCheckout,
  RazorpayCheckoutCancelledError,
  RazorpayCheckoutFailedError,
  type RazorpayCheckoutClient,
} from "../../payments/razorpayCheckout";
import { waitForBookingPayment } from "../../payments/waitForBookingPayment";
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

const MODES: { key: CommunicationMode; label: string }[] = [
  { key: "CHAT", label: "Chat" },
  { key: "VOICE", label: "Voice" },
  { key: "VIDEO", label: "Video" },
];

const SPECS = [
  { key: "ALL", label: "All" },
  { key: "STRESS", label: "Stress" },
  { key: "ANXIETY", label: "Anxiety" },
  { key: "SLEEP", label: "Sleep" },
  { key: "RELATIONSHIPS", label: "Relationships" },
] as const;

const PREFS = [
  { key: "ANY", label: "Any psychologist" },
  { key: "WOMAN", label: "A woman" },
  { key: "MAN", label: "A man" },
] as const;

function formatSlotLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfSlot = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dayDiff = Math.round((startOfSlot.getTime() - startOfToday.getTime()) / 86400000);
  const time = new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
  if (dayDiff === 0) return `Today, ${time}`;
  if (dayDiff === 1) return `Tomorrow, ${time}`;
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

function specLabel(code: string): string {
  return code
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function ExpertsScreen() {
  const { accessToken, user } = useAuthSession();
  const { profile } = useProfile();
  const [mode, setMode] = useState<CommunicationMode>("VOICE");
  const [spec, setSpec] = useState<(typeof SPECS)[number]["key"]>("STRESS");
  const [pref, setPref] = useState<(typeof PREFS)[number]["key"]>("ANY");
  const [items, setItems] = useState<PublicPsychologist[]>([]);
  const [nextSlotById, setNextSlotById] = useState<Record<string, AvailabilitySlot | undefined>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [bookingFor, setBookingFor] = useState<PublicPsychologist | null>(null);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [bookingBusy, setBookingBusy] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listPsychologists(accessToken, {
        ...(spec !== "ALL" ? { specialisation: spec } : {}),
      });
      setItems(data.items);

      const from = new Date();
      const to = new Date(Date.now() + 7 * 86400000);
      const entries = await Promise.all(
        data.items.map(async (p) => {
          try {
            const avail = await listPsychologistAvailability(
              accessToken,
              p.id,
              from.toISOString(),
              to.toISOString(),
            );
            return [p.id, avail.items[0]] as const;
          } catch {
            return [p.id, undefined] as const;
          }
        }),
      );
      setNextSlotById(Object.fromEntries(entries));
    } catch (e) {
      setError(formatErrorMessage(e, "Could not load experts"));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken, spec]);

  useEffect(() => {
    void load();
  }, [load]);

  const openBook = async (psych: PublicPsychologist) => {
    if (!accessToken) return;
    setBookingFor(psych);
    setSelectedSlotId(null);
    setSlotsLoading(true);
    try {
      const from = new Date();
      const to = new Date(Date.now() + 14 * 86400000);
      const avail = await listPsychologistAvailability(
        accessToken,
        psych.id,
        from.toISOString(),
        to.toISOString(),
      );
      setSlots(avail.items);
      setSelectedSlotId(avail.items[0]?.id ?? null);
    } catch (e) {
      setSlots([]);
      Alert.alert("Availability", formatErrorMessage(e, "Could not load slots"));
    } finally {
      setSlotsLoading(false);
    }
  };

  const confirmBook = async () => {
    if (!accessToken || !bookingFor || !selectedSlotId) return;
    setBookingBusy(true);
    try {
      const created = await createBooking(accessToken, {
        psychologistProfileId: bookingFor.id,
        slotId: selectedSlotId,
        communicationMode: mode,
      });

      const checkoutRes = await startBookingCheckout(
        accessToken,
        created.booking.id,
        createIdempotencyKey(),
      );

      if (checkoutRes.provider !== "RAZORPAY") {
        throw new Error(`Unsupported payment provider: ${checkoutRes.provider}`);
      }

      const razorpayCheckout = asRazorpayCheckout(checkoutRes.checkout);
      if (!razorpayCheckout) {
        throw new Error("Checkout response missing Razorpay fields (keyId/orderId)");
      }

      await openRazorpayCheckout({
        checkout: razorpayCheckout,
        description: `Session with ${bookingFor.publicName}`,
        prefillName: user?.alias ?? profile?.alias,
      });

      const wait = await waitForBookingPayment({
        accessToken,
        bookingId: created.booking.id,
        orderId: checkoutRes.order.id,
      });

      setBookingFor(null);

      if (wait.outcome === "confirmed") {
        Alert.alert("Booking confirmed", "Payment received. Your session is confirmed.");
      } else if (wait.outcome === "expired") {
        Alert.alert(
          "Payment received, slot released",
          "Hold expired before confirmation. If money was deducted, a refund will be processed.",
        );
      } else {
        Alert.alert(
          "Payment submitted",
          "We're still confirming with the bank. Check My bookings shortly — status updates via webhook.",
        );
      }
      void load();
    } catch (e) {
      if (e instanceof RazorpayCheckoutCancelledError) {
        Alert.alert("Payment cancelled", "Your slot is held briefly — you can try paying again from booking.");
      } else if (e instanceof RazorpayCheckoutFailedError) {
        Alert.alert("Payment failed", e.message);
      } else if (e instanceof ApiError && e.statusCode === 403) {
        Alert.alert(
          "Subscription needed",
          "Booking a psychologist needs an ACTIVE paid subscription (trial unlocks Saathi & audio only).",
        );
      } else {
        Alert.alert("Booking failed", formatErrorMessage(e, "Could not complete booking payment"));
      }
    } finally {
      setBookingBusy(false);
    }
  };

  const prefNote = useMemo(
    () =>
      pref === "ANY"
        ? null
        : "Gender preference is coming soon — showing all verified psychologists for now.",
    [pref],
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <Text style={typeScale.h1}>Talk to a real psychologist</Text>
            <View style={styles.trustRow}>
              <Ionicons name="shield-checkmark" size={16} color="#1971C2" />
              <Text style={styles.trust}>
                RCI-verified. They&apos;ll only know you as {profile?.alias ?? "your alias"}.
              </Text>
            </View>

            <View style={styles.modeTabs}>
              {MODES.map((m) => {
                const on = mode === m.key;
                return (
                  <Pressable
                    key={m.key}
                    style={[styles.modeTab, on && styles.modeTabOn]}
                    onPress={() => setMode(m.key)}
                  >
                    <Text style={[styles.modeText, on && styles.modeTextOn]}>{m.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {SPECS.map((s) => {
                const on = spec === s.key;
                return (
                  <Pressable
                    key={s.key}
                    onPress={() => setSpec(s.key)}
                    style={[styles.chip, on && styles.chipOn]}
                  >
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>{s.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={styles.prefLabel}>I&apos;d prefer</Text>
            <View style={styles.prefWrap}>
              {PREFS.map((p) => {
                const on = pref === p.key;
                return (
                  <Pressable
                    key={p.key}
                    onPress={() => setPref(p.key)}
                    style={[styles.chip, on && styles.chipOn]}
                  >
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>{p.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            {prefNote ? <Text style={styles.prefNote}>{prefNote}</Text> : null}

            {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} /> : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {!loading && !error && items.length === 0 ? (
              <Text style={styles.empty}>
                No LIVE psychologists for this filter. Run{" "}
                <Text style={styles.mono}>npm run prisma:seed:local-catalogue</Text> on the backend.
              </Text>
            ) : null}
          </View>
        }
        renderItem={({ item }) => {
          const next = nextSlotById[item.id];
          const specs = item.specialisations.slice(0, 2).map(specLabel).join(", ");
          return (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View
                  style={[styles.avatar, { backgroundColor: item.avatarColor ?? colors.primaryTint }]}
                >
                  <Text style={styles.avatarText}>{item.avatarInitials ?? "?"}</Text>
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.name}>{item.publicName}</Text>
                  <Text style={styles.meta}>
                    {[item.highestDegree, specs].filter(Boolean).join(" · ")}
                  </Text>
                  <Text style={styles.meta}>
                    {item.languages.map((l) => specLabel(l)).join(", ")}
                  </Text>
                  {item.yearsPractising != null ? (
                    <Text style={styles.years}>{item.yearsPractising} years experience</Text>
                  ) : null}
                  {next ? (
                    <View style={styles.availRow}>
                      <Ionicons name="time-outline" size={14} color="#1971C2" />
                      <Text style={styles.avail}>{formatSlotLabel(next.startsAt)}</Text>
                    </View>
                  ) : (
                    <Text style={styles.meta}>No open slots this week</Text>
                  )}
                  <Text style={styles.price}>₹499 · 40 min · {mode.charAt(0) + mode.slice(1).toLowerCase()}</Text>
                </View>
              </View>
              <Pressable style={styles.bookBtn} onPress={() => void openBook(item)}>
                <Text style={styles.bookText}>Book</Text>
              </Pressable>
            </View>
          );
        }}
      />

      <Modal visible={!!bookingFor} animationType="slide" transparent onRequestClose={() => setBookingFor(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Book {bookingFor?.publicName}</Text>
            <Text style={styles.modalSub}>
              {mode.charAt(0) + mode.slice(1).toLowerCase()} · ₹499 · 40 min
            </Text>
            {slotsLoading ? <ActivityIndicator color={colors.primary} /> : null}
            {!slotsLoading && slots.length === 0 ? (
              <Text style={styles.empty}>No open slots in the next 2 weeks.</Text>
            ) : null}
            <ScrollView style={{ maxHeight: 240 }}>
              {slots.map((s) => {
                const on = selectedSlotId === s.id;
                return (
                  <Pressable
                    key={s.id}
                    onPress={() => setSelectedSlotId(s.id)}
                    style={[styles.slotRow, on && styles.slotRowOn]}
                  >
                    <Text style={[styles.slotText, on && styles.slotTextOn]}>{formatSlotLabel(s.startsAt)}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={() => setBookingFor(null)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.confirmBtn, (!selectedSlotId || bookingBusy) && { opacity: 0.5 }]}
                disabled={!selectedSlotId || bookingBusy}
                onPress={() => void confirmBook()}
              >
                {bookingBusy ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmText}>Pay ₹499</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  list: { paddingHorizontal: spacing.tabHorizontal, paddingBottom: 40, gap: spacing.md },
  headerBlock: { gap: spacing.md, paddingTop: spacing.md, marginBottom: spacing.sm },
  trustRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  trust: { flex: 1, fontFamily: fonts.sans, fontSize: 14, color: colors.inkMuted, lineHeight: 20 },
  modeTabs: {
    flexDirection: "row",
    backgroundColor: colors.primaryTint,
    borderRadius: radius.pill,
    padding: 4,
  },
  modeTab: { flex: 1, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  modeTabOn: { backgroundColor: colors.surface },
  modeText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.inkMuted },
  modeTextOn: { color: colors.ink, fontFamily: fonts.sansBold },
  chipRow: { gap: spacing.sm, paddingVertical: 2 },
  chip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.ink },
  chipTextOn: { color: "#FFFFFF" },
  prefLabel: { fontFamily: fonts.sansExtraBold, fontSize: 13, color: colors.ink },
  prefWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  prefNote: { fontFamily: fonts.sans, fontSize: 12, color: colors.inkMuted },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardTop: { flexDirection: "row", gap: spacing.md },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontFamily: fonts.serif, fontSize: 16, color: colors.ink },
  name: { fontFamily: fonts.sansBold, fontSize: 16, color: colors.ink },
  meta: { fontFamily: fonts.sans, fontSize: 12, color: colors.inkMuted },
  years: {
    alignSelf: "flex-start",
    marginTop: 4,
    backgroundColor: colors.sunTint,
    fontFamily: fonts.sansBold,
    fontSize: 11,
    color: colors.sunInk,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    overflow: "hidden",
  },
  availRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  avail: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: "#1971C2" },
  price: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.inkMuted, marginTop: 4 },
  bookBtn: {
    alignSelf: "flex-end",
    backgroundColor: colors.primary,
    height: 40,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  bookText: { fontFamily: fonts.sansBold, fontSize: 14, color: "#FFFFFF" },
  error: { color: colors.coralInk, fontFamily: fonts.sans, fontSize: 13 },
  empty: { fontFamily: fonts.sans, fontSize: 14, color: colors.inkMuted, lineHeight: 20 },
  mono: { fontFamily: fonts.sansBold, color: colors.ink },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(31,27,58,0.4)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.flowHorizontal,
    paddingBottom: 36,
    gap: spacing.md,
  },
  modalTitle: { fontFamily: fonts.serif, fontSize: 22, color: colors.ink },
  modalSub: { fontFamily: fonts.sans, fontSize: 14, color: colors.inkMuted },
  slotRow: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  slotRowOn: { backgroundColor: colors.primaryTint, borderColor: colors.primary },
  slotText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.ink },
  slotTextOn: { color: colors.primary },
  modalActions: { flexDirection: "row", gap: spacing.md, marginTop: spacing.sm },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.ink },
  confirmBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmText: { fontFamily: fonts.sansBold, fontSize: 14, color: "#FFFFFF" },
});
