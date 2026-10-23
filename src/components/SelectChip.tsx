import { Pressable, StyleSheet, Text } from "react-native";
import { colors, radius, spacing } from "../theme";
import { fonts } from "../theme/typography";

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function SelectChip({ label, selected, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.text, selected && styles.textSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.chip,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  text: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    color: colors.ink,
  },
  textSelected: {
    color: colors.surface,
  },
});
