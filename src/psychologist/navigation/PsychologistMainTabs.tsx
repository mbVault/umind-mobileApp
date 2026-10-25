import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { PsychologistClientsScreen } from "../screens/PsychologistClientsScreen";
import { PsychologistEarningsScreen } from "../screens/PsychologistEarningsScreen";
import { PsychologistHoursScreen } from "../screens/PsychologistHoursScreen";
import { PsychologistTodayScreen } from "../screens/PsychologistTodayScreen";
import { fonts, psychColors } from "../theme";
import { PsychologistMainTabParamList } from "./types";

const Tab = createBottomTabNavigator<PsychologistMainTabParamList>();

export function PsychologistMainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: psychColors.primary,
        tabBarInactiveTintColor: psychColors.inkMuted,
        tabBarLabelStyle: {
          fontFamily: fonts.sansBold,
          fontSize: 11,
          marginBottom: 4,
        },
        tabBarStyle: {
          height: 84,
          paddingTop: 8,
          borderTopColor: psychColors.border,
          backgroundColor: psychColors.surface,
        },
        tabBarIcon: ({ color, size }) => {
          const map: Record<keyof PsychologistMainTabParamList, keyof typeof Ionicons.glyphMap> = {
            Today: "home",
            Hours: "calendar-outline",
            Clients: "people-outline",
            Earnings: "cash-outline",
          };
          return <Ionicons name={map[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Today" component={PsychologistTodayScreen} />
      <Tab.Screen name="Hours" component={PsychologistHoursScreen} />
      <Tab.Screen name="Clients" component={PsychologistClientsScreen} />
      <Tab.Screen name="Earnings" component={PsychologistEarningsScreen} />
    </Tab.Navigator>
  );
}
