import { Pressable, StyleSheet, Text, View } from "react-native";
import { fonts, psychColors, radius, spacing } from "../theme";

type Props = {
  step: number;
  total?: number;
  onBack?: () => void;
};

export function OnboardingProgress({ step, total = 4, onBack }: Props) {
  return (
    <View style={styles.row}>
      {onBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={onBack}
          style={styles.back}
          hitSlop={8}
        >
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
      ) : (
        <View style={styles.backSpacer} />
      )}
      <View style={styles.bars}>
        {Array.from({ length: total }, (_, i) => (
          <View key={i} style={[styles.bar, i < step ? styles.barFilled : styles.barEmpty]} />
        ))}
      </View>
      <Text style={styles.count}>
        {step} of {total}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: psychColors.surface,
    borderWidth: 1,
    borderColor: psychColors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  backSpacer: { width: 40 },
  backArrow: {
    fontFamily: fonts.sansBold,
    fontSize: 18,
    color: psychColors.ink,
    marginTop: -2,
  },
  bars: { flex: 1, flexDirection: "row", gap: 6 },
  bar: { flex: 1, height: 6, borderRadius: 999 },
  barFilled: { backgroundColor: psychColors.primary },
  barEmpty: { backgroundColor: psychColors.border },
  count: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: psychColors.inkMuted,
    minWidth: 48,
    textAlign: "right",
  },
});
