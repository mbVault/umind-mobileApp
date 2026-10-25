import { Ionicons } from "@expo/vector-icons";
import { Linking, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "../theme";
import { fonts } from "../theme/typography";

type Props = {
  visible: boolean;
  onClose: () => void;
  onBreathe?: () => void;
  onBookHuman?: () => void;
};

async function dial(number: string) {
  await Linking.openURL(`tel:${number}`);
}

export function SosSheet({ visible, onClose, onBreathe, onBookHuman }: Props) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Need help right now?</Text>
          <Text style={styles.sub}>You're not alone. Reach a free line, or take one calm breath with us.</Text>

          <Pressable style={styles.primaryDanger} onPress={() => void dial("14416")}>
            <Ionicons name="call" size={18} color={colors.surface} />
            <Text style={styles.primaryDangerText}>Call Tele-MANAS 14416</Text>
          </Pressable>

          <Pressable style={styles.outlineDanger} onPress={() => void dial("112")}>
            <Text style={styles.outlineDangerText}>Call emergency 112</Text>
          </Pressable>

          <Pressable
            style={styles.secondary}
            onPress={() => {
              onClose();
              onBreathe?.();
            }}
          >
            <Text style={styles.secondaryText}>Breathe with me now</Text>
          </Pressable>

          <Pressable
            style={styles.linkRow}
            onPress={() => {
              onClose();
              onBookHuman?.();
            }}
          >
            <Text style={styles.link}>Book the earliest psychologist</Text>
          </Pressable>

          <Pressable onPress={onClose} style={styles.close}>
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(31, 27, 58, 0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.flowHorizontal,
    paddingBottom: 36,
    gap: spacing.md,
  },
  title: { fontFamily: fonts.serif, fontSize: 22, color: "#8E3A22" },
  sub: { fontFamily: fonts.sans, fontSize: 14, color: colors.inkMuted, lineHeight: 20 },
  primaryDanger: {
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: "#8E3A22",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryDangerText: { fontFamily: fonts.sansBold, fontSize: 16, color: colors.surface },
  outlineDanger: {
    height: 52,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: "#8E3A22",
    alignItems: "center",
    justifyContent: "center",
  },
  outlineDangerText: { fontFamily: fonts.sansBold, fontSize: 16, color: "#8E3A22" },
  secondary: {
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.surface },
  linkRow: { alignItems: "center", paddingVertical: spacing.sm },
  link: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.primary },
  close: { alignItems: "center", paddingTop: spacing.sm },
  closeText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.inkMuted },
});
