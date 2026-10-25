import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { fonts, psychColors, spacing, typeScale } from "../theme";

type Props = {
  title: string;
  body: string;
};

/** Honest tab placeholder — not a half-built screen. */
export function PsychologistComingSoonScreen({ title, body }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Text style={typeScale.h1}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
        <Text style={styles.note}>Building one complete screen at a time.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: psychColors.background },
  content: {
    flex: 1,
    padding: spacing.flowHorizontal,
    paddingTop: spacing.xxl,
    gap: spacing.lg,
  },
  body: {
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 22,
    color: psychColors.inkMuted,
  },
  note: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: psychColors.primary,
  },
});
