import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect } from "react";
import { Image, StyleSheet, View } from "react-native";
import { AuthStackParamList } from "../navigation/types";
import { colors } from "../theme";

type Props = NativeStackScreenProps<AuthStackParamList, "Splash">;

const SPLASH_MS = 1000;

export function SplashScreen({ navigation }: Props) {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace("Pathway");
    }, SPLASH_MS);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Image source={require("../../images/logo/UmindLogo.png")} style={styles.logo} resizeMode="contain" accessibilityLabel="U Mind" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  logo: {
    width: 160,
    height: 160,
    backgroundColor: "transparent",
  },
});
