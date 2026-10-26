import { Ionicons } from "@expo/vector-icons";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
  fetchPsychologistMe,
  fetchStaffMe,
  PsychologistProfileDto,
  StaffMe,
} from "../api/psychologistApi";
import { StaffApiError } from "../api/staffClient";
import { usePsychologistAuth } from "../auth/PsychologistAuthContext";
import { fonts, psychColors, radius, spacing } from "../theme";

const statusLabel = (status: string) => {
  switch (status) {
    case "LIVE":
      return "Live on U Mind";
    case "DRAFT":
      return "Draft";
    case "PENDING_REVIEW":
      return "Pending review";
    case "SUSPENDED":
      return "Suspended";
    default:
      return status.replace(/_/g, " ");
  }
};

const presenceLabel = (presence?: string) => {
  switch (presence) {
    case "ONLINE":
      return "Online";
    case "AWAY":
      return "Away";
    case "OFFLINE":
      return "Offline";
    default:
      return presence ?? "—";
  }
};

export function PsychologistMyProfileScreen() {
  const { staff, signOut } = usePsychologistAuth();
  const [profile, setProfile] = useState<PsychologistProfileDto | null>(null);
  const [account, setAccount] = useState<StaffMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [me, staffMe] = await Promise.all([fetchPsychologistMe(), fetchStaffMe()]);
      setProfile(me);
      setAccount(staffMe);
    } catch (err) {
      setError(err instanceof StaffApiError ? err.message : "Could not load profile.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load])
  );

  const onRefresh = () => {
    setRefreshing(true);
    void load();
  };

  const onLogout = () => {
    Alert.alert("Log out", "Sign out of your U Mind expert account on this device?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: () => {
          void (async () => {
            setLoggingOut(true);
            try {
              await signOut();
            } finally {
              setLoggingOut(false);
            }
          })();
        },
      },
    ]);
  };

  const displayName =
    profile?.displayName?.trim() ||
    profile?.legalFullName?.trim() ||
    account?.email ||
    staff?.email ||
    "Expert";
  const initials =
    profile?.avatarInitials?.trim() ||
    displayName
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") ||
    "?";
  const avatarBg = profile?.avatarColor?.trim() || psychColors.primary;

  if (loading && !profile) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <ActivityIndicator color={psychColors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={psychColors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>My profile</Text>
        <Text style={styles.lead}>Your account and practice details on U Mind.</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.heroCard}>
          <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.heroText}>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.email}>{account?.email ?? staff?.email ?? "—"}</Text>
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{statusLabel(profile?.publicationStatus ?? "")}</Text>
              </View>
              {profile?.presence ? (
                <View style={[styles.badge, styles.badgeMuted]}>
                  <View style={styles.dot} />
                  <Text style={styles.badgeTextMuted}>{presenceLabel(profile.presence)}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Practice</Text>
        <View style={styles.list}>
          <Row label="Legal name" value={profile?.legalFullName ?? "—"} />
          <Row label="RCI number" value={profile?.rciRegistrationNumber ?? "—"} />
          <Row label="Highest degree" value={profile?.highestDegree ?? "—"} />
          <Row
            label="Years practising"
            value={
              profile?.yearsPractising != null ? String(profile.yearsPractising) : "—"
            }
          />
          <Row
            label="Specialisations"
            value={
              profile?.specialisations?.length
                ? profile.specialisations.map((s) => s.replace(/_/g, " ")).join(", ")
                : "—"
            }
          />
          <Row
            label="Languages"
            value={
              profile?.languages?.length
                ? profile.languages.map((l) => l.replace(/_/g, " ")).join(", ")
                : "—"
            }
          />
        </View>

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
            <ActivityIndicator color={psychColors.coralInk} />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={20} color={psychColors.coralInk} />
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
  safe: { flex: 1, backgroundColor: psychColors.background },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: {
    paddingHorizontal: spacing.flowHorizontal,
    paddingTop: spacing.xl,
    paddingBottom: 40,
    gap: 8,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 32,
    lineHeight: 38,
    color: psychColors.ink,
  },
  lead: {
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 22,
    color: psychColors.inkMuted,
    marginBottom: 16,
  },
  error: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: psychColors.coralInk,
    marginBottom: 8,
  },
  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: psychColors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: psychColors.border,
    padding: 16,
    marginBottom: 20,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: fonts.sansExtraBold,
    fontSize: 22,
    color: "#FFFFFF",
  },
  heroText: { flex: 1, gap: 4 },
  name: {
    fontFamily: fonts.sansExtraBold,
    fontSize: 18,
    color: psychColors.ink,
  },
  email: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: psychColors.inkMuted,
  },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
  badge: {
    backgroundColor: psychColors.mintTint,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  badgeText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: psychColors.mintInk,
  },
  badgeMuted: {
    backgroundColor: psychColors.primaryTint,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  badgeTextMuted: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: psychColors.primary,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: psychColors.onlineDot,
  },
  sectionLabel: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: psychColors.inkMuted,
    marginBottom: 8,
  },
  list: {
    backgroundColor: psychColors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: psychColors.border,
    marginBottom: 28,
    overflow: "hidden",
  },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: psychColors.border,
    gap: 4,
  },
  rowLabel: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: psychColors.inkMuted,
  },
  rowValue: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: psychColors.ink,
  },
  logoutBtn: {
    height: 56,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: psychColors.coralInk,
    backgroundColor: psychColors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  logoutPressed: { backgroundColor: psychColors.coralTint },
  logoutDisabled: { opacity: 0.6 },
  logoutLabel: {
    fontFamily: fonts.sansExtraBold,
    fontSize: 16,
    color: psychColors.coralInk,
  },
});
