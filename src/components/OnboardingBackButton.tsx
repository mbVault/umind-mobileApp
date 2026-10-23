import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet } from "react-native";
import { colors, spacing } from "../theme";

type Props = { onPress: () => void; accessibilityLabel?: string; style?: object };

export function OnboardingBackButton({ onPress, accessibilityLabel = "Go back", style }: Props) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress} style={[styles.back, style]}>
      <Ionicons name="chevron-back" size={22} color={colors.ink} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  back: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
});
