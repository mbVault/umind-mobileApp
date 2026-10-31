import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ClientProfileScreen } from "../screens/home/ClientProfileScreen";
import { HomeScreen } from "../screens/home/HomeScreen";
import { PaymentsScreen } from "../screens/home/PaymentsScreen";
import type { HomeStackParamList } from "./types";

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="Profile" component={ClientProfileScreen} />
      <Stack.Screen name="Payments" component={PaymentsScreen} />
    </Stack.Navigator>
  );
}
