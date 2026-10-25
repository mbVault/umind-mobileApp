import { Ionicons } from "@expo/vector-icons";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import {
  BookingBrief,
  DashboardBooking,
  fetchBookingBrief,
  fetchPsychologistDashboard,
  joinPsychologistSession,
  patchPsychologistPresence,
  PsychologistDashboard,
} from "../api/psychologistApi";
import { StaffApiError } from "../api/staffClient";
import { fonts, psychColors, radius, spacing } from "../theme";

const modeLabel = (mode: string) => {
  switch (mode) {
    case "CHAT":
      return "Chat";
    case "VOICE":
      return "Voice";
    case "VIDEO":
      return "Video";
    default:
      return mode;
  }
};

const greetingForNow = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });

const formatInrFromMinor = (minor: number) =>
  `₹${(minor / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const monthShort = () =>
  new Date().toLocaleDateString("en-GB", { month: "short" });

const startsInLabel = (iso: string) => {
  const mins = Math.round((new Date(iso).getTime() - Date.now()) / 60000);
  if (mins <= 0) return "STARTING NOW";
  if (mins < 60) return `STARTS IN ${mins} MIN`;
  const h = Math.floor(mins / 60);
  return `STARTS IN ${h}H ${mins % 60}M`;
};

const clientInitial = (alias: string) => (alias.trim().slice(0, 1) || "?").toUpperCase();

const avatarPalette = ["#5B45E0", "#0E8A62", "#C2255C", "#1971C2", "#9C6B00", "#D9480F"];

const colorForAlias = (alias: string) => {
  let hash = 0;
  for (let i = 0; i < alias.length; i += 1) hash = (hash + alias.charCodeAt(i) * (i + 1)) % 997;
  return avatarPalette[hash % avatarPalette.length]!;
};

type ListTag = { label: string; bg: string; ink: string };

const tagForBooking = (
  b: DashboardBooking,
  nextId: string | null
): ListTag => {
  if (b.sessionStatus === "COMPLETED" || b.bookingStatus === "COMPLETED") {
    return { label: "Done", bg: psychColors.mintTint, ink: psychColors.mintInk };
  }
  if (b.hasSafetyFlag) {
    return { label: "Flag", bg: psychColors.coralTint, ink: psychColors.coralInk };
  }
  if (nextId && b.bookingId === nextId) {
    return { label: "Next", bg: psychColors.primaryTint, ink: psychColors.primary };
  }
  if (b.bookingStatus === "CONFIRMED") {
    return { label: "Upcoming", bg: psychColors.primaryTint, ink: psychColors.primary };
  }
  return { label: b.bookingStatus, bg: psychColors.border, ink: psychColors.inkMuted };
};

export function PsychologistTodayScreen() {
  const [dash, setDash] = useState<PsychologistDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [presenceBusy, setPresenceBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brief, setBrief] = useState<BookingBrief | null>(null);
  const [briefOpen, setBriefOpen] = useState(false);
  const [briefLoading, setBriefLoading] = useState(false);

  const load = useCallback(async (mode: "boot" | "refresh" = "boot") => {
    if (mode === "boot") setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const data = await fetchPsychologistDashboard();
      setDash(data);
    } catch (err) {
      setError(err instanceof StaffApiError ? err.message : "Could not load today.");
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

  const online = dash?.presence === "ONLINE";
  const next = dash?.nextBooking ?? null;
  const nextId = next?.bookingId ?? null;

  const greetingName = useMemo(() => {
    const raw = dash?.displayName?.trim();
    if (!raw) return "doctor";
    return raw.replace(/^dr\.?\s+/i, "").trim() || raw;
  }, [dash?.displayName]);

  const initials =
    dash?.avatarInitials?.trim() ||
    greetingName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]!.toUpperCase())
      .join("") ||
    "U";

  const togglePresence = async () => {
    if (!dash || presenceBusy) return;
    const nextPresence = online ? "AWAY" : "ONLINE";
    setPresenceBusy(true);
    try {
      await patchPsychologistPresence(nextPresence);
      setDash({ ...dash, presence: nextPresence });
    } catch (err) {
      Alert.alert("Presence", err instanceof StaffApiError ? err.message : "Could not update presence.");
    } finally {
      setPresenceBusy(false);
    }
  };

  const openBrief = async (bookingId: string) => {
    setBriefLoading(true);
    setBriefOpen(true);
    setBrief(null);
    try {
      setBrief(await fetchBookingBrief(bookingId));
    } catch (err) {
      setBriefOpen(false);
      Alert.alert("Brief", err instanceof StaffApiError ? err.message : "Could not load brief.");
    } finally {
      setBriefLoading(false);
    }
  };

  const onJoin = async (booking: DashboardBooking) => {
    if (!booking.sessionId) {
      Alert.alert("Join", "Session is not ready yet. It appears after payment confirms.");
      return;
    }
    try {
      const res = await joinPsychologistSession(booking.sessionId);
      if (res.media?.status === "UNAVAILABLE") {
        Alert.alert(
          "Joined (attendance recorded)",
          res.media.reason ?? "Live media is not configured yet. Notes and aftercare still work once that lands."
        );
      }
      void load("refresh");
    } catch (err) {
      Alert.alert("Join", err instanceof StaffApiError ? err.message : "Could not join session.");
    }
  };

  const shareBlurb = (b: DashboardBooking) => {
    const bits: string[] = [];
    if (b.shareSaathiSummary) bits.push("Saathi summary");
    if (b.shareMoodHistory) bits.push("mood history");
    if (bits.length === 0) return "Client chose not to share Saathi summary or mood history.";
    return `Shared her ${bits.join(" and ")}.`;
  };

  if (loading && !dash) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.boot}>
          <ActivityIndicator color={psychColors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
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
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: dash?.avatarColor || psychColors.primary }]}>
            <Text style={styles.avatarText}>{initials.slice(0, 2)}</Text>
          </View>
          <View style={styles.headerCopy}>
            <Text style={styles.greeting}>
              {greetingForNow()}, Dr. {greetingName}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: online }}
            onPress={() => void togglePresence()}
            disabled={presenceBusy}
            style={[styles.presencePill, online ? styles.presenceOn : styles.presenceOff]}
          >
            <View style={[styles.presenceDot, online ? styles.dotOn : styles.dotOff]} />
            <Text style={[styles.presenceText, online ? styles.presenceTextOn : styles.presenceTextOff]}>
              {presenceBusy ? "…" : online ? "Online" : "Away"}
            </Text>
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{dash?.todaySessionCount ?? 0}</Text>
            <Text style={styles.statLabel}>sessions today</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{dash?.monthSessionCount ?? 0}</Text>
            <Text style={styles.statLabel}>this month</Text>
          </View>
          <View style={[styles.statCard, styles.statEarn]}>
            <Text style={[styles.statValue, styles.statEarnValue]}>
              {formatInrFromMinor(dash?.monthEarnings.psychologistShareMinorUnits ?? 0)}
            </Text>
            <Text style={[styles.statLabel, styles.statEarnLabel]}>earned in {monthShort()}</Text>
          </View>
        </View>

        {next ? (
          <View style={styles.nextCard}>
            <Text style={styles.nextEyebrow}>NEXT SESSION · {startsInLabel(next.scheduledStartAt)}</Text>
            <View style={styles.nextRow}>
              <View style={[styles.nextAvatar, { backgroundColor: colorForAlias(next.client.alias) }]}>
                <Text style={styles.nextAvatarText}>{clientInitial(next.client.alias)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.nextName}>{next.client.alias}</Text>
                <Text style={styles.nextTime}>{formatTime(next.scheduledStartAt)}</Text>
              </View>
            </View>
            <Text style={styles.nextMeta}>
              {modeLabel(next.communicationMode)} · 40 min
              {(next.sessionNumber ?? 1) <= 1 ? " · First session" : ` · Session ${next.sessionNumber}`}
            </Text>
            <Text style={styles.nextBlurb}>{shareBlurb(next)}</Text>
            <View style={styles.nextActions}>
              <Pressable style={styles.briefBtn} onPress={() => void openBrief(next.bookingId)}>
                <Text style={styles.briefBtnText}>View brief</Text>
              </Pressable>
              <Pressable style={styles.joinBtn} onPress={() => void onJoin(next)}>
                <Text style={styles.joinBtnText}>Join</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.emptyNext}>
            <Text style={styles.emptyNextTitle}>No upcoming session</Text>
            <Text style={styles.emptyNextBody}>
              When a client books you, the next session will show up here with brief and join.
            </Text>
          </View>
        )}

        {(dash?.safetyAlerts ?? []).map((alert) => (
          <View key={alert.bookingId} style={styles.flagCard}>
            <View style={styles.flagIcon}>
              <Ionicons name="warning" size={18} color={psychColors.coralInk} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.flagTitle}>
                Safety flag · {alert.clientAlias}, {formatTime(alert.scheduledStartAt)}
              </Text>
              <Text style={styles.flagBody}>{alert.message}</Text>
            </View>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Today&apos;s sessions</Text>
        {(dash?.todayBookings ?? []).length === 0 ? (
          <Text style={styles.emptyList}>No sessions scheduled for today.</Text>
        ) : (
          <View style={styles.listCard}>
            {(dash?.todayBookings ?? []).map((b, idx) => {
              const tag = tagForBooking(b, nextId);
              return (
                <Pressable
                  key={b.bookingId}
                  style={[styles.listRow, idx > 0 && styles.listRowBorder]}
                  onPress={() => void openBrief(b.bookingId)}
                >
                  <Text style={styles.listTime}>{formatTime(b.scheduledStartAt)}</Text>
                  <View style={[styles.listAvatar, { backgroundColor: colorForAlias(b.client.alias) }]}>
                    <Text style={styles.listAvatarText}>{clientInitial(b.client.alias)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listName}>{b.client.alias}</Text>
                    <Text style={styles.listMode}>{modeLabel(b.communicationMode)}</Text>
                  </View>
                  <View style={[styles.tag, { backgroundColor: tag.bg }]}>
                    <Text style={[styles.tagText, { color: tag.ink }]}>{tag.label}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <Modal visible={briefOpen} animationType="slide" transparent onRequestClose={() => setBriefOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Client brief</Text>
            {briefLoading || !brief ? (
              <ActivityIndicator color={psychColors.primary} style={{ marginVertical: 24 }} />
            ) : (
              <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
                <Text style={styles.modalName}>{brief.client.alias}</Text>
                <Text style={styles.modalMeta}>
                  Session {brief.sessionNumber} · {modeLabel(brief.communicationMode)} ·{" "}
                  {formatTime(brief.scheduledStartAt)}
                </Text>
                {brief.client.startingFeelings?.length ? (
                  <Text style={styles.modalMeta}>Feelings: {brief.client.startingFeelings.join(", ")}</Text>
                ) : null}
                <Text style={styles.modalSection}>Saathi summary</Text>
                <Text style={styles.modalBody}>
                  {brief.shareSaathiSummary
                    ? brief.saathiSummary?.trim() || "Shared, but no summary is available yet."
                    : "Not shared for this booking."}
                </Text>
                <Text style={styles.modalSection}>Mood history</Text>
                {!brief.shareMoodHistory ? (
                  <Text style={styles.modalBody}>Not shared for this booking.</Text>
                ) : brief.moodHistory.length === 0 ? (
                  <Text style={styles.modalBody}>No mood check-ins in the last 30 days.</Text>
                ) : (
                  brief.moodHistory.slice(-8).map((m) => (
                    <Text key={m.date} style={styles.modalBody}>
                      {m.date}: {m.moodName}
                    </Text>
                  ))
                )}
              </ScrollView>
            )}
            <Pressable style={styles.modalClose} onPress={() => setBriefOpen(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  header: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontFamily: fonts.sansExtraBold, fontSize: 16, color: "#FFF" },
  headerCopy: { flex: 1 },
  greeting: {
    fontFamily: fonts.serif,
    fontSize: 22,
    lineHeight: 28,
    color: psychColors.ink,
  },
  presencePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  presenceOn: { backgroundColor: psychColors.mintTint },
  presenceOff: { backgroundColor: psychColors.border },
  presenceDot: { width: 8, height: 8, borderRadius: 4 },
  dotOn: { backgroundColor: psychColors.onlineDot },
  dotOff: { backgroundColor: psychColors.inkMuted },
  presenceText: { fontFamily: fonts.sansBold, fontSize: 13 },
  presenceTextOn: { color: psychColors.mintInk },
  presenceTextOff: { color: psychColors.inkMuted },
  statsRow: { flexDirection: "row", gap: spacing.sm },
  statCard: {
    flex: 1,
    backgroundColor: psychColors.surface,
    borderRadius: radius.input,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: psychColors.border,
  },
  statEarn: { backgroundColor: psychColors.mintTint, borderColor: psychColors.mintTint },
  statValue: {
    fontFamily: fonts.sansExtraBold,
    fontSize: 20,
    color: psychColors.ink,
  },
  statEarnValue: { color: psychColors.mintInk, fontSize: 16 },
  statLabel: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: psychColors.inkMuted,
    marginTop: 2,
  },
  statEarnLabel: { color: psychColors.mintInk },
  nextCard: {
    backgroundColor: psychColors.primary,
    borderRadius: radius.card,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  nextEyebrow: {
    fontFamily: fonts.sansExtraBold,
    fontSize: 11,
    letterSpacing: 0.8,
    color: "rgba(255,255,255,0.85)",
  },
  nextRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: 4 },
  nextAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  nextAvatarText: { fontFamily: fonts.sansExtraBold, fontSize: 18, color: "#FFF" },
  nextName: { fontFamily: fonts.sansExtraBold, fontSize: 20, color: "#FFF" },
  nextTime: { fontFamily: fonts.sans, fontSize: 14, color: "rgba(255,255,255,0.85)" },
  nextMeta: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: "rgba(255,255,255,0.9)" },
  nextBlurb: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 19, color: "rgba(255,255,255,0.9)" },
  nextActions: { flexDirection: "row", gap: spacing.md, marginTop: spacing.sm },
  briefBtn: {
    flex: 1,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: psychColors.sun,
    alignItems: "center",
    justifyContent: "center",
  },
  briefBtnText: { fontFamily: fonts.sansExtraBold, fontSize: 15, color: psychColors.ink },
  joinBtn: {
    flex: 1,
    height: 48,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  joinBtnText: { fontFamily: fonts.sansExtraBold, fontSize: 15, color: "#FFF" },
  emptyNext: {
    backgroundColor: psychColors.surface,
    borderRadius: radius.card,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: psychColors.border,
    gap: spacing.sm,
  },
  emptyNextTitle: { fontFamily: fonts.sansExtraBold, fontSize: 16, color: psychColors.ink },
  emptyNextBody: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 19, color: psychColors.inkMuted },
  flagCard: {
    flexDirection: "row",
    gap: spacing.md,
    backgroundColor: psychColors.coralTint,
    borderRadius: radius.input,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "#F0C4B8",
  },
  flagIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },
  flagTitle: { fontFamily: fonts.sansExtraBold, fontSize: 14, color: psychColors.coralInk },
  flagBody: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18, color: psychColors.coralInk, marginTop: 2 },
  sectionTitle: {
    fontFamily: fonts.serif,
    fontSize: 22,
    color: psychColors.ink,
    marginTop: spacing.sm,
  },
  emptyList: { fontFamily: fonts.sans, fontSize: 14, color: psychColors.inkMuted },
  listCard: {
    backgroundColor: psychColors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: psychColors.border,
    overflow: "hidden",
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  listRowBorder: { borderTopWidth: 1, borderTopColor: psychColors.border },
  listTime: {
    width: 72,
    fontFamily: fonts.sansBold,
    fontSize: 12,
    color: psychColors.inkMuted,
  },
  listAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  listAvatarText: { fontFamily: fonts.sansExtraBold, fontSize: 14, color: "#FFF" },
  listName: { fontFamily: fonts.sansExtraBold, fontSize: 15, color: psychColors.ink },
  listMode: { fontFamily: fonts.sans, fontSize: 12, color: psychColors.inkMuted },
  tag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  tagText: { fontFamily: fonts.sansBold, fontSize: 11 },
  error: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: psychColors.coralInk },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(31,27,58,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: psychColors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.flowHorizontal,
    paddingBottom: spacing.xxl * 2,
    gap: spacing.md,
  },
  modalHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: psychColors.border,
    marginBottom: spacing.sm,
  },
  modalTitle: { fontFamily: fonts.serif, fontSize: 24, color: psychColors.ink },
  modalName: { fontFamily: fonts.sansExtraBold, fontSize: 18, color: psychColors.ink },
  modalMeta: { fontFamily: fonts.sans, fontSize: 13, color: psychColors.inkMuted, marginBottom: 4 },
  modalSection: {
    fontFamily: fonts.sansExtraBold,
    fontSize: 13,
    color: psychColors.ink,
    marginTop: spacing.md,
    marginBottom: 4,
  },
  modalBody: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 20, color: psychColors.inkMuted },
  modalClose: {
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: psychColors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
  },
  modalCloseText: { fontFamily: fonts.sansExtraBold, fontSize: 16, color: "#FFF" },
});
