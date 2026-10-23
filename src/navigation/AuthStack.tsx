import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { OnboardingDraftProvider } from "../onboarding/OnboardingDraftContext";
import { AliasScreen } from "../screens/AliasScreen";
import { LifeStageScreen } from "../screens/LifeStageScreen";
import { PathwayScreen } from "../screens/PathwayScreen";
import { PersonalizationScreen } from "../screens/PersonalizationScreen";
import { PlaceholderScreen } from "../screens/PlaceholderScreen";
import { RecoverScreen } from "../screens/RecoverScreen";
import { RecoveryKeyScreen } from "../screens/RecoveryKeyScreen";
import { SplashScreen } from "../screens/SplashScreen";
import { ThemeCityScreen } from "../screens/ThemeCityScreen";
import { TrialScreen } from "../screens/TrialScreen";
import { WelcomeScreen } from "../screens/WelcomeScreen";
import { AuthStackParamList } from "./types";

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack() {
  return (
    <OnboardingDraftProvider>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
        <Stack.Screen name="Splash" component={SplashScreen} options={{ animation: "fade" }} />
        <Stack.Screen name="Pathway" component={PathwayScreen} />
        <Stack.Screen
          name="PsychologistEntry"
          component={() => (
            <PlaceholderScreen title="Psychologist side" subtitle="Login and dashboard — coming soon" />
          )}
        />
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Alias" component={AliasScreen} />
        <Stack.Screen name="RecoveryKey" component={RecoveryKeyScreen} />
        <Stack.Screen name="LifeStage" component={LifeStageScreen} />
        <Stack.Screen name="Personalization" component={PersonalizationScreen} />
        <Stack.Screen name="ThemeCity" component={ThemeCityScreen} />
        <Stack.Screen name="Trial" component={TrialScreen} />
        <Stack.Screen name="Recover" component={RecoverScreen} />
      </Stack.Navigator>
    </OnboardingDraftProvider>
  );
}
