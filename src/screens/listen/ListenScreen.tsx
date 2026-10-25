import { Ionicons } from "@expo/vector-icons";
import { useRoute, type RouteProp } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { listAudioTracks, requestAudioPlayback, type AudioListItem } from "../../api/audio";
import { formatErrorMessage } from "../../api/formatErrorMessage";
import { useAuthSession } from "../../auth/AuthSessionContext";
import { lifeStageForYouLabel } from "../../home/labels";
import type { MainTabParamList } from "../../navigation/types";
import { useProfile } from "../../profile/ProfileContext";
import { colors, radius, spacing } from "../../theme";
import { fonts, typeScale } from "../../theme/typography";

const FILTERS = [
  { key: "ALL", label: "All" },
  { key: "STRESS", label: "Stress" },
  { key: "ANXIETY", label: "Anxiety" },
  { key: "SLEEP", label: "Sleep" },
  { key: "FOCUS", label: "Focus" },
  { key: "RELATIONSHIPS", label: "Relationships" },
  { key: "BODY", label: "Body" },
  { key: "HER_CYCLE", label: "Her Cycle" },
] as const;

const THUMB: Record<string, { bg: string; icon: keyof typeof Ionicons.glyphMap; tint: string }> = {
  STRESS: { bg: "#FFE1DB", icon: "radio-button-on", tint: "#B83A24" },
  ANXIETY: { bg: "#D9F5EA", icon: "git-compare-outline", tint: "#0B6B4B" },
  SLEEP: { bg: "#2A1F6B", icon: "moon", tint: "#CFC7FF" },
  FOCUS: { bg: "#ECE8FF", icon: "flash-outline", tint: "#5B45E0" },
  RELATIONSHIPS: { bg: "#FFEFD0", icon: "heart-outline", tint: "#8A5A12" },
  BODY: { bg: "#DDEEFF", icon: "body-outline", tint: "#1971C2" },
  HER_CYCLE: { bg: "#FFE1DB", icon: "flower-outline", tint: "#B83A24" },
};

function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return "—";
  const m = Math.max(1, Math.round(seconds / 60));
  return `${m} min`;
}

function categoryLabel(code: string): string {
  return FILTERS.find((f) => f.key === code)?.label ?? code;
}

export function ListenScreen() {
  const route = useRoute<RouteProp<MainTabParamList, "Listen">>();
  const { accessToken } = useAuthSession();
  const { profile } = useProfile();
  const initialCategory = route.params?.category?.toUpperCase();

  const [filter, setFilter] = useState<string>(
    initialCategory && FILTERS.some((f) => f.key === initialCategory) ? initialCategory : "ALL",
  );
  const [items, setItems] = useState<AudioListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const subtitle = useMemo(() => {
    const stage = profile?.lifeStage ? lifeStageForYouLabel(profile.lifeStage) : "your life stage";
    return `Voice sessions in Hindi & English, picked for ${stage}.`;
  }, [profile?.lifeStage]);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const language = profile?.saathiLanguage === "HINDI" ? "HINDI" : "ENGLISH";
      const data = await listAudioTracks(accessToken, {
        language,
        ...(filter !== "ALL" ? { category: filter } : {}),
      });
      setItems(data.items);
    } catch (e) {
      setError(formatErrorMessage(e, "Could not load sessions"));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken, filter, profile?.saathiLanguage]);

  useEffect(() => {
    void load();
  }, [load]);

  const onPlay = async (item: AudioListItem) => {
    if (!accessToken) return;
    setPlayingId(item.id);
    try {
      const play = await requestAudioPlayback(accessToken, item.id, item.language);
      const supported = await Linking.canOpenURL(play.playbackUrl);
      if (!supported) {
        Alert.alert("Playback", "Could not open this audio URL on the device.");
        return;
      }
      await Linking.openURL(play.playbackUrl);
    } catch (e) {
      Alert.alert("Playback", formatErrorMessage(e, "Could not start playback"));
    } finally {
      setPlayingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.topBlock}>
            <View style={styles.header}>
              <Text style={typeScale.h1}>Listen</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filtersScroll}
              contentContainerStyle={styles.filters}
            >
              {FILTERS.map((f) => {
                const on = filter === f.key;
                return (
                  <Pressable
                    key={f.key}
                    onPress={() => setFilter(f.key)}
                    style={[styles.chip, on && styles.chipOn]}
                  >
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>{f.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {loading ? <ActivityIndicator color={colors.primary} style={{ marginVertical: 12 }} /> : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {!loading && items.length === 0 ? (
              <Text style={styles.empty}>
                No sessions available for you on this filter yet. Some tracks need trial or a paid
                subscription; free picks still show when published.
              </Text>
            ) : null}
          </View>
        }
        renderItem={({ item }) => {
          const thumb = THUMB[item.category] ?? THUMB.FOCUS!;
          return (
            <View style={styles.card}>
              <View style={[styles.thumb, { backgroundColor: thumb.bg }]}>
                <Ionicons name={thumb.icon} size={22} color={thumb.tint} />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.title} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.meta}>
                  {formatDuration(item.durationSeconds)} · {categoryLabel(item.category)}
                  {item.accessTier === "FREE"
                    ? " · Free"
                    : item.accessTier === "TRIAL"
                      ? " · Trial"
                      : item.accessTier === "SUBSCRIPTION"
                        ? " · Sub"
                        : ""}
                </Text>
              </View>
              <Pressable
                accessibilityLabel={`Play ${item.title}`}
                style={styles.playBtn}
                onPress={() => void onPlay(item)}
                disabled={playingId === item.id}
              >
                {playingId === item.id ? (
                  <ActivityIndicator color={colors.primary} size="small" />
                ) : (
                  <Ionicons name="play" size={18} color={colors.primary} />
                )}
              </Pressable>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBlock: { marginBottom: spacing.sm, paddingTop: spacing.md },
  header: { gap: spacing.sm },
  subtitle: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 20, color: colors.inkMuted },
  filtersScroll: { flexGrow: 0, marginTop: spacing.md, marginHorizontal: -spacing.tabHorizontal },
  filters: {
    paddingHorizontal: spacing.tabHorizontal,
    paddingBottom: 0,
    alignItems: "center",
  },
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
  list: { paddingHorizontal: spacing.tabHorizontal, gap: spacing.md, paddingBottom: 32 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: { flex: 1, gap: 4 },
  title: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.ink },
  meta: { fontFamily: fonts.sans, fontSize: 12, color: colors.inkMuted },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryTint,
    alignItems: "center",
    justifyContent: "center",
  },
  error: {
    color: colors.coralInk,
    fontFamily: fonts.sans,
    fontSize: 13,
    marginTop: spacing.sm,
  },
  empty: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.inkMuted,
    marginTop: spacing.sm,
  },
});
