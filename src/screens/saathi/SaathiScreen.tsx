import { Ionicons } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ApiError } from "../../api/client";
import { formatErrorMessage } from "../../api/formatErrorMessage";
import {
  createSaathiConversation,
  getSaathiConversation,
  listSaathiConversations,
  sendSaathiMessage,
  type AudioRecommendation,
  type CrisisResource,
  type DiaryContextPayload,
  type SaathiMessage,
} from "../../api/saathi";
import { useAuthSession } from "../../auth/AuthSessionContext";
import { useProfile } from "../../profile/ProfileContext";
import type { MainTabParamList } from "../../navigation/types";
import { colors, radius, spacing } from "../../theme";
import { fonts, typeScale } from "../../theme/typography";
import { SAATHI_QUICK_REPLIES } from "./quickReplies";

type ChatRow =
  | { kind: "message"; message: SaathiMessage }
  | { kind: "welcome"; id: string; text: string };

export function SaathiScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const route = useRoute<RouteProp<MainTabParamList, "Saathi">>();
  const tabBarHeight = useBottomTabBarHeight();
  const { accessToken } = useAuthSession();
  const { profile } = useProfile();
  const alias = profile?.alias?.trim() || "friend";
  const reflectHandled = useRef<string | null>(null);

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [rows, setRows] = useState<ChatRow[]>([]);
  const [draft, setDraft] = useState("");
  const [booting, setBooting] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [crisis, setCrisis] = useState<CrisisResource[]>([]);
  const [recs, setRecs] = useState<AudioRecommendation[]>([]);
  const [voiceHint, setVoiceHint] = useState(false);
  const listRef = useRef<FlatList<ChatRow>>(null);
  const bootOnce = useRef(false);

  const welcomeText = `Hi ${alias}. Kaisi ho? What’s sitting heavy on your mind today?`;

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }, []);

  const boot = useCallback(async () => {
    if (!accessToken) return;
    setBooting(true);
    setError(null);
    setBlocked(false);
    try {
      const listed = await listSaathiConversations(accessToken, 1, 1);
      let id = listed.items[0]?.id;
      if (!id) {
        const created = await createSaathiConversation(accessToken);
        id = created.id;
      }
      const detail = await getSaathiConversation(accessToken, id, 1, 50);
      setConversationId(id);
      const messages = detail.messages.items;
      if (messages.length === 0) {
        setRows([{ kind: "welcome", id: "welcome", text: welcomeText }]);
      } else {
        setRows(messages.map((m) => ({ kind: "message" as const, message: m })));
      }
    } catch (e) {
      if (e instanceof ApiError && e.statusCode === 403) {
        setBlocked(true);
        setError("Saathi needs an active trial or subscription.");
      } else {
        setError(formatErrorMessage(e, "Could not open Saathi"));
      }
    } finally {
      setBooting(false);
      scrollToEnd();
    }
  }, [accessToken, scrollToEnd, welcomeText]);

  useEffect(() => {
    if (!accessToken || bootOnce.current) return;
    bootOnce.current = true;
    void boot();
  }, [accessToken, boot]);

  const send = async (content: string, diaryContext?: DiaryContextPayload) => {
    const text = content.trim();
    if (!text || !accessToken || !conversationId || sending) return;

    setSending(true);
    setError(null);
    setVoiceHint(false);
    setDraft("");

    const optimistic: SaathiMessage = {
      id: `local-user-${Date.now()}`,
      role: "USER",
      content: text,
      status: "COMPLETED",
      createdAt: new Date().toISOString(),
    };
    setRows((prev) => {
      const withoutWelcome = prev.filter((r) => r.kind !== "welcome");
      return [...withoutWelcome, { kind: "message", message: optimistic }];
    });
    scrollToEnd();

    try {
      const result = await sendSaathiMessage(accessToken, conversationId, text, diaryContext);
      setRows((prev) => {
        const withoutOptimistic = prev.filter(
          (r) => !(r.kind === "message" && r.message.id === optimistic.id),
        );
        return [
          ...withoutOptimistic,
          { kind: "message", message: result.userMessage },
          { kind: "message", message: result.assistantMessage },
        ];
      });
      setCrisis(result.crisisResources ?? []);
      setRecs(result.audioRecommendations ?? []);
      scrollToEnd();
    } catch (e) {
      setRows((prev) => prev.filter((r) => !(r.kind === "message" && r.message.id === optimistic.id)));
      setDraft(text);
      if (e instanceof ApiError && e.statusCode === 403) {
        setBlocked(true);
        setError("Saathi needs an active trial or subscription.");
      } else {
        setError(formatErrorMessage(e, "Message failed to send"));
      }
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    setRows((prev) => {
      if (prev.length === 1 && prev[0]?.kind === "welcome") {
        return [{ kind: "welcome", id: "welcome", text: welcomeText }];
      }
      return prev;
    });
  }, [welcomeText]);

  useEffect(() => {
    const reflect = route.params?.reflect;
    if (!reflect || !conversationId || booting || blocked || sending) return;
    const key = `${reflect.entryDate}:${reflect.body.slice(0, 40)}`;
    if (reflectHandled.current === key) return;
    reflectHandled.current = key;
    navigation.setParams({ reflect: undefined });
    void send("Help me reflect on today’s diary entry.", {
      entryDate: reflect.entryDate,
      causes: reflect.causes,
      prompt: reflect.prompt,
      body: reflect.body,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- send intentionally one-shot on reflect param
  }, [route.params?.reflect, conversationId, booting, blocked, sending, navigation]);

  const showQuickReplies = !booting && !blocked && rows.length === 1 && rows[0]?.kind === "welcome";

  const renderRow = ({ item }: { item: ChatRow }) => {
    if (item.kind === "welcome") {
      return (
        <View style={styles.bubbleAssistant}>
          <Text style={styles.bubbleText}>{item.text}</Text>
        </View>
      );
    }
    const isUser = item.message.role === "USER";
    return (
      <View style={[styles.bubbleAssistant, isUser && styles.bubbleUser]}>
        <Text style={[styles.bubbleText, isUser && styles.bubbleUserText]}>{item.message.content}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to Home"
            onPress={() => navigation.navigate("Home")}
            hitSlop={12}
            style={styles.iconBtn}
          >
            <Ionicons name="chevron-back" size={24} color={colors.ink} />
          </Pressable>

          <View style={styles.headerIdentity}>
            <View style={styles.saathiAvatar}>
              <Ionicons name="sparkles" size={16} color={colors.sun} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Saathi</Text>
              <Text style={styles.subtitle}>AI companion · private</Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Talk to a human psychologist"
            onPress={() => navigation.navigate("Experts")}
            style={styles.humanChip}
          >
            <Ionicons name="person-outline" size={14} color={colors.coralInk} />
            <Text style={styles.humanChipText}>Human</Text>
          </Pressable>
        </View>

        <View style={styles.privacyBanner}>
          <Ionicons name="lock-closed" size={12} color={colors.ink} />
          <Text style={styles.privacyText}>
            Chatting as {alias} · Saathi is an AI, not a doctor
          </Text>
        </View>

        {booting ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
        ) : (
          <FlatList
            ref={listRef}
            data={rows}
            keyExtractor={(item) => (item.kind === "welcome" ? item.id : item.message.id)}
            contentContainerStyle={[styles.list, { paddingBottom: 12 }]}
            renderItem={renderRow}
            onContentSizeChange={scrollToEnd}
            ListFooterComponent={
              <View style={styles.footerBlock}>
                {showQuickReplies ? (
                  <View style={styles.chips}>
                    {SAATHI_QUICK_REPLIES.map((label) => (
                      <Pressable
                        key={label}
                        accessibilityRole="button"
                        disabled={sending}
                        onPress={() => void send(label)}
                        style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
                      >
                        <Text style={styles.chipText}>{label}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}

                {recs.length > 0 ? (
                  <View style={styles.recs}>
                    <Text style={styles.recsTitle}>Suggested listens</Text>
                    {recs.map((r) => (
                      <Pressable
                        key={r.trackId}
                        style={styles.recCard}
                        onPress={() => navigation.navigate("Listen")}
                      >
                        <Text style={styles.recTitle}>{r.title}</Text>
                        <Text style={styles.recMeta}>
                          {r.category} · {r.language}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}

                {crisis.length > 0 ? (
                  <View style={styles.crisisBox}>
                    <Text style={styles.crisisTitle}>If you feel unsafe, reach a human now</Text>
                    {crisis.map((c) => (
                      <Pressable
                        key={c.id}
                        onPress={() => void Linking.openURL(`tel:${c.phone}`)}
                        style={styles.crisisRow}
                      >
                        <Text style={styles.crisisLabel}>
                          {c.label}: {c.phone}
                        </Text>
                        <Text style={styles.crisisNote}>{c.note}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </View>
            }
          />
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {voiceHint ? (
          <Text style={styles.hint}>Voice input isn’t available yet — type your message for now.</Text>
        ) : null}

        {!blocked ? (
          <View style={[styles.composerWrap, { paddingBottom: Math.max(tabBarHeight > 0 ? 8 : 12, 8) }]}>
            <View style={styles.composer}>
              <TextInput
                style={styles.input}
                value={draft}
                onChangeText={setDraft}
                placeholder="Type or speak — Hindi, English"
                placeholderTextColor={colors.inkMuted}
                multiline
                maxLength={4000}
                editable={!sending && !booting}
                onSubmitEditing={() => void send(draft)}
                blurOnSubmit={false}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Voice input coming soon"
                onPress={() => setVoiceHint(true)}
                style={styles.micBtn}
              >
                <Ionicons name="mic-outline" size={20} color={colors.primary} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Send message"
                disabled={sending || !draft.trim() || booting}
                onPress={() => void send(draft)}
                style={({ pressed }) => [
                  styles.sendBtn,
                  (!draft.trim() || sending) && styles.sendDisabled,
                  pressed && draft.trim() && styles.sendPressed,
                ]}
              >
                {sending ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Ionicons name="send" size={18} color="#FFFFFF" />
                )}
              </Pressable>
            </View>
            <Text style={styles.safety}>
              Feeling unsafe? Call{" "}
              <Text style={styles.safetyStrong} onPress={() => void Linking.openURL("tel:14416")}>
                Tele-MANAS 14416
              </Text>{" "}
              — free, 24×7
            </Text>
          </View>
        ) : (
          <View style={styles.blockedBox}>
            <Text style={styles.blockedText}>
              Start a trial from onboarding, or restore a subscribed account, to chat with Saathi.
            </Text>
            <Pressable style={styles.retryBtn} onPress={() => void boot()}>
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.tabHorizontal,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  iconBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerIdentity: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.md },
  saathiAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: -0.22,
    color: colors.ink,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.inkMuted,
    marginTop: 1,
  },
  humanChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.coralTint,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 18,
  },
  humanChipText: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    color: colors.coralInk,
  },
  privacyBanner: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.md,
    marginHorizontal: spacing.tabHorizontal,
    backgroundColor: colors.primaryTint,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  privacyText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: colors.ink,
    textAlign: "center",
    flexShrink: 1,
  },
  list: {
    paddingHorizontal: spacing.tabHorizontal,
    paddingTop: spacing.xxl,
    gap: spacing.md,
  },
  bubbleAssistant: {
    alignSelf: "flex-start",
    maxWidth: "88%",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  bubbleUser: {
    alignSelf: "flex-end",
    backgroundColor: colors.primaryTint,
    borderColor: colors.rail,
  },
  bubbleText: {
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 22,
    color: colors.ink,
  },
  bubbleUserText: {
    fontFamily: fonts.sansMedium,
  },
  footerBlock: { gap: spacing.md, marginTop: spacing.md },
  chips: { gap: spacing.sm, alignItems: "flex-start" },
  chip: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.surface,
  },
  chipPressed: { backgroundColor: colors.primaryTint },
  chipText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: colors.primary,
  },
  recs: { gap: spacing.sm },
  recsTitle: {
    fontFamily: fonts.sansExtraBold,
    fontSize: 13,
    color: colors.ink,
  },
  recCard: {
    backgroundColor: colors.mintTint,
    borderRadius: radius.card,
    padding: spacing.lg,
  },
  recTitle: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.mintInk },
  recMeta: { fontFamily: fonts.sans, fontSize: 12, color: colors.inkMuted, marginTop: 2 },
  crisisBox: {
    backgroundColor: "#FBEDE7",
    borderWidth: 1,
    borderColor: "#E9C3B6",
    borderRadius: radius.card,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  crisisTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: "#8E3A22",
  },
  crisisRow: { gap: 2 },
  crisisLabel: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.coralInk },
  crisisNote: { fontFamily: fonts.sans, fontSize: 12, color: "#8E3A22" },
  error: {
    color: colors.coralInk,
    fontFamily: fonts.sans,
    fontSize: 13,
    paddingHorizontal: spacing.tabHorizontal,
    marginBottom: 4,
  },
  hint: {
    color: colors.inkMuted,
    fontFamily: fonts.sans,
    fontSize: 12,
    paddingHorizontal: spacing.tabHorizontal,
    marginBottom: 4,
  },
  composerWrap: {
    paddingHorizontal: spacing.tabHorizontal,
    paddingTop: spacing.sm,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#FFF3E8",
    borderRadius: radius.input,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.ink,
  },
  micBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.rail,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendPressed: { backgroundColor: colors.primaryPressed },
  sendDisabled: { opacity: 0.45 },
  safety: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.inkMuted,
    textAlign: "center",
    marginBottom: 4,
  },
  safetyStrong: {
    fontFamily: fonts.sansBold,
    color: colors.coralInk,
  },
  blockedBox: {
    margin: spacing.tabHorizontal,
    padding: spacing.xxl,
    backgroundColor: colors.sunTint,
    borderRadius: radius.card,
    gap: spacing.md,
  },
  blockedText: {
    ...typeScale.body,
    color: colors.sunInk,
  },
  retryBtn: {
    alignSelf: "flex-start",
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  retryText: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    color: "#FFFFFF",
  },
});
