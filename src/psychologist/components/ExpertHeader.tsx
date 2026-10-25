import { Image, StyleSheet, Text, View } from "react-native";
import { fonts, psychColors, spacing } from "../theme";

export function ExpertHeader() {
  return (
    <View style={styles.row}>
      <Image
        source={require("../../../images/logo/UmindLogo.png")}
        style={styles.logo}
        resizeMode="contain"
        accessibilityLabel="U Mind logo"
      />
      <Text style={styles.brand}>U Mind</Text>
      <View style={styles.pill}>
        <Text style={styles.pillText}>for Experts</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  logo: { width: 36, height: 36 },
  brand: {
    fontFamily: fonts.serif,
    fontSize: 20,
    color: psychColors.ink,
  },
  pill: {
    backgroundColor: psychColors.expert,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillText: {
    fontFamily: fonts.sansExtraBold,
    fontSize: 12,
    color: psychColors.expertInk,
  },
});
