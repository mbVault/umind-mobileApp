import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../theme";
import { fonts } from "../theme/typography";

type Props = {
  step: number;
  totalSteps?: number;
  onBack: () => void;
};

export function OnboardingStepHeader({ step, totalSteps = 4, onBack }: Props) {
  return (
    <View style={styles.row}>
      <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={onBack} style={styles.back}>
        <Ionicons name="chevron-back" size={22} color={colors.ink} />
      </Pressable>
      <View style={styles.track}>
        {Array.from({ length: totalSteps }, (_, i) => (
          <View key={i} style={[styles.segment, i < step && styles.segmentDone, i === step - 1 && styles.segmentActive]} />
        ))}
      </View>
      <Text style={styles.counter}>
        {step} of {totalSteps}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  track: {
    flex: 1,
    flexDirection: "row",
    gap: 6,
    height: 6,
  },
  segment: {
    flex: 1,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  segmentDone: {
    backgroundColor: colors.primary,
  },
  segmentActive: {
    backgroundColor: colors.primary,
  },
  counter: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    color: colors.inkMuted,
    minWidth: 44,
    textAlign: "right",
  },
});
