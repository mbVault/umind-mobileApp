import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthStackParamList } from "../navigation/types";
import { colors, radius, spacing, typeScale } from "../theme";

type Props = NativeStackScreenProps<AuthStackParamList, "Pathway">;

type PathCardProps = {
  title: string;
  description: string;
  tint: string;
  accent: string;
  onPress: () => void;
};

function PathCard({ title, description, tint, accent, onPress }: PathCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, { backgroundColor: tint }, pressed && styles.cardPressed]}
    >
      <View style={[styles.cardIcon, { backgroundColor: accent }]}>
        <Text style={styles.cardIconText}>{title.charAt(0)}</Text>
      </View>
      <Text style={typeScale.h1}>{title}</Text>
      <Text style={[typeScale.bodyLarge, styles.cardDescription]}>{description}</Text>
    </Pressable>
  );
}

export function PathwayScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Text style={typeScale.display}>Who are you here as?</Text>
        <Text style={[typeScale.bodyLarge, styles.lead]}>
          Choose your path. You can always recover your account with your recovery key.
        </Text>

        <View style={styles.cards}>
          <PathCard
            title="Seeking support"
            description="Anonymous care, Saathi, and psychologists when you need a human."
            tint={colors.primaryTint}
            accent={colors.primary}
            onPress={() => navigation.navigate("Welcome")}
          />
          <PathCard
            title="Psychologist"
            description="Manage sessions, availability, and clients on the U Mind network."
            tint={colors.mintTint}
            accent={colors.mint}
            onPress={() => navigation.navigate("PsychologistEntry")}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1,
    paddingHorizontal: spacing.flowHorizontal,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  lead: { color: colors.inkMuted },
  cards: { gap: spacing.lg, marginTop: spacing.sm },
  card: {
    borderRadius: radius.card,
    padding: spacing.flowHorizontal,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardPressed: { opacity: 0.92 },
  cardDescription: { color: colors.inkMuted },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  cardIconText: {
    ...typeScale.button,
    color: "#FFFFFF",
    fontSize: 18,
  },
});
