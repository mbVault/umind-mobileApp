import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";
import { fonts, psychColors, radius, spacing } from "../theme";

type Props = TextInputProps & {
  label: string;
  focusedBorder?: boolean;
};

export function PsychTextField({ label, focusedBorder, style, ...rest }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={psychColors.inkMuted}
        style={[styles.input, focusedBorder && styles.inputFocus, style]}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  label: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    color: psychColors.ink,
  },
  input: {
    height: 52,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: psychColors.border,
    backgroundColor: psychColors.surface,
    paddingHorizontal: spacing.lg,
    fontFamily: fonts.sansBold,
    fontSize: 16,
    color: psychColors.ink,
  },
  inputFocus: {
    borderWidth: 1.5,
    borderColor: psychColors.primary,
  },
});
