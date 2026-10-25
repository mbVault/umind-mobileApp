import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import {
  fetchPsychologistMe,
  fetchStaffAvailability,
  patchPsychologistHours,
  putStaffAvailability,
  WeeklyHoursDto,
} from "../api/psychologistApi";
import { StaffApiError } from "../api/staffClient";
import { PsychPrimaryButton } from "../components/PsychPrimaryButton";
import { fonts, psychColors, radius, spacing } from "../theme";

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
type Mode = "CHAT" | "VOICE" | "VIDEO";

const DAY_META: { key: DayKey; label: string; jsDay: number }[] = [
  { key: "mon", label: "Mo", jsDay: 1 },
  { key: "tue", label: "Tu", jsDay: 2 },
  { key: "wed", label: "We", jsDay: 3 },
  { key: "thu", label: "Th", jsDay: 4 },
  { key: "fri", label: "Fr", jsDay: 5 },
  { key: "sat", label: "Sa", jsDay: 6 },
  { key: "sun", label: "Su", jsDay: 0 },
];

/** Matches Psycho-7 grid (40-min sessions). */
const SLOT_STARTS = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:30",
  "21:00",
] as const;

const MODE_OPTIONS: { code: Mode; label: string }[] = [
  { code: "CHAT", label: "Chat" },
  { code: "VOICE", label: "Voice" },
  { code: "VIDEO", label: "Video" },
];

const emptyWeek = (): Record<DayKey, Set<string>> => ({
  mon: new Set(),
  tue: new Set(),
  wed: new Set(),
  thu: new Set(),
  fri: new Set(),
  sat: new Set(),
  sun: new Set(),
});

const pad2 = (n: number) => String(n).padStart(2, "0");

const formatSlotLabel = (hhmm: string) => {
  const [hStr, mStr] = hhmm.split(":");
  let h = Number(hStr);
  const m = Number(mStr);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12}:00 ${suffix}` : `${h12}:${pad2(m)} ${suffix}`;
};

const addMinutesHhmm = (hhmm: string, minutes: number): string => {
  const [h, m] = hhmm.split(":").map(Number);
  const total = h! * 60 + m! + minutes;
  return `${pad2(Math.floor(total / 60) % 24)}:${pad2(total % 60)}`;
};

const dayKeyFromDate = (d: Date): DayKey => {
  const js = d.getDay();
  return DAY_META.find((x) => x.jsDay === js)!.key;
};

const localHhmm = (iso: string) => {
  const d = new Date(iso);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};

const weeklyHoursFromState = (week: Record<DayKey, Set<string>>): WeeklyHoursDto => {
  const out: WeeklyHoursDto = {};
  for (const day of DAY_META) {
    out[day.key] = [...week[day.key]]
      .sort()
      .map((start) => ({ start, end: addMinutesHhmm(start, 40) }));
  }
  return out;
};

const stateFromWeeklyHours = (wh: WeeklyHoursDto | null | undefined): Record<DayKey, Set<string>> => {
  const week = emptyWeek();
  if (!wh || typeof wh !== "object") return week;
  for (const day of DAY_META) {
    const windows = wh[day.key] ?? [];
    for (const w of windows) {
      if (typeof w?.start === "string" && SLOT_STARTS.includes(w.start as (typeof SLOT_STARTS)[number])) {
        week[day.key].add(w.start);
      } else if (typeof w?.start === "string") {
        // nearest known grid start
        week[day.key].add(w.start);
      }
    }
  }
  return week;
};

const materializeSlots = (
  week: Record<DayKey, Set<string>>,
  daysAhead: number
): { startsAt: string; endsAt: string }[] => {
  const out: { startsAt: string; endsAt: string }[] = [];
  const now = new Date();
  for (let i = 0; i < daysAhead; i += 1) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const key = dayKeyFromDate(day);
    for (const start of week[key]) {
      const [hh, mm] = start.split(":").map(Number);
      const startsAt = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hh!, mm!, 0, 0);
      if (startsAt.getTime() <= Date.now()) continue;
      const endsAt = new Date(startsAt.getTime() + 40 * 60 * 1000);
      out.push({ startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() });
    }
  }
  return out;
};

export function PsychologistHoursScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [accepting, setAccepting] = useState(true);
  const [maxPerDay, setMaxPerDay] = useState(6);
  const [modes, setModes] = useState<Mode[]>(["CHAT", "VOICE", "VIDEO"]);
  const [selectedDay, setSelectedDay] = useState<DayKey>("tue");
  const [week, setWeek] = useState<Record<DayKey, Set<string>>>(emptyWeek);

  const load = useCallback(async (mode: "boot" | "refresh" = "boot") => {
    if (mode === "boot") setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const from = new Date();
      const to = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000);
      const [me, avail] = await Promise.all([
        fetchPsychologistMe(),
        fetchStaffAvailability(from.toISOString(), to.toISOString()),
      ]);

      setAccepting(me.acceptingNewClients ?? avail.acceptingNewClients ?? true);
      setMaxPerDay(me.maxSessionsPerDay ?? avail.maxSessionsPerDay ?? 6);
      const nextModes = (me.sessionModes?.length ? me.sessionModes : avail.sessionModes) as Mode[];
      setModes(
        nextModes?.length
          ? (nextModes.filter((m) => ["CHAT", "VOICE", "VIDEO"].includes(m)) as Mode[])
          : ["CHAT", "VOICE", "VIDEO"]
      );

      let nextWeek = stateFromWeeklyHours(
        (me.weeklyHours as WeeklyHoursDto | null) ?? avail.weeklyHours
      );

      // If template empty, infer from concrete open slots in window.
      const anyTemplate = DAY_META.some((d) => nextWeek[d.key].size > 0);
      if (!anyTemplate) {
        nextWeek = emptyWeek();
        for (const item of avail.items) {
          if (item.status !== "OPEN") continue;
          const d = new Date(item.startsAt);
          nextWeek[dayKeyFromDate(d)].add(localHhmm(item.startsAt));
        }
      }
      setWeek(nextWeek);
    } catch (err) {
      setError(err instanceof StaffApiError ? err.message : "Could not load hours.");
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

  const openCount = week[selectedDay].size;
  const dayTitle = useMemo(() => {
    const names: Record<DayKey, string> = {
      mon: "Monday",
      tue: "Tuesday",
      wed: "Wednesday",
      thu: "Thursday",
      fri: "Friday",
      sat: "Saturday",
      sun: "Sunday",
    };
    return `${names[selectedDay]} slots`;
  }, [selectedDay]);

  const toggleSlot = (start: string) => {
    setWeek((prev) => {
      const next = { ...prev, [selectedDay]: new Set(prev[selectedDay]) };
      if (next[selectedDay].has(start)) next[selectedDay].delete(start);
      else next[selectedDay].add(start);
      return next;
    });
  };

  const toggleMode = (code: Mode) => {
    setModes((prev) => {
      if (prev.includes(code)) {
        if (prev.length === 1) return prev;
        return prev.filter((m) => m !== code);
      }
      return [...prev, code];
    });
  };

  const onSave = async () => {
    setError(null);
    if (modes.length === 0) {
      setError("Pick at least one session mode.");
      return;
    }
    setSaving(true);
    try {
      const weeklyHours = weeklyHoursFromState(week);
      await patchPsychologistHours({
        acceptingNewClients: accepting,
        maxSessionsPerDay: maxPerDay,
        sessionModes: modes,
        weeklyHours,
      });
      const replaceOpenSlots = materializeSlots(week, 21);
      const result = await putStaffAvailability(replaceOpenSlots);
      const protectedCount = result.protectedSlots?.length ?? 0;
      Alert.alert(
        "Hours saved",
        protectedCount > 0
          ? `Updated open slots. ${protectedCount} held/booked time(s) were kept so clients aren’t disrupted.`
          : `Open slots updated for the next 3 weeks (${result.createdCount ?? 0} created, ${result.deletedOpenCount ?? 0} closed).`
      );
      void load("refresh");
    } catch (err) {
      setError(err instanceof StaffApiError ? err.message : "Could not save hours.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
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
        <Text style={styles.title}>Your weekly hours</Text>
        <Text style={styles.sub}>Clients can only book the 40-minute slots you open here.</Text>

        <View style={styles.acceptCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.acceptTitle}>Accepting new clients</Text>
            <Text style={styles.acceptSub}>Existing clients can still book you when off.</Text>
          </View>
          <Switch
            value={accepting}
            onValueChange={setAccepting}
            trackColor={{ false: psychColors.border, true: psychColors.mint }}
            thumbColor="#FFFFFF"
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daysRow}>
          {DAY_META.map((day) => {
            const selected = day.key === selectedDay;
            const hasSlots = week[day.key].size > 0;
            return (
              <Pressable
                key={day.key}
                onPress={() => setSelectedDay(day.key)}
                style={[styles.dayChip, selected && styles.dayChipOn]}
              >
                <Text style={[styles.dayLabel, selected && styles.dayLabelOn]}>{day.label}</Text>
                <View
                  style={[
                    styles.dayDot,
                    hasSlots ? styles.dayDotGreen : styles.dayDotHidden,
                    selected && hasSlots && styles.dayDotSun,
                  ]}
                />
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.slotsCard}>
          <View style={styles.slotsHeader}>
            <Text style={styles.slotsTitle}>{dayTitle}</Text>
            <Text style={styles.slotsCount}>{openCount} open</Text>
          </View>
          <View style={styles.slotGrid}>
            {SLOT_STARTS.map((start) => {
              const open = week[selectedDay].has(start);
              return (
                <Pressable
                  key={start}
                  onPress={() => toggleSlot(start)}
                  style={[styles.slotBtn, open && styles.slotBtnOn]}
                >
                  <Text style={[styles.slotText, open && styles.slotTextOn]}>
                    {formatSlotLabel(start)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.slotsHint}>
            Tap a slot to open or close it. A 10-minute buffer is kept after every session.
          </Text>
        </View>

        <View style={styles.prefsRow}>
          <View style={[styles.prefCard, { flex: 1.3 }]}>
            <Text style={styles.prefLabel}>Session modes</Text>
            <View style={styles.modeRow}>
              {MODE_OPTIONS.map((m) => {
                const on = modes.includes(m.code);
                return (
                  <Pressable
                    key={m.code}
                    onPress={() => toggleMode(m.code)}
                    style={[styles.modeChip, on && styles.modeChipOn]}
                  >
                    <Text style={[styles.modeChipText, on && styles.modeChipTextOn]}>{m.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <View style={styles.prefCard}>
            <Text style={styles.prefLabel}>Max per day</Text>
            <View style={styles.stepper}>
              <Pressable
                style={styles.stepBtn}
                onPress={() => setMaxPerDay((v) => Math.max(1, v - 1))}
              >
                <Text style={styles.stepBtnText}>−</Text>
              </Pressable>
              <Text style={styles.stepValue}>{maxPerDay}</Text>
              <Pressable
                style={styles.stepBtn}
                onPress={() => setMaxPerDay((v) => Math.min(24, v + 1))}
              >
                <Text style={styles.stepBtnText}>+</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PsychPrimaryButton label="Save my hours" onPress={onSave} loading={saving} />
      </ScrollView>
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
  title: {
    fontFamily: fonts.serif,
    fontSize: 30,
    lineHeight: 36,
    color: psychColors.ink,
  },
  sub: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    color: psychColors.inkMuted,
    marginTop: -spacing.sm,
  },
  acceptCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: psychColors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: psychColors.border,
  },
  acceptTitle: { fontFamily: fonts.sansExtraBold, fontSize: 16, color: psychColors.ink },
  acceptSub: { fontFamily: fonts.sans, fontSize: 12, lineHeight: 17, color: psychColors.inkMuted, marginTop: 2 },
  daysRow: { gap: spacing.sm, paddingVertical: 2 },
  dayChip: {
    width: 48,
    height: 64,
    borderRadius: 18,
    backgroundColor: psychColors.surface,
    borderWidth: 1,
    borderColor: psychColors.border,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  dayChipOn: {
    backgroundColor: psychColors.primary,
    borderColor: psychColors.primary,
  },
  dayLabel: { fontFamily: fonts.sansExtraBold, fontSize: 14, color: psychColors.ink },
  dayLabelOn: { color: "#FFFFFF" },
  dayDot: { width: 6, height: 6, borderRadius: 3 },
  dayDotGreen: { backgroundColor: psychColors.mint },
  dayDotSun: { backgroundColor: psychColors.sun },
  dayDotHidden: { backgroundColor: "transparent" },
  slotsCard: {
    backgroundColor: psychColors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: psychColors.border,
    gap: spacing.md,
  },
  slotsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  slotsTitle: { fontFamily: fonts.sansExtraBold, fontSize: 16, color: psychColors.ink },
  slotsCount: { fontFamily: fonts.sansBold, fontSize: 13, color: psychColors.mintInk },
  slotGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  slotBtn: {
    width: "31.5%",
    minWidth: 96,
    flexGrow: 1,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: psychColors.border,
    backgroundColor: psychColors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  slotBtnOn: {
    backgroundColor: psychColors.mintTint,
    borderColor: psychColors.mintTint,
  },
  slotText: { fontFamily: fonts.sansBold, fontSize: 13, color: psychColors.ink },
  slotTextOn: { color: psychColors.mintInk },
  slotsHint: { fontFamily: fonts.sans, fontSize: 12, lineHeight: 17, color: psychColors.inkMuted },
  prefsRow: { flexDirection: "row", gap: spacing.sm },
  prefCard: {
    flex: 1,
    backgroundColor: psychColors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: psychColors.border,
    gap: spacing.md,
  },
  prefLabel: { fontFamily: fonts.sansBold, fontSize: 12, color: psychColors.inkMuted },
  modeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  modeChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: psychColors.border,
    backgroundColor: psychColors.surface,
  },
  modeChipOn: { backgroundColor: psychColors.primaryTint, borderColor: psychColors.primary },
  modeChipText: { fontFamily: fonts.sansBold, fontSize: 12, color: psychColors.inkMuted },
  modeChipTextOn: { color: psychColors.primary },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: psychColors.track,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBtnText: { fontFamily: fonts.sansExtraBold, fontSize: 18, color: psychColors.primary },
  stepValue: { fontFamily: fonts.sansExtraBold, fontSize: 18, color: psychColors.ink },
  error: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: psychColors.coralInk },
});
