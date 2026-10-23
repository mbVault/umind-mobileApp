import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FeaturePromiseRow } from "../components/FeaturePromiseRow";
import { PrimaryButton } from "../components/PrimaryButton";
import { AuthStackParamList } from "../navigation/types";
import { colors, spacing, typeScale } from "../theme";

type Props = NativeStackScreenProps<AuthStackParamList, "Welcome">;

const promises = [
  { title: "No phone, no email, no real name", tint: colors.primaryTint, icon: "eye-off-outline" as const, iconColor: colors.primary },
  { title: "An AI companion that listens, 24×7", tint: colors.mintTint, icon: "sparkles-outline" as const, iconColor: colors.mintInk },
  { title: "Real psychologists when you want a human", tint: colors.coralTint, icon: "person-outline" as const, iconColor: colors.coralInk },
];

export function WelcomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.logoRow}>
          <Image
            source={require("../../images/logo/UmindLogo.png")}
            style={styles.logoMark}
            resizeMode="contain"
            accessibilityLabel="U Mind logo"
          />
          <Text style={styles.logoText}>U Mind</Text>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroSun} />
          <View style={[styles.heroHill, styles.hillBack]} />
          <View style={[styles.heroHill, styles.hillMid]} />
          <View style={[styles.heroHill, styles.hillFront]} />
        </View>

        <Text style={typeScale.display}>A quiet place for your mind.</Text>
        <Text style={[typeScale.bodyLarge, styles.lead]}>
          Talk, listen, or reach a real psychologist — without ever telling anyone who you are.
        </Text>

        <View style={styles.promiseList}>
          {promises.map((item) => (
            <FeaturePromiseRow key={item.title} title={item.title} tint={item.tint} icon={item.icon} iconColor={item.iconColor} />
          ))}
        </View>

        <PrimaryButton label="Begin anonymously" onPress={() => navigation.navigate("Alias")} />
        <Text style={[typeScale.link, styles.recoveryLink]} onPress={() => navigation.navigate("Recover")}>
          I have a recovery key
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: spacing.flowHorizontal,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  logoRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  logoMark: { width: 40, height: 40, backgroundColor: "transparent" },
  logoText: { ...typeScale.h1, fontSize: 22 },
  hero: {
    height: 210,
    borderRadius: 28,
    backgroundColor: "#FFE3D8",
    overflow: "hidden",
    marginVertical: spacing.sm,
  },
  heroSun: {
    position: "absolute",
    top: 24,
    left: "36%",
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.sun,
  },
  heroHill: { position: "absolute", bottom: -20, width: "120%", height: 90, borderRadius: 60 },
  hillBack: { left: -20, backgroundColor: "#B6A8FF" },
  hillMid: { left: 40, backgroundColor: "#FF8A73", height: 80 },
  hillFront: { left: -10, backgroundColor: colors.primary, height: 70 },
  lead: { marginBottom: spacing.sm },
  promiseList: { gap: spacing.sm, marginVertical: spacing.sm },
  recoveryLink: { textAlign: "center", marginTop: spacing.md },
});
