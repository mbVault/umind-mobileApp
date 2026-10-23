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
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthSessionProvider, useAuthSession } from "./src/auth/AuthSessionContext";
import { RootNavigator } from "./src/navigation/RootNavigator";

function AppRoot() {
  const { isAuthenticated } = useAuthSession();
  return <RootNavigator isAuthenticated={isAuthenticated} />;
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
