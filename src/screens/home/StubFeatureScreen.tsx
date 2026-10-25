import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing, typeScale } from "../../theme";

type Props = {
  title: string;
  body: string;
};

export function StubFeatureScreen({ title, body }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Text style={typeScale.h1}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.flowHorizontal, gap: spacing.md },
  body: { ...typeScale.bodyLarge, color: colors.inkMuted },
});
