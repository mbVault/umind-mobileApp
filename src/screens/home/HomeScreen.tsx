import { Ionicons } from "@expo/vector-icons";
import { useNavigation, type CompositeNavigationProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
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
import { CLIENT_AVATAR_OPTIONS } from "../../avatars/catalog";
import { DiceBearAvatar } from "../../components/DiceBearAvatar";
import { SosSheet } from "../../components/SosSheet";
import {
  getMoodToday,
  listMoodCatalogue,
  putMoodToday,
  todayYmd,
  type MoodDto,
} from "../../api/moods";
import { useAuthSession } from "../../auth/AuthSessionContext";
import {
  checkInChipLabel,
  feelingChipLabel,
  greetingForNow,
  lifeStageForYouLabel,
} from "../../home/labels";
import type { HomeStackParamList, MainTabParamList } from "../../navigation/types";
import { useProfile } from "../../profile/ProfileContext";
import { fetchLiveWeather, type LiveWeather } from "../../services/weather";
import type { MoodKey } from "../../storage/moodStorage";
import { colors, radius, spacing } from "../../theme";
import { MOOD_OPTIONS } from "../../theme/mood";
import { fonts } from "../../theme/typography";

const FOR_YOU = [
  { title: "4-7-8 breath for a racing heart", meta: "4 min · Stress", tint: "#FFE1DB" },
  { title: "Sleep, slowly", meta: "20 min · Sleep", tint: "#2A1F6B", ink: "#FFF8F0" },
  { title: "Letting go of tomorrow", meta: "6 min · Stress", tint: "#3A2D8A", ink: "#CFC7FF" },
];

const MORE = [
  { title: "Know your mind type", sub: "A 1-minute Ayurveda check", tint: colors.mintTint },
  { title: "Help me say it", sub: "Words for hard talks at home", tint: colors.primaryTint },
  { title: "Worried about someone?", sub: "How to help a loved one", tint: colors.coralTint },
  { title: "Session prep & after-care", sub: "Make every ₹499 session count", tint: colors.sunTint },
];

type HomeNav = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList, "HomeMain">,
  BottomTabNavigationProp<MainTabParamList>
>;

export function HomeScreen() {
  const navigation = useNavigation<HomeNav>();
  const { user, accessToken } = useAuthSession();
  const { profile, loading: profileLoading } = useProfile();

  const [mood, setMood] = useState<MoodKey | null>(null);
  const [moodCatalogue, setMoodCatalogue] = useState<MoodDto[]>([]);
  const [weather, setWeather] = useState<LiveWeather | null>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [sosOpen, setSosOpen] = useState(false);

  const alias = profile?.alias ?? user?.alias ?? "friend";
  const avatarId = profile?.avatarId ?? user?.avatarId ?? CLIENT_AVATAR_OPTIONS[0].id;
  const avatar = useMemo(
    () => CLIENT_AVATAR_OPTIONS.find((o) => o.id === avatarId) ?? CLIENT_AVATAR_OPTIONS[0],
    [avatarId],
  );

  useEffect(() => {
    if (!accessToken) return;
    void (async () => {
      try {
        const [catalogue, today] = await Promise.all([
          listMoodCatalogue(accessToken),
          getMoodToday(accessToken, todayYmd()),
        ]);
        setMoodCatalogue(catalogue.moods);
        const key = MOOD_OPTIONS.find((m) => m.label === today.mood?.name)?.key ?? null;
        setMood(key);
      } catch {
        setMood(null);
      }
    })();
  }, [accessToken]);

  const loadWeather = useCallback(async (city: string) => {
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      const data = await fetchLiveWeather(city);
      setWeather(data);
    } catch {
      setWeatherError("Couldn't load live weather. Pull to retry later.");
      setWeather(null);
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  useEffect(() => {
    if (profile?.city) {
      void loadWeather(profile.city);
    }
  }, [profile?.city, loadWeather]);

  const onSelectMood = async (key: MoodKey) => {
    setMood(key);
    if (!accessToken) return;
    const label = MOOD_OPTIONS.find((m) => m.key === key)?.label;
    const dto = moodCatalogue.find((m) => m.name === label);
    if (!dto) return;
    try {
      await putMoodToday(accessToken, dto.id, todayYmd());
    } catch {
      // Keep local selection; diary/Home can retry on next open.
    }
  };

  const chips = useMemo(() => {
    const feelings = (profile?.startingFeelings ?? []).slice(0, 3).map(feelingChipLabel);
    const checkIn = profile?.saathiCheckIn ? checkInChipLabel(profile.saathiCheckIn) : null;
    return [...feelings, ...(checkIn ? [checkIn] : [])];
  }, [profile]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open profile"
            onPress={() => navigation.navigate("Profile")}
            style={styles.greetingRow}
          >
            <DiceBearAvatar styleKey={avatar.style} seed={avatar.seed} size={40} />
            <View>
              <Text style={styles.greetingMeta}>{greetingForNow()},</Text>
              <Text style={styles.greetingName}>{alias}</Text>
            </View>
          </Pressable>
          <View style={styles.headerActions}>
            <Pressable
              accessibilityLabel="Hidden mode"
              style={styles.iconBtn}
              onPress={() => Alert.alert("Hidden mode", "Coming in a later phase.")}
            >
              <Ionicons name="eye-off-outline" size={20} color={colors.ink} />
            </Pressable>
            <Pressable style={styles.sosBtn} onPress={() => setSosOpen(true)}>
              <Ionicons name="help-buoy-outline" size={16} color="#8E3A22" />
              <Text style={styles.sosText}>SOS</Text>
            </Pressable>
          </View>
        </View>

        {profileLoading && !profile ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.lg }} />
        ) : null}

        <View style={styles.moodCard}>
          <View style={styles.moodHeader}>
            <Text style={styles.sectionTitle}>How's your mind today?</Text>
            <Pressable onPress={() => navigation.navigate("Diary")}>
              <Text style={styles.link}>Write diary ›</Text>
            </Pressable>
          </View>
          <View style={styles.moodRow}>
            {MOOD_OPTIONS.map((m) => {
              const selected = mood === m.key;
              return (
                <Pressable key={m.key} style={styles.moodItem} onPress={() => void onSelectMood(m.key)}>
                  <View
                    style={[
                      styles.moodDot,
                      { backgroundColor: m.color },
                      selected && styles.moodDotSelected,
                    ]}
                  />
                  <Text style={[styles.moodLabel, selected && styles.moodLabelSelected]}>{m.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {chips.length > 0 ? (
          <View style={styles.chipRow}>
            {chips.map((c) => (
              <View key={c} style={styles.prefChip}>
                <Text style={styles.prefChipText}>{c}</Text>
              </View>
            ))}
            <Pressable onPress={() => Alert.alert("My space", "Edit preferences coming soon.")}>
              <Text style={styles.link}>Edit</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.weatherCard}>
          <View style={styles.weatherTop}>
            <View style={styles.weatherLoc}>
              <Ionicons name="location-outline" size={16} color={colors.inkMuted} />
              <Text style={styles.weatherLocText}>
                {(weather?.cityLabel ?? profile?.city ?? "—").toUpperCase()} · TODAY
              </Text>
            </View>
            <Pressable
              onPress={() =>
                Alert.alert(
                  "Change city",
                  "Edit your city in My space soon. For now weather uses the city from onboarding.",
                  profile?.city
                    ? [{ text: "Refresh weather", onPress: () => void loadWeather(profile.city) }, { text: "OK" }]
                    : [{ text: "OK" }],
                )
              }
            >
              <Text style={styles.link}>Change city</Text>
            </Pressable>
          </View>
          {weatherLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : weather ? (
            <>
              <Text style={styles.weatherTemp}>
                {Math.round(weather.tempC)}° · {weather.conditionText}
              </Text>
              <Text style={styles.weatherTip}>{weather.tip}</Text>
              <Pressable style={styles.weatherCta} onPress={() => navigation.navigate("Listen")}>
                <Text style={styles.weatherCtaText}>{weather.playLabel}</Text>
              </Pressable>
            </>
          ) : (
            <Text style={styles.weatherTip}>{weatherError ?? "Add a city to see live weather."}</Text>
          )}
          <View style={styles.didYouKnow}>
            <Ionicons name="help-circle-outline" size={18} color={colors.sunInk} />
            <Text style={styles.didYouKnowText}>
              Breathing out longer than you breathe in tells your body it's safe. Try 4 in, 6 out.
            </Text>
          </View>
        </View>

        <View style={styles.saathiHero}>
          <Text style={styles.saathiOverline}>✦ SAATHI · YOUR AI COMPANION</Text>
          <Text style={styles.saathiTitle}>Mann mein kuch hai? Let's talk it out.</Text>
          <Text style={styles.saathiBody}>
            Anonymous, 24×7, in Hindi or English. Saathi suggests what to listen to.
          </Text>
          <Pressable style={styles.sunBtn} onPress={() => navigation.navigate("Saathi")}>
            <Text style={styles.sunBtnText}>Start talking</Text>
          </Pressable>
        </View>

        <View style={styles.forYouHeader}>
          <Text style={styles.sectionTitle}>{lifeStageForYouLabel(profile?.lifeStage ?? "")}</Text>
          <Pressable onPress={() => navigation.navigate("Listen")}>
            <Text style={styles.link}>See all</Text>
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.forYouRow}>
          {FOR_YOU.map((card) => (
            <Pressable
              key={card.title}
              style={[styles.audioCard, { backgroundColor: card.tint }]}
              onPress={() => navigation.navigate("Listen")}
            >
              <Text style={[styles.audioTitle, card.ink ? { color: card.ink } : null]}>{card.title}</Text>
              <Text style={[styles.audioMeta, card.ink ? { color: card.ink, opacity: 0.85 } : null]}>
                {card.meta}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.checkInCard}>
          <View style={styles.checkInHeader}>
            <Ionicons name="notifications-outline" size={16} color={colors.sunInk} />
            <Text style={styles.checkInOverline}>SAATHI CHECK-IN · FOR YOU</Text>
          </View>
          <Text style={styles.checkInBody}>
            Kaisi ho feeling right now — excited, anxious, both? Talk it out or play a short session.
          </Text>
          <View style={styles.checkInActions}>
            <Pressable style={styles.inkBtn} onPress={() => navigation.navigate("Saathi")}>
              <Text style={styles.inkBtnText}>Talk about it</Text>
            </Pressable>
            <Pressable style={styles.outlineBtn} onPress={() => navigation.navigate("Listen")}>
              <Text style={styles.outlineBtnText}>Play a session</Text>
            </Pressable>
            <Text style={styles.notNow}>Not now</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: spacing.sm }]}>More for you</Text>
        <View style={styles.moreGrid}>
          {MORE.map((item) => (
            <Pressable
              key={item.title}
              style={[styles.moreCard, { backgroundColor: item.tint }]}
              onPress={() => Alert.alert(item.title, "Coming in a later phase.")}
            >
              <Text style={styles.moreTitle}>{item.title}</Text>
              <Text style={styles.moreSub}>{item.sub}</Text>
            </Pressable>
          ))}
        </View>

        {profile?.gender === "WOMAN" ? (
          <Pressable
            style={styles.herHealth}
            onPress={() => Alert.alert("Her Health", "Cycle tracking coming soon.")}
          >
            <View>
              <Text style={styles.bannerTitle}>Her Health</Text>
              <Text style={styles.bannerSub}>Optional cycle & mood space — private to you</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.inkMuted} />
          </Pressable>
        ) : null}

        <Pressable style={styles.humanCard} onPress={() => navigation.navigate("Experts")}>
          <View style={styles.humanIcon}>
            <Ionicons name="person-outline" size={20} color={colors.coralInk} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Prefer a human?</Text>
            <Text style={styles.bannerSub}>Book a verified psychologist. They only see '{alias}'.</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.inkMuted} />
        </Pressable>
      </ScrollView>

      <SosSheet
        visible={sosOpen}
        onClose={() => setSosOpen(false)}
        onBreathe={() => navigation.navigate("Listen")}
        onBookHuman={() => navigation.navigate("Experts")}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: spacing.tabHorizontal,
    paddingBottom: 28,
    gap: spacing.lg,
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  greetingRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  greetingMeta: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.inkMuted },
  greetingName: { fontFamily: fonts.serif, fontSize: 20, color: colors.ink },
  headerActions: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  sosBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: "#FBEDE7",
    borderWidth: 1,
    borderColor: "#E9C3B6",
  },
  sosText: { fontFamily: fonts.sansBold, fontSize: 13, color: "#8E3A22" },
  moodCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  moodHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.ink },
  link: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.primary },
  moodRow: { flexDirection: "row", justifyContent: "space-between" },
  moodItem: { alignItems: "center", width: 56, gap: 6 },
  moodDot: { width: 36, height: 36, borderRadius: 18 },
  moodDotSelected: { borderWidth: 2.5, borderColor: colors.ink },
  moodLabel: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.inkMuted },
  moodLabelSelected: { color: colors.ink, fontFamily: fonts.sansBold },
  chipRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: spacing.sm },
  prefChip: {
    backgroundColor: colors.primaryTint,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.chip,
  },
  prefChipText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.primary },
  weatherCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  weatherTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  weatherLoc: { flexDirection: "row", alignItems: "center", gap: 4 },
  weatherLocText: { fontFamily: fonts.sansBold, fontSize: 11, color: colors.inkMuted, letterSpacing: 0.6 },
  weatherTemp: { fontFamily: fonts.sansBold, fontSize: 18, color: colors.ink },
  weatherTip: { fontFamily: fonts.sans, fontSize: 14, color: colors.ink, lineHeight: 21 },
  weatherCta: {
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  weatherCtaText: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.surface },
  didYouKnow: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: colors.sunTint,
    borderRadius: 14,
    padding: spacing.md,
  },
  didYouKnowText: { flex: 1, fontFamily: fonts.sans, fontSize: 13, color: colors.sunInk, lineHeight: 18 },
  saathiHero: {
    backgroundColor: colors.primary,
    borderRadius: radius.card,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  saathiOverline: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    color: "#E6E1FF",
    letterSpacing: 0.8,
  },
  saathiTitle: { fontFamily: fonts.serif, fontSize: 24, color: colors.surface, lineHeight: 30 },
  saathiBody: { fontFamily: fonts.sans, fontSize: 13, color: "#E6E1FF", lineHeight: 19 },
  sunBtn: {
    marginTop: spacing.sm,
    alignSelf: "flex-start",
    backgroundColor: colors.sun,
    paddingHorizontal: 18,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  sunBtnText: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.ink },
  forYouHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  forYouRow: { gap: spacing.md, paddingRight: spacing.tabHorizontal },
  audioCard: {
    width: 148,
    minHeight: 120,
    borderRadius: 16,
    padding: spacing.lg,
    justifyContent: "flex-end",
    gap: 6,
  },
  audioTitle: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.ink },
  audioMeta: { fontFamily: fonts.sans, fontSize: 12, color: colors.inkMuted },
  checkInCard: {
    backgroundColor: colors.sunTint,
    borderRadius: radius.card,
    padding: spacing.lg,
    gap: spacing.md,
  },
  checkInHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  checkInOverline: { fontFamily: fonts.sansBold, fontSize: 11, color: colors.sunInk, letterSpacing: 0.5 },
  checkInBody: { fontFamily: fonts.sans, fontSize: 14, color: colors.ink, lineHeight: 20 },
  checkInActions: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: spacing.sm },
  inkBtn: {
    backgroundColor: colors.ink,
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
  },
  inkBtnText: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.surface },
  outlineBtn: {
    borderWidth: 1,
    borderColor: colors.ink,
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  outlineBtnText: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.ink },
  notNow: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.inkMuted, paddingHorizontal: 8 },
  moreGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  moreCard: {
    width: "47%",
    flexGrow: 1,
    minHeight: 100,
    borderRadius: 16,
    padding: spacing.lg,
    gap: 6,
  },
  moreTitle: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.ink },
  moreSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.inkMuted, lineHeight: 17 },
  herHealth: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFE4EC",
    borderRadius: radius.card,
    padding: spacing.lg,
    gap: spacing.md,
  },
  humanCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF1EE",
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "#FFD2C9",
    padding: spacing.lg,
    gap: spacing.md,
  },
  humanIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.coralTint,
    alignItems: "center",
    justifyContent: "center",
  },
  bannerTitle: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.ink },
  bannerSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.inkMuted, marginTop: 2, lineHeight: 17 },
});
