import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { colors } from "../theme";
import { fonts } from "../theme/typography";
import { DiaryScreen } from "../screens/diary/DiaryScreen";
import { ExpertsScreen } from "../screens/home/ExpertsScreen";
import { ListenScreen } from "../screens/listen/ListenScreen";
import { SaathiScreen } from "../screens/saathi/SaathiScreen";
import { HomeStack } from "./HomeStack";
import type { MainTabParamList } from "./types";

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.inkMuted,
        tabBarLabelStyle: {
          fontFamily: fonts.sansBold,
          fontSize: 11,
          marginBottom: 4,
        },
        tabBarStyle: {
          height: 84,
          paddingTop: 8,
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
        },
        tabBarIcon: ({ color, size }) => {
          const map: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
            Home: "home-outline",
            Saathi: "chatbubble-ellipses-outline",
            Diary: "document-text-outline",
            Listen: "headset-outline",
            Experts: "person-outline",
          };
          return <Ionicons name={map[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Saathi" component={SaathiScreen} />
      <Tab.Screen name="Diary" component={DiaryScreen} />
      <Tab.Screen name="Listen" component={ListenScreen} />
      <Tab.Screen name="Experts" component={ExpertsScreen} />
    </Tab.Navigator>
  );
}
