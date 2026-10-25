import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import {
  EarningsSummary,
  EarningsWeekItem,
  fetchEarningsSummary,
  fetchEarningsWeekly,
  fetchPsychologistPayouts,
  PayoutListItem,
} from "../api/psychologistApi";
import { StaffApiError } from "../api/staffClient";
import { fonts, psychColors, radius, spacing } from "../theme";

const SESSION_GROSS_FALLBACK_MINOR = 49900;

const pad2 = (n: number) => String(n).padStart(2, "0");

const currentMonthKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
};

const monthLabelLong = (yyyyMm: string) => {
  const [y, m] = yyyyMm.split("-").map(Number);
  return new Date(y!, m! - 1, 1).toLocaleDateString("en-GB", { month: "long" }).toUpperCase();
};

const monthLabelTitle = (yyyyMm: string) => {
  const [y, m] = yyyyMm.split("-").map(Number);
  return new Date(y!, m! - 1, 1).toLocaleDateString("en-GB", { month: "long" });
};

const formatInrFromMinor = (minor: number) => {
  const rupees = minor / 100;
  const hasPaise = Math.round(rupees * 100) % 100 !== 0;
  return `₹${rupees.toLocaleString("en-IN", {
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
};

const formatInrExact = (minor: number) =>
  `₹${(minor / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

type MonthBucket = {
  month: string;
  sessionCount: number;
  psychologistShareMinorUnits: number;
  allPaid: boolean;
  anyPending: boolean;
};

const bucketPayoutsByMonth = (items: PayoutListItem[]): MonthBucket[] => {
  const map = new Map<string, MonthBucket>();
  for (const p of items) {
    const d = new Date(p.scheduledStartAt);
    const key = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
    const row =
      map.get(key) ??
      ({
        month: key,
        sessionCount: 0,
        psychologistShareMinorUnits: 0,
        allPaid: true,
        anyPending: false,
      } satisfies MonthBucket);
    row.sessionCount += 1;
    row.psychologistShareMinorUnits += p.psychologistShareMinorUnits;
    if (p.status === "PAID") {
      // keep
    } else {
      row.allPaid = false;
      row.anyPending = true;
    }
    map.set(key, row);
  }
  return [...map.values()].sort((a, b) => b.month.localeCompare(a.month));
};

/** Map ISO-week rows into up to 5 calendar buckets labelled Wk 1… for the chart. */
const weekBars = (items: EarningsWeekItem[]) => {
  if (items.length === 0) {
    return [1, 2, 3, 4].map((n) => ({ label: `Wk ${n}`, count: 0 }));
  }
  return items.map((w, i) => ({
    label: `Wk ${i + 1}`,
    count: w.sessionCount,
  }));
};

export function PsychologistEarningsScreen() {
  const month = useMemo(() => currentMonthKey(), []);
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [weeks, setWeeks] = useState<EarningsWeekItem[]>([]);
  const [history, setHistory] = useState<MonthBucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (mode: "boot" | "refresh" = "boot") => {
      if (mode === "refresh") setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const [sum, weekly, payouts] = await Promise.all([
          fetchEarningsSummary(month),
          fetchEarningsWeekly(month),
          fetchPsychologistPayouts(1, 100),
        ]);
        setSummary(sum);
        setWeeks(weekly.items);
        setHistory(bucketPayoutsByMonth(payouts.items));
      } catch (e) {
        const msg = e instanceof StaffApiError ? e.message : "Could not load earnings";
        setError(msg);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [month]
  );

  useFocusEffect(
    useCallback(() => {
      void load("boot");
    }, [load])
  );

  const splitPercent = summary?.splitPercent ?? 70;
  const platformPercent = 100 - splitPercent;
  const sessionCount = summary?.eligibleSessionCount ?? 0;
  const grossPerSession =
    sessionCount > 0 && summary
      ? Math.round(summary.grossMinorUnits / sessionCount)
      : SESSION_GROSS_FALLBACK_MINOR;
  const youPerSession = Math.round((grossPerSession * splitPercent) / 100);
  const umindPerSession = grossPerSession - youPerSession;
  const bars = weekBars(weeks);
  const maxBar = Math.max(1, ...bars.map((b) => b.count));

  const currentBucket = history.find((h) => h.month === month);
  const pastBuckets = history.filter((h) => h.month < month);

  if (loading && !summary) {
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
        <Text style={styles.title}>Earnings</Text>

        <View style={styles.hero}>
          <Text style={styles.heroEyebrow}>{monthLabelLong(month)} SO FAR</Text>
          <Text style={styles.heroAmount}>
            {formatInrExact(summary?.psychologistShareMinorUnits ?? 0)}
          </Text>
          <Text style={styles.heroSub}>
            {sessionCount} session{sessionCount === 1 ? "" : "s"} × {formatInrExact(youPerSession)}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Every {formatInrFromMinor(grossPerSession)} session</Text>
          <View style={styles.splitTrack}>
            <View style={[styles.splitYou, { flex: splitPercent }]} />
            <View style={[styles.splitPlatform, { flex: platformPercent }]} />
          </View>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: "#0E9F6E" }]} />
              <Text style={styles.legendText}>
                You, {splitPercent}% · {formatInrExact(youPerSession)}
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: psychColors.primary }]} />
              <Text style={styles.legendText}>
                U Mind, {platformPercent}% · {formatInrExact(umindPerSession)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.weekHeader}>
            <Text style={styles.cardTitle}>Sessions by week</Text>
            <Text style={styles.weekMonth}>{monthLabelTitle(month)}</Text>
          </View>
          <View style={styles.chartRow}>
            {bars.map((b) => (
              <View key={b.label} style={styles.barCol}>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        height: `${Math.max(8, (b.count / maxBar) * 100)}%`,
                        opacity: b.count === maxBar && b.count > 0 ? 1 : 0.55,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{b.label}</Text>
                <Text style={styles.barCount}>{b.count}</Text>
              </View>
            ))}
          </View>
        </View>

        {(currentBucket || (summary && summary.pendingMinorUnits > 0)) && (
          <View style={styles.nextPayout}>
            <View style={{ flex: 1 }}>
              <Text style={styles.nextTitle}>Next payout · {monthLabelTitle(month)}</Text>
              <Text style={styles.nextSub}>
                {summary && summary.pendingMinorUnits > 0
                  ? "Pending transfer to your bank"
                  : "Settled for this month"}
              </Text>
            </View>
            <Text style={styles.nextAmount}>
              {formatInrExact(
                summary?.pendingMinorUnits ||
                  currentBucket?.psychologistShareMinorUnits ||
                  summary?.psychologistShareMinorUnits ||
                  0
              )}
            </Text>
          </View>
        )}

        {pastBuckets.map((b) => (
          <View key={b.month} style={styles.historyCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.historyMonth}>{monthLabelTitle(b.month)}</Text>
              <View style={styles.historyMeta}>
                <Text style={styles.historySessions}>
                  {b.sessionCount} session{b.sessionCount === 1 ? "" : "s"}
                </Text>
                <View
                  style={[
                    styles.paidPill,
                    b.allPaid ? styles.paidPillOn : styles.paidPillPending,
                  ]}
                >
                  <Text
                    style={[
                      styles.paidPillText,
                      b.allPaid ? styles.paidPillTextOn : styles.paidPillTextPending,
                    ]}
                  >
                    {b.allPaid ? "Paid" : "Pending"}
                  </Text>
                </View>
              </View>
            </View>
            <Text style={styles.historyAmount}>
              {formatInrExact(b.psychologistShareMinorUnits)}
            </Text>
          </View>
        ))}

        {!currentBucket && pastBuckets.length === 0 && sessionCount === 0 ? (
          <Text style={styles.empty}>
            Earnings appear here after completed sessions. Each ₹499 session shares {splitPercent}% with
            you.
          </Text>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: psychColors.background },
  boot: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, paddingTop: spacing.md },
  title: {
    fontFamily: fonts.serif,
    fontSize: 32,
    color: psychColors.ink,
    marginBottom: spacing.lg,
  },
  hero: {
    backgroundColor: "#0B6B4B",
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  heroEyebrow: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
    letterSpacing: 0.6,
    color: "rgba(255,255,255,0.75)",
    marginBottom: 8,
  },
  heroAmount: {
    fontFamily: fonts.serif,
    fontSize: 36,
    color: "#fff",
  },
  heroSub: {
    marginTop: 6,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
  },
  card: {
    backgroundColor: psychColors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontFamily: fonts.serif,
    fontSize: 18,
    color: psychColors.ink,
    marginBottom: spacing.md,
  },
  splitTrack: {
    flexDirection: "row",
    height: 14,
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: spacing.md,
  },
  splitYou: { backgroundColor: "#0E9F6E" },
  splitPlatform: { backgroundColor: psychColors.rail },
  legendRow: { gap: 8 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: psychColors.ink,
  },
  weekHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  weekMonth: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: psychColors.inkMuted,
    marginBottom: spacing.md,
  },
  chartRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 140,
    gap: 8,
  },
  barCol: { flex: 1, alignItems: "center", height: "100%" },
  barTrack: {
    flex: 1,
    width: "70%",
    justifyContent: "flex-end",
    marginBottom: 6,
  },
  barFill: {
    width: "100%",
    backgroundColor: psychColors.primary,
    borderRadius: 8,
    minHeight: 8,
  },
  barLabel: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: psychColors.inkMuted,
  },
  barCount: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
    color: psychColors.ink,
    marginTop: 2,
  },
  nextPayout: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: psychColors.primaryTint,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    gap: 12,
  },
  nextTitle: {
    fontFamily: fonts.serif,
    fontSize: 16,
    color: psychColors.ink,
  },
  nextSub: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: psychColors.inkMuted,
    marginTop: 2,
  },
  nextAmount: {
    fontFamily: fonts.serif,
    fontSize: 18,
    color: psychColors.ink,
  },
  historyCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: psychColors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: psychColors.border,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    gap: 12,
  },
  historyMonth: {
    fontFamily: fonts.serif,
    fontSize: 16,
    color: psychColors.ink,
  },
  historyMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  historySessions: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: psychColors.inkMuted,
  },
  paidPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  paidPillOn: { backgroundColor: psychColors.mintTint },
  paidPillPending: { backgroundColor: psychColors.sunTint },
  paidPillText: { fontFamily: fonts.sansBold, fontSize: 12 },
  paidPillTextOn: { color: psychColors.mintInk },
  paidPillTextPending: { color: psychColors.sunInk },
  historyAmount: {
    fontFamily: fonts.serif,
    fontSize: 16,
    color: psychColors.ink,
  },
  empty: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: psychColors.inkMuted,
    lineHeight: 20,
    marginTop: spacing.md,
  },
  error: {
    marginTop: spacing.md,
    fontFamily: fonts.sans,
    fontSize: 13,
    color: psychColors.coralInk,
  },
});
