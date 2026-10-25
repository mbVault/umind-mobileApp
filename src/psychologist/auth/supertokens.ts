import "react-native-url-polyfill/auto";
import SuperTokens from "supertokens-react-native";
import { staffApiDomain, STAFF_AUTH_BASE_PATH } from "../config";

let initialized = false;

export function initPsychologistSuperTokens(): void {
  if (initialized) {
    return;
  }
  SuperTokens.init({
    apiDomain: staffApiDomain(),
    apiBasePath: STAFF_AUTH_BASE_PATH,
  });
  initialized = true;
}

export { SuperTokens };
