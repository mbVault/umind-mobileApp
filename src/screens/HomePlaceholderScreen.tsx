import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing, typeScale } from "../theme";

export function HomePlaceholderScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Text style={typeScale.h1}>Home</Text>
        <Text style={typeScale.bodyLarge}>
          Authenticated area placeholder. Mood, Saathi, and booking come in later phases.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.flowHorizontal, gap: spacing.md },
});
