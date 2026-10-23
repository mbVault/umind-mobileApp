import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { HomePlaceholderScreen } from "../screens/HomePlaceholderScreen";
import { AuthStack } from "./AuthStack";
import { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

type Props = {
  isAuthenticated: boolean;
};

export function RootNavigator({ isAuthenticated }: Props) {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Home" component={HomePlaceholderScreen} />
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
