import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { fonts, psychColors, radius, spacing } from "../theme";

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
};

export function PsychPrimaryButton({ label, onPress, disabled, loading, style }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        pressed && !disabled && styles.pressed,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: psychColors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.flowHorizontal,
  },
  pressed: { backgroundColor: psychColors.primaryPressed },
  disabled: { backgroundColor: psychColors.disabledBg },
  label: {
    fontFamily: fonts.sansExtraBold,
    fontSize: 16,
    color: "#FFFFFF",
  },
});
