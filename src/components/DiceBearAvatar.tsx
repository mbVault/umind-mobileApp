import { useMemo } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { SvgXml } from "react-native-svg";
import type { AvatarStyleKey } from "../avatars/catalog";
import { createAvatarSvg } from "../avatars/dicebear";
import { colors } from "../theme";

type Props = {
  styleKey: AvatarStyleKey;
  seed: string;
  size?: number;
  selected?: boolean;
  onPress?: () => void;
  containerStyle?: ViewStyle;
};

export function DiceBearAvatar({ styleKey, seed, size = 56, selected, containerStyle }: Props) {
  const xml = useMemo(() => createAvatarSvg(styleKey, seed, size), [styleKey, seed, size]);

  return (
    <View
      style={[
        styles.wrap,
        { width: size, height: size, borderRadius: size / 2 },
        selected && styles.selected,
        containerStyle,
      ]}
    >
      <SvgXml xml={xml} width={size} height={size} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: "hidden",
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selected: {
    borderColor: colors.ink,
  },
});
