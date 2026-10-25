import "./src/polyfills";
import {
  Fraunces_400Regular,
  Fraunces_600SemiBold,
} from "@expo-google-fonts/fraunces";
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from "@expo-google-fonts/manrope";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, Image, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthSessionProvider, useAuthSession } from "./src/auth/AuthSessionContext";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { ProfileProvider } from "./src/profile/ProfileContext";
import { colors } from "./src/theme";

function AppRoot() {
  const { isAuthenticated, isBootstrapping } = useAuthSession();

  if (isBootstrapping) {
    return (
      <View style={styles.boot}>
        <Image
          source={require("./images/logo/UmindLogo.png")}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="U Mind"
        />
        <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
      </View>
    );
  }

  return (
    <ProfileProvider>
      <RootNavigator isAuthenticated={isAuthenticated} />
    </ProfileProvider>
  );
}

export default function App() {
  const [, fontError] = useFonts({
    Fraunces_400Regular,
    Fraunces_600SemiBold,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  useEffect(() => {
    if (fontError) {
      console.error("Font load failed:", fontError);
    }
  }, [fontError]);

  return (
    <SafeAreaProvider>
      <AuthSessionProvider>
        <StatusBar style="dark" />
        <AppRoot />
      </AuthSessionProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  logo: { width: 140, height: 140 },
});
