import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";
import { PsychologistAuthProvider, usePsychologistAuth } from "../auth/PsychologistAuthContext";
import { PsychologistApplyScreen } from "../screens/PsychologistApplyScreen";
import { PsychologistBackgroundCheckScreen } from "../screens/PsychologistBackgroundCheckScreen";
import { PsychologistDocumentsPlaceholderScreen } from "../screens/PsychologistDocumentsPlaceholderScreen";
import { PsychologistLoginScreen } from "../screens/PsychologistLoginScreen";
import { PsychologistProfileScreen } from "../screens/PsychologistProfileScreen";
import { psychColors } from "../theme";
import { PsychologistMainTabs } from "./PsychologistMainTabs";
import { PsychologistStackParamList } from "./types";

const Stack = createNativeStackNavigator<PsychologistStackParamList>();

function PsychologistStack() {
  const { ready, isAuthenticated } = usePsychologistAuth();

  if (!ready) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: psychColors.background,
        }}
      >
        <ActivityIndicator color={psychColors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      {isAuthenticated ? (
        <>
          <Stack.Screen name="PsychologistApply" component={PsychologistApplyScreen} />
          <Stack.Screen name="PsychologistProfile" component={PsychologistProfileScreen} />
          <Stack.Screen
            name="PsychologistDocumentsPlaceholder"
            component={PsychologistDocumentsPlaceholderScreen}
          />
          <Stack.Screen
            name="PsychologistBackgroundCheck"
            component={PsychologistBackgroundCheckScreen}
          />
          <Stack.Screen name="PsychologistMain" component={PsychologistMainTabs} />
        </>
      ) : (
        <Stack.Screen name="PsychologistLogin" component={PsychologistLoginScreen} />
      )}
    </Stack.Navigator>
  );
}

export function PsychologistNavigator() {
  return (
    <PsychologistAuthProvider>
      <PsychologistStack />
    </PsychologistAuthProvider>
  );
}
