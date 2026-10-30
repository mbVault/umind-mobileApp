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
  // Final / non-resubmittable / support-hold → status hub only (no clinic).
  if (
    profile.applicantNextAction === "NONE" ||
    profile.identityOnboardingBlocked ||
    profile.applicantNextAction === "CONTACT_SUPPORT"
  ) {
    return "PsychologistPendingReview";
  }

  if (profile.applicantNextAction === "RESUBMIT") {
    return "PsychologistPendingReview";
  }

  if (profile.applicantNextAction === "CLARIFY") {
    return isPsychologist ? "PsychologistBackgroundCheck" : "PsychologistPendingReview";
  }

  // Applicants: status hub once HR has the packet (or correctable rejection).
  if (!isPsychologist) {
    if (profile.hrApprovalStatus === "REJECTED") {
      return "PsychologistPendingReview";
    }
    if (profile.hrApprovalStatus === "PENDING_APPROVAL" && profile.applicationSubmittedAt) {
      return "PsychologistPendingReview";
    }
  }

  // Professional workspace only when publicly LIVE — not on HR approve or COMPLETE alone.
  if (isPsychologist && profile.publicationStatus === "LIVE") {
    return "PsychologistMain";
  }

  // Post-HR psychologist: docs → BGV → await publish. Never Main until LIVE (above).
  if (isPsychologist) {
    if (profile.applicantNextAction === "UPLOAD_DOC") {
      return "PsychologistDocumentsPlaceholder";
    }
    if (
      profile.publicationStatus === "VERIFIED_UNPUBLISHED" ||
      profile.publicationStatus === "PENDING_VERIFICATION" ||
      profile.publicationStatus === "NEEDS_ATTENTION"
    ) {
      // Still on DOCUMENTS step → finish uploads first (7A).
      if (profile.onboardingStep === "DOCUMENTS") {
        return "PsychologistDocumentsPlaceholder";
      }
      return "PsychologistBackgroundCheck";
    }
  }

  switch (profile.onboardingStep) {
    case "PROFILE":
      return "PsychologistProfile";
    case "DOCUMENTS":
      return isPsychologist ? "PsychologistDocumentsPlaceholder" : "PsychologistProfile";
    case "BACKGROUND_CHECK":
    case "HOURS":
    case "COMPLETE":
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
        if (!cancelled) {
          setBootRoute(isPsychologist ? "PsychologistBackgroundCheck" : "PsychologistApply");
        }
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
