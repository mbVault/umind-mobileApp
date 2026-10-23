import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typeScale } from "../theme";

type Props = {
  title: string;
  tint: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
};

export function FeaturePromiseRow({ title, tint, icon, iconColor }: Props) {
  return (
    <View style={[styles.row, { backgroundColor: tint }]}>
      <View style={styles.iconTile}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <Text style={[typeScale.body, styles.title]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: radius.input,
    padding: spacing.lg,
  },
  iconTile: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { flex: 1 },
});
