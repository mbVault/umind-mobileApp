import { Pressable, StyleSheet, Text, View } from "react-native";
import { fonts, psychColors, spacing } from "../theme";

type Props = {
  label: string;
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
};

export function YearsStepper({ label, value, onChange, min = 0, max = 50 }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Decrease years"
          onPress={() => onChange(Math.max(min, value - 1))}
          style={styles.btn}
        >
          <Text style={styles.btnText}>−</Text>
        </Pressable>
        <Text style={styles.value}>{value}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Increase years"
          onPress={() => onChange(Math.min(max, value + 1))}
          style={styles.btn}
        >
          <Text style={styles.btnText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm, flex: 1 },
  label: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    color: psychColors.ink,
  },
  row: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: psychColors.border,
    backgroundColor: psychColors.surface,
    paddingHorizontal: spacing.sm,
  },
  btn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: psychColors.track,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    fontFamily: fonts.sansExtraBold,
    fontSize: 18,
    color: psychColors.primary,
  },
  value: {
    fontFamily: fonts.sansExtraBold,
    fontSize: 16,
    color: psychColors.ink,
  },
});
