import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { fetchPsychologistMe, PsychologistProfileDto } from "../api/psychologistApi";
import { PsychologistAuthProvider, usePsychologistAuth } from "../auth/PsychologistAuthContext";
import { PsychologistApplyScreen } from "../screens/PsychologistApplyScreen";
import { PsychologistBackgroundCheckScreen } from "../screens/PsychologistBackgroundCheckScreen";
import { PsychologistDocumentsPlaceholderScreen } from "../screens/PsychologistDocumentsPlaceholderScreen";
import { PsychologistLoginScreen } from "../screens/PsychologistLoginScreen";
import { PsychologistPendingReviewScreen } from "../screens/PsychologistPendingReviewScreen";
import { PsychologistProfileScreen } from "../screens/PsychologistProfileScreen";
import { psychColors } from "../theme";
import { PsychologistMainTabs } from "./PsychologistMainTabs";
import { PsychologistStackParamList } from "./types";

const Stack = createNativeStackNavigator<PsychologistStackParamList>();

type BootRoute = keyof PsychologistStackParamList;

function resolveBoot(profile: PsychologistProfileDto, isPsychologist: boolean): BootRoute {
  if (!isPsychologist) {
    if (
      profile.hrApprovalStatus === "PENDING_APPROVAL" &&
      profile.applicationSubmittedAt
    ) {
      return "PsychologistPendingReview";
    }
    if (profile.hrApprovalStatus === "REJECTED") {
      return "PsychologistPendingReview";
    }
  }

  if (isPsychologist && (profile.publicationStatus === "LIVE" || profile.onboardingStep === "COMPLETE")) {
    return "PsychologistMain";
  }

  switch (profile.onboardingStep) {
    case "PROFILE":
      return "PsychologistProfile";
    case "DOCUMENTS":
      return "PsychologistDocumentsPlaceholder";
    case "BACKGROUND_CHECK":
    case "HOURS":
      return isPsychologist ? "PsychologistBackgroundCheck" : "PsychologistPendingReview";
    case "APPLY":
    default:
      return "PsychologistApply";
  }
}

function PsychologistStack() {
  const { ready, isPsychologist, isApplicant, profile: cached } = usePsychologistAuth();
  const [bootRoute, setBootRoute] = useState<BootRoute | null>(null);
  const inSession = isPsychologist || isApplicant;

  useEffect(() => {
    if (!ready || !inSession) {
      setBootRoute(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const me = cached ?? (await fetchPsychologistMe());
        if (!cancelled) setBootRoute(resolveBoot(me, isPsychologist));
      } catch {
        if (!cancelled) setBootRoute(isPsychologist ? "PsychologistMain" : "PsychologistApply");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, inSession, isPsychologist, cached]);

  if (!ready || (inSession && !bootRoute)) {
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
    <Stack.Navigator
      key={inSession ? `${isPsychologist ? "p" : "a"}-${bootRoute}` : "login"}
      initialRouteName={inSession ? bootRoute! : "PsychologistLogin"}
      screenOptions={{ headerShown: false, animation: "slide_from_right" }}
    >
      {inSession ? (
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
          <Stack.Screen name="PsychologistPendingReview" component={PsychologistPendingReviewScreen} />
          {isPsychologist ? (
            <Stack.Screen name="PsychologistMain" component={PsychologistMainTabs} />
          ) : null}
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
