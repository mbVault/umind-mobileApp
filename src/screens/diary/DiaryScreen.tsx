import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ApiError } from "../../api/client";
import {
  getDiaryEntry,
  getPrivacyConsent,
  putDiaryEntry,
  putPrivacyConsent,
  type DiaryPlaintext,
} from "../../api/diary";
import { formatErrorMessage } from "../../api/formatErrorMessage";
import {
  getMoodHistory,
  getMoodToday,
  listMoodCatalogue,
  putMoodToday,
  todayYmd,
  type MoodDto,
} from "../../api/moods";
import { useAuthSession } from "../../auth/AuthSessionContext";
import { DIARY_CAUSES } from "../../diary/causes";
import { decryptDiaryPayload, encryptDiaryPayload, ensureDiarySaltRegistered } from "../../diary/diaryCrypto";
import { DIARY_PROMPTS, pickPrompt } from "../../diary/prompts";
import type { MainTabParamList } from "../../navigation/types";
import { colors, radius, spacing } from "../../theme";
import { MOOD_OPTIONS } from "../../theme/mood";
import { fonts, typeScale } from "../../theme/typography";

type TabKey = "write" | "history";

function formatNowLabel(): string {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date());
}

function wordCount(text: string): number {
  const parts = text.trim().split(/\s+/).filter(Boolean);
  return parts.length;
}

function moodNameToKey(name: string): string | null {
  const hit = MOOD_OPTIONS.find((m) => m.label.toLowerCase() === name.toLowerCase());
  return hit?.key ?? null;
}

export function DiaryScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const { accessToken } = useAuthSession();
  const entryDate = todayYmd();

  const [tab, setTab] = useState<TabKey>("write");
  const [catalogue, setCatalogue] = useState<MoodDto[]>([]);
  const [moodId, setMoodId] = useState<string | null>(null);
  const [causes, setCauses] = useState<string[]>([]);
  const [promptIndex, setPromptIndex] = useState(0);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareOn, setShareOn] = useState(false);
  const [history, setHistory] = useState<{ date: string; mood: MoodDto }[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const prompt = useMemo(() => pickPrompt(promptIndex), [promptIndex]);
  const words = wordCount(body);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      await ensureDiarySaltRegistered(accessToken);
      const [moods, today, consent] = await Promise.all([
        listMoodCatalogue(accessToken),
        getMoodToday(accessToken, entryDate),
        getPrivacyConsent(accessToken),
      ]);
      setCatalogue(moods.moods);
      setMoodId(today.mood?.id ?? null);
      setShareOn(consent.shareDiaryWithSaathi);

      try {
        const envelope = await getDiaryEntry(accessToken, entryDate);
        const plain = await decryptDiaryPayload(envelope);
        setCauses(plain.causes ?? []);
        setBody(plain.body ?? "");
        if (plain.prompt) {
          const idx = DIARY_PROMPTS.findIndex((p) => p === plain.prompt);
          if (idx >= 0) setPromptIndex(idx);
        }
      } catch (e) {
        if (!(e instanceof ApiError && e.statusCode === 404)) {
          throw e;
        }
      }
    } catch (e) {
      setError(formatErrorMessage(e, "Could not load diary"));
    } finally {
      setLoading(false);
    }
  }, [accessToken, entryDate]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadHistory = useCallback(async () => {
    if (!accessToken) return;
    setHistoryLoading(true);
    try {
      const to = entryDate;
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 29);
      const from = `${fromDate.getFullYear()}-${String(fromDate.getMonth() + 1).padStart(2, "0")}-${String(fromDate.getDate()).padStart(2, "0")}`;
      const data = await getMoodHistory(accessToken, from, to);
      setHistory(data.items.slice().reverse());
    } catch (e) {
      setError(formatErrorMessage(e, "Could not load mood history"));
    } finally {
      setHistoryLoading(false);
    }
  }, [accessToken, entryDate]);

  useEffect(() => {
    if (tab === "history") void loadHistory();
  }, [tab, loadHistory]);

  const onSelectMood = async (id: string) => {
    if (!accessToken) return;
    setMoodId(id);
    try {
      await putMoodToday(accessToken, id, entryDate);
    } catch (e) {
      setError(formatErrorMessage(e, "Could not save mood"));
    }
  };

  const toggleCause = (cause: string) => {
    setCauses((prev) => (prev.includes(cause) ? prev.filter((c) => c !== cause) : [...prev, cause]));
  };

  const save = async () => {
    if (!accessToken) return;
    setSaving(true);
    setError(null);
    try {
      const plain: DiaryPlaintext = { causes, prompt, body: body.trim() };
      const sealed = await encryptDiaryPayload(plain);
      await putDiaryEntry(accessToken, entryDate, sealed);
      Alert.alert("Saved", "Today’s entry is encrypted on this device and synced.");
    } catch (e) {
      setError(formatErrorMessage(e, "Could not save diary"));
    } finally {
      setSaving(false);
    }
  };

  const reflect = async () => {
    if (!accessToken) return;
    const trimmed = body.trim();
    if (!trimmed) {
      Alert.alert("Write a little first", "Reflect needs today’s diary text.");
      return;
    }

    if (!shareOn) {
      Alert.alert(
        "Share with Saathi?",
        "Reflect sends only this entry to Saathi for this turn. Diary sharing is off — turn it on?",
        [
          { text: "Not now", style: "cancel" },
          {
            text: "Allow & Reflect",
            onPress: () => {
              void (async () => {
                try {
                  await putPrivacyConsent(accessToken, {
                    shareDiaryWithSaathi: true,
                    shareDiaryConsentVersion: 1,
                  });
                  setShareOn(true);
                  navigation.navigate("Saathi", {
                    reflect: { entryDate, causes, prompt, body: trimmed },
                  });
                } catch (e) {
                  setError(formatErrorMessage(e, "Could not update consent"));
                }
              })();
            },
          },
        ],
      );
      return;
    }

    navigation.navigate("Saathi", {
      reflect: { entryDate, causes, prompt, body: trimmed },
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <Text style={typeScale.h1}>My diary</Text>
          <View style={styles.privacyPill}>
            <Ionicons name="lock-closed" size={12} color={colors.ink} />
            <Text style={styles.privacyText}>Only you can read this.</Text>
          </View>
        </View>

        <View style={styles.tabs}>
          <Pressable
            style={[styles.tab, tab === "write" && styles.tabActive]}
            onPress={() => setTab("write")}
          >
            <Text style={[styles.tabText, tab === "write" && styles.tabTextActive]}>Write today</Text>
          </Pressable>
          <Pressable
            style={[styles.tab, tab === "history" && styles.tabActive]}
            onPress={() => setTab("history")}
          >
            <Text style={[styles.tabText, tab === "history" && styles.tabTextActive]}>Mood history</Text>
          </Pressable>
        </View>

        {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {tab === "write" && !loading ? (
          <>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.sectionTitle}>Right now, I feel</Text>
                <Text style={styles.meta}>{formatNowLabel()}</Text>
              </View>
              <View style={styles.moodRow}>
                {MOOD_OPTIONS.map((opt) => {
                  const dto = catalogue.find((m) => m.name === opt.label);
                  const selected = dto && moodId === dto.id;
                  return (
                    <Pressable
                      key={opt.key}
                      style={styles.moodItem}
                      disabled={!dto}
                      onPress={() => dto && void onSelectMood(dto.id)}
                    >
                      <View
                        style={[
                          styles.moodDot,
                          { backgroundColor: opt.color },
                          selected && styles.moodDotSelected,
                        ]}
                      />
                      <Text style={[styles.moodLabel, selected && styles.moodLabelSelected]}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Mostly because of…</Text>
              <View style={styles.causeRow}>
                {DIARY_CAUSES.map((cause) => {
                  const selected = causes.includes(cause);
                  return (
                    <Pressable
                      key={cause}
                      onPress={() => toggleCause(cause)}
                      style={[styles.causeChip, selected && styles.causeChipOn]}
                    >
                      <Text style={[styles.causeText, selected && styles.causeTextOn]}>{cause}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.promptCard}>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={styles.promptOverline}>TODAY&apos;S PROMPT</Text>
                <Text style={styles.promptBody}>{prompt}</Text>
              </View>
              <Pressable
                accessibilityLabel="Another prompt"
                onPress={() => setPromptIndex((i) => i + 1)}
                style={styles.refreshBtn}
              >
                <Ionicons name="refresh" size={18} color={colors.sunInk} />
              </Pressable>
            </View>

            <View style={styles.card}>
              <Text style={styles.dear}>Dear diary,</Text>
              <TextInput
                style={styles.editor}
                multiline
                value={body}
                onChangeText={setBody}
                placeholder="Write in Hindi, English, or Hinglish…"
                placeholderTextColor={colors.inkMuted}
                textAlignVertical="top"
              />
              <View style={styles.editorFooter}>
                <Pressable
                  accessibilityLabel="Voice entry coming soon"
                  onPress={() => Alert.alert("Voice entry", "Coming in a later phase.")}
                  style={styles.micBtn}
                >
                  <Ionicons name="mic" size={18} color="#FFFFFF" />
                </Pressable>
                <Text style={styles.words}>{words} words</Text>
                <View style={{ flex: 1 }} />
                <Pressable style={styles.reflectBtn} onPress={() => void reflect()}>
                  <Ionicons name="sparkles" size={14} color={colors.mintInk} />
                  <Text style={styles.reflectText}>Reflect</Text>
                </Pressable>
                <Pressable
                  style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                  disabled={saving}
                  onPress={() => void save()}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.saveText}>Save</Text>
                  )}
                </Pressable>
              </View>
            </View>

            <View style={styles.letterCard}>
              <View style={styles.letterTitleRow}>
                <Ionicons name="mail-outline" size={16} color={colors.ink} />
                <Text style={styles.letterTitle}>A letter I&apos;ll never send</Text>
              </View>
              <Text style={styles.letterBody}>
                Say it all to someone — then let it go. Never sent. Coming next.
              </Text>
            </View>
          </>
        ) : null}

        {tab === "history" ? (
          <View style={styles.card}>
            {historyLoading ? <ActivityIndicator color={colors.primary} /> : null}
            {!historyLoading && history.length === 0 ? (
              <Text style={styles.emptyHistory}>No mood check-ins in the last 30 days yet.</Text>
            ) : null}
            {history.map((row) => {
              const key = moodNameToKey(row.mood.name);
              const opt = MOOD_OPTIONS.find((m) => m.key === key);
              return (
                <View key={row.date} style={styles.historyRow}>
                  <View style={[styles.historyDot, { backgroundColor: opt?.color ?? colors.rail }]} />
                  <Text style={styles.historyDate}>{row.date}</Text>
                  <Text style={styles.historyMood}>{row.mood.name}</Text>
                </View>
              );
            })}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.tabHorizontal, paddingTop: spacing.md, paddingBottom: 40, gap: spacing.lg },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  privacyPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primaryTint,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  privacyText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.ink },
  tabs: {
    flexDirection: "row",
    backgroundColor: colors.primaryTint,
    borderRadius: radius.pill,
    padding: 4,
  },
  tab: { flex: 1, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  tabActive: { backgroundColor: colors.surface },
  tabText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.inkMuted },
  tabTextActive: { color: colors.ink, fontFamily: fonts.sansBold },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xxl,
    gap: spacing.md,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontFamily: fonts.sansExtraBold, fontSize: 15, color: colors.ink },
  meta: { fontFamily: fonts.sans, fontSize: 12, color: colors.inkMuted },
  moodRow: { flexDirection: "row", justifyContent: "space-between" },
  moodItem: { alignItems: "center", gap: 6, width: 56 },
  moodDot: { width: 36, height: 36, borderRadius: 18 },
  moodDotSelected: { borderWidth: 3, borderColor: colors.ink },
  moodLabel: { fontFamily: fonts.sans, fontSize: 11, color: colors.inkMuted },
  moodLabelSelected: { fontFamily: fonts.sansBold, color: colors.ink },
  causeRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  causeChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.surface,
  },
  causeChipOn: { backgroundColor: colors.coralTint, borderColor: colors.coral },
  causeText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.ink },
  causeTextOn: { color: colors.coralInk },
  promptCard: {
    flexDirection: "row",
    gap: spacing.md,
    backgroundColor: colors.sunTint,
    borderRadius: radius.card,
    padding: spacing.xxl,
    alignItems: "center",
  },
  promptOverline: {
    fontFamily: fonts.sansExtraBold,
    fontSize: 11,
    letterSpacing: 0.6,
    color: colors.sunInk,
  },
  promptBody: { fontFamily: fonts.sansMedium, fontSize: 15, lineHeight: 22, color: colors.ink },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  dear: { fontFamily: fonts.serif, fontSize: 20, color: colors.ink },
  editor: {
    minHeight: 120,
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 22,
    color: colors.ink,
  },
  editorFooter: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.sm },
  micBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  words: { fontFamily: fonts.sans, fontSize: 12, color: colors.inkMuted },
  reflectBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.mintTint,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
  },
  reflectText: { fontFamily: fonts.sansExtraBold, fontSize: 13, color: colors.mintInk },
  saveBtn: {
    backgroundColor: colors.primary,
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 64,
  },
  saveText: { fontFamily: fonts.sansBold, fontSize: 13, color: "#FFFFFF" },
  letterCard: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.rail,
    borderRadius: radius.card,
    padding: spacing.xxl,
    gap: spacing.sm,
  },
  letterTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  letterTitle: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.ink },
  letterBody: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 20, color: colors.inkMuted },
  error: { color: colors.coralInk, fontFamily: fonts.sans, fontSize: 13 },
  emptyHistory: { fontFamily: fonts.sans, fontSize: 14, color: colors.inkMuted },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyDot: { width: 14, height: 14, borderRadius: 7 },
  historyDate: { flex: 1, fontFamily: fonts.sans, fontSize: 14, color: colors.inkMuted },
  historyMood: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.ink },
});
