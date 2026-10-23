import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing, typeScale } from "../theme";

type Props = {
  title: string;
  subtitle?: string;
};

export function PlaceholderScreen({ title, subtitle }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Text style={typeScale.h1}>{title}</Text>
        {subtitle ? <Text style={typeScale.bodyLarge}>{subtitle}</Text> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.flowHorizontal, gap: spacing.md },
});
