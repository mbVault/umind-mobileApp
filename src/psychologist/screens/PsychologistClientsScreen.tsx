import { Ionicons } from "@expo/vector-icons";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { fetchPsychologistClients, PsychologistClientItem } from "../api/psychologistApi";
import { StaffApiError } from "../api/staffClient";
import { fonts, psychColors, radius, spacing } from "../theme";

type TabKey = "ACTIVE" | "PAST";

const LIFE_STAGE_AGE: Record<string, string> = {
  GROWING_UP: "12–19",
  STARTING_OUT: "20–30",
  BUILDING: "30–45",
  SHIFTING: "45–60",
  WISDOM_YEARS: "60+",
};

const FEELING_LABEL: Record<string, string> = {
  STRESS: "Stress",
  ANXIETY: "Anxiety",
  GHABRAHAT: "Ghabrahat",
  LOW_MOOD: "Feeling low",
  SLEEP: "Sleep",
  LONELINESS: "Loneliness",
  RELATIONSHIPS: "Relationships",
  SELF_CARE: "Self-care",
  EXPLORING: "Exploring",
  // legacy (pre-migration clients)
  STRESSED: "Stress",
  ANXIOUS: "Anxiety",
  LOW: "Feeling low",
  CANT_SLEEP: "Sleep",
  LONELY: "Loneliness",
};

const avatarPalette = ["#5B45E0", "#6B7C3A", "#8B2E4A", "#1971C2", "#9C6B00", "#D9480F"];

const colorForAlias = (alias: string) => {
  let hash = 0;
  for (let i = 0; i < alias.length; i += 1) hash = (hash + alias.charCodeAt(i) * (i + 1)) % 997;
  return avatarPalette[hash % avatarPalette.length]!;
};

const clientInitial = (alias: string) => (alias.trim().slice(0, 1) || "?").toUpperCase();

const formatSessionWhen = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const time = d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
  if (sameDay) return `Today ${time}`;
  const day = d.toLocaleDateString("en-GB", { weekday: "short" });
  return `${day} ${time}`;
};

const concernLine = (c: PsychologistClientItem) => {
  const feelings = (c.startingFeelings ?? [])
    .map((f) => FEELING_LABEL[f] ?? f.replace(/_/g, " ").toLowerCase())
    .slice(0, 2);
  const concern = feelings.length > 0 ? feelings.join(", ") : "General support";
  const n = c.sessionCount;
  const sessions = n === 1 ? "1 session" : `${n} sessions`;
  return `${concern} · ${sessions}`;
};

const trendStyle = (trend: PsychologistClientItem["trend"]) => {
  switch (trend) {
    case "WATCH":
      return { label: "Watch", bg: "#FBE8D8", ink: "#9A5B1A" };
    case "IMPROVING":
      return { label: "Improving", bg: psychColors.mintTint, ink: psychColors.mintInk };
    case "STEADY":
    default:
      return { label: "Steady", bg: psychColors.primaryTint, ink: psychColors.primary };
  }
};

export function PsychologistClientsScreen() {
  const [items, setItems] = useState<PsychologistClientItem[]>([]);
  const [tab, setTab] = useState<TabKey>("ACTIVE");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (mode: "boot" | "refresh" = "boot") => {
    if (mode === "refresh") setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await fetchPsychologistClients();
      setItems(res.items);
    } catch (e) {
      const msg = e instanceof StaffApiError ? e.message : "Could not load clients";
      setError(msg);
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

  const activeCount = useMemo(() => items.filter((c) => c.relationship === "ACTIVE").length, [items]);
  const pastCount = useMemo(() => items.filter((c) => c.relationship === "PAST").length, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((c) => {
      if (c.relationship !== tab) return false;
      if (!q) return true;
      const hay = [
        c.alias,
        ...(c.startingFeelings ?? []).map((f) => FEELING_LABEL[f] ?? f),
        ...(c.startingFeelings ?? []),
        c.lifeStage ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [items, tab, query]);

  if (loading && items.length === 0) {
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
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void load("refresh")}
            tintColor={psychColors.primary}
          />
        }
      >
        <Text style={styles.title}>My clients</Text>
        <View style={styles.privacyRow}>
          <Ionicons name="lock-closed" size={14} color={psychColors.primary} />
          <Text style={styles.privacy}>Clients are known to you only by their U Mind name.</Text>
        </View>

        <View style={styles.segment}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setTab("ACTIVE")}
            style={[styles.segmentBtn, tab === "ACTIVE" && styles.segmentBtnOn]}
          >
            <Text style={[styles.segmentText, tab === "ACTIVE" && styles.segmentTextOn]}>
              Active · {activeCount}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => setTab("PAST")}
            style={[styles.segmentBtn, tab === "PAST" && styles.segmentBtnOn]}
          >
            <Text style={[styles.segmentText, tab === "PAST" && styles.segmentTextOn]}>
              Past · {pastCount}
            </Text>
          </Pressable>
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={psychColors.inkMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name or concern"
            placeholderTextColor={psychColors.inkMuted}
            style={styles.searchInput}
            autoCorrect={false}
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
        </View>

        {filtered.length === 0 ? (
          <Text style={styles.empty}>
            {items.length === 0
              ? "No clients yet. They appear here after their first booking with you."
              : tab === "ACTIVE"
                ? "No active clients match this search."
                : "No past clients match this search."}
          </Text>
        ) : (
          filtered.map((c) => {
            const trend = trendStyle(c.trend);
            const age = c.lifeStage ? LIFE_STAGE_AGE[c.lifeStage] : null;
            const whenIso = c.nextSessionAt ?? c.lastSessionAt;
            const whenPrefix = c.nextSessionAt ? "Next" : "Last";
            return (
              <View key={c.clientRef} style={styles.card}>
                <View style={[styles.avatar, { backgroundColor: colorForAlias(c.alias) }]}>
                  <Text style={styles.avatarText}>{clientInitial(c.alias)}</Text>
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.name}>
                    {c.alias}
                    {age ? <Text style={styles.age}> · {age}</Text> : null}
                  </Text>
                  <Text style={styles.meta}>{concernLine(c)}</Text>
                  {whenIso ? (
                    <Text style={[styles.when, c.nextSessionAt ? styles.whenNext : styles.whenLast]}>
                      {whenPrefix}: {formatSessionWhen(whenIso)}
                    </Text>
                  ) : null}
                </View>
                <View style={[styles.trend, { backgroundColor: trend.bg }]}>
                  <Text style={[styles.trendText, { color: trend.ink }]}>{trend.label}</Text>
                </View>
              </View>
            );
          })
        )}

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
    marginBottom: spacing.sm,
  },
  privacyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: spacing.lg,
  },
  privacy: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 13,
    color: psychColors.inkMuted,
  },
  segment: {
    flexDirection: "row",
    backgroundColor: psychColors.primaryTint,
    borderRadius: radius.card,
    padding: 4,
    marginBottom: spacing.md,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.input,
    alignItems: "center",
  },
  segmentBtnOn: {
    backgroundColor: psychColors.surface,
    shadowColor: "#1F1B3A",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  segmentText: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: psychColors.inkMuted,
  },
  segmentTextOn: { color: psychColors.ink },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: psychColors.surface,
    borderWidth: 1,
    borderColor: psychColors.border,
    borderRadius: radius.card,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    marginBottom: spacing.lg,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: psychColors.ink,
    padding: 0,
  },
  empty: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: psychColors.inkMuted,
    lineHeight: 20,
    marginTop: spacing.md,
  },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: psychColors.surface,
    borderRadius: radius.card,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: fonts.serif,
    fontSize: 18,
    color: "#fff",
  },
  cardBody: { flex: 1, minWidth: 0 },
  name: {
    fontFamily: fonts.serif,
    fontSize: 18,
    color: psychColors.ink,
  },
  age: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: psychColors.inkMuted,
  },
  meta: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: psychColors.inkMuted,
    marginTop: 2,
  },
  when: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    marginTop: 4,
  },
  whenNext: { color: psychColors.primary },
  whenLast: { color: psychColors.inkMuted },
  trend: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: "flex-start",
  },
  trendText: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
  },
  error: {
    marginTop: spacing.md,
    fontFamily: fonts.sans,
    fontSize: 13,
    color: psychColors.coralInk,
  },
});
