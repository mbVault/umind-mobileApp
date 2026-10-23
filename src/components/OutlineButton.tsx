import { Pressable, StyleSheet, Text } from "react-native";
import { colors, radius, spacing } from "../theme";
import { fonts } from "../theme/typography";

type Props = { label: string; onPress: () => void };

export function OutlineButton({ label, onPress }: Props) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.button}>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: "center",
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  label: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: colors.primary,
  },
});
