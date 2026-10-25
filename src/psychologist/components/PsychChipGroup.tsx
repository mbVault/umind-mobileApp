import { Pressable, StyleSheet, Text, View } from "react-native";
import { fonts, psychColors, spacing } from "../theme";

type Props = {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
};

export function PsychChipGroup({ label, options, selected, onChange }: Props) {
  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {options.map((opt) => {
          const active = selected.includes(opt.value);
          return (
            <Pressable
              key={opt.value}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => toggle(opt.value)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  label: {
    fontFamily: fonts.sansExtraBold,
    fontSize: 14,
    color: psychColors.ink,
  },
  row: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: psychColors.border,
    backgroundColor: psychColors.surface,
  },
  chipActive: {
    backgroundColor: psychColors.primary,
    borderColor: psychColors.primary,
  },
  chipText: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    color: psychColors.ink,
  },
  chipTextActive: { color: "#FFFFFF" },
});
