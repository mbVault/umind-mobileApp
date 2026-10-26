import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMemo, useState } from "react";
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
import { useAuthSession } from "../../auth/AuthSessionContext";
import {
  checkInChipLabel,
  feelingChipLabel,
  lifeStageForYouLabel,
} from "../../home/labels";
import type { HomeStackParamList } from "../../navigation/types";
import { useProfile } from "../../profile/ProfileContext";
import { colors, radius, spacing } from "../../theme";
import { fonts, typeScale } from "../../theme/typography";

export function ClientProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const { user, logout } = useAuthSession();
  const { profile, loading } = useProfile();
  const [loggingOut, setLoggingOut] = useState(false);

  const alias = profile?.alias ?? user?.alias ?? "friend";
  const avatarId = profile?.avatarId ?? user?.avatarId ?? CLIENT_AVATAR_OPTIONS[0].id;
  const avatar = useMemo(
    () => CLIENT_AVATAR_OPTIONS.find((o) => o.id === avatarId) ?? CLIENT_AVATAR_OPTIONS[0],
    [avatarId],
  );

  const onLogout = () => {
    Alert.alert("Log out", "Sign out of U Mind on this device? Other devices stay signed in.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: () => {
          void (async () => {
            setLoggingOut(true);
            try {
              await logout();
            } finally {
              setLoggingOut(false);
            }
          })();
        },
      },
    ]);
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
          <Text style={styles.screenTitle}>Profile</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.hero}>
          <DiceBearAvatar styleKey={avatar.style} seed={avatar.seed} size={72} />
          <Text style={styles.alias}>{alias}</Text>
          <Text style={styles.heroHint}>Anonymous · recovery key keeps this account yours</Text>
        </View>

        {loading && !profile ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.lg }} />
        ) : (
          <View style={styles.card}>
            <Row label="Life stage" value={lifeStageForYouLabel(profile?.lifeStage ?? "") || "—"} />
            <Row
              label="Gender"
              value={
                profile?.gender === "WOMAN"
                  ? "Woman"
                  : profile?.gender === "MAN"
                    ? "Man"
                    : profile?.gender === "PREFER_NOT_TO_SAY"
                      ? "Prefer not to say"
                      : "—"
              }
            />
            <Row label="City" value={profile?.city?.trim() || "—"} />
            <Row
              label="Saathi language"
              value={profile?.saathiLanguage?.replace(/_/g, " ") || "—"}
            />
            <Row
              label="Check-in"
              value={profile?.saathiCheckIn ? checkInChipLabel(profile.saathiCheckIn) : "—"}
            />
            <Row
              label="Starting feelings"
              value={
                profile?.startingFeelings?.length
                  ? profile.startingFeelings.map(feelingChipLabel).join(", ")
                  : "—"
              }
            />
          </View>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Log out"
          onPress={onLogout}
          disabled={loggingOut}
          style={({ pressed }) => [
            styles.logoutBtn,
            pressed && styles.logoutPressed,
            loggingOut && styles.logoutDisabled,
          ]}
        >
          {loggingOut ? (
            <ActivityIndicator color={colors.coralInk} />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={20} color={colors.coralInk} />
              <Text style={styles.logoutLabel}>Log out</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: spacing.tabHorizontal,
    paddingBottom: 40,
    gap: spacing.lg,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.sm,
  },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  screenTitle: { ...typeScale.h1, fontSize: 24, lineHeight: 28 },
  hero: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing.md },
  alias: { fontFamily: fonts.serif, fontSize: 28, color: colors.ink },
  heroHint: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.inkMuted,
    textAlign: "center",
    paddingHorizontal: spacing.xxl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.sm,
  },
  row: {
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: 4,
  },
  rowLabel: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.inkMuted },
  rowValue: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.ink, lineHeight: 22 },
  logoutBtn: {
    height: 56,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.coralInk,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  logoutPressed: { backgroundColor: colors.coralTint },
  logoutDisabled: { opacity: 0.6 },
  logoutLabel: { fontFamily: fonts.sansBold, fontSize: 16, color: colors.coralInk },
});
