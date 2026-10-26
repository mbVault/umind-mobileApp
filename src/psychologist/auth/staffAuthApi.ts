import { staffApiDomain, STAFF_AUTH_BASE_PATH, STAFF_API_PREFIX } from "../config";
import { API_BASE_URL } from "../../config/env";
import { StaffApiError } from "../api/staffClient";

const authUrl = (path: string) => `${staffApiDomain()}${STAFF_AUTH_BASE_PATH}${path}`;

type Json = Record<string, unknown>;

async function postAuth(path: string, rid: string, body: Json): Promise<Json> {
  const response = await fetch(authUrl(path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      rid,
    },
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => ({}))) as Json & {
    status?: string;
    message?: string;
    reason?: string;
  };
  if (!response.ok) {
    throw new StaffApiError(response.status, payload.message ?? "Authentication request failed");
  }
  return payload;
}

export type StaffAuthMethods = {
  configured: boolean;
  methods: {
    emailPassword: boolean;
    emailOtp: boolean;
    phoneOtp: boolean;
    google: boolean;
    apple: boolean;
  };
};

export async function fetchStaffAuthMethods(): Promise<StaffAuthMethods> {
  const response = await fetch(`${API_BASE_URL}${STAFF_API_PREFIX}/auth/methods`);
  const payload = (await response.json().catch(() => ({}))) as {
    status?: string;
    data?: StaffAuthMethods;
    message?: string;
  };
  if (!response.ok || payload.status !== "success" || !payload.data) {
    throw new StaffApiError(response.status || 0, payload.message ?? "Could not load auth methods");
  }
  return payload.data;
}

export async function emailPasswordSignIn(email: string, password: string): Promise<void> {
  const payload = await postAuth("/signin", "emailpassword", {
    formFields: [
      { id: "email", value: email.trim().toLowerCase() },
      { id: "password", value: password },
    ],
  });
  if (payload.status !== "OK") {
    const stStatus = typeof payload.status === "string" ? payload.status : "UNKNOWN";
    if (stStatus === "WRONG_CREDENTIALS_ERROR") {
      throw new StaffApiError(401, "Invalid email or password");
    }
    throw new StaffApiError(
      401,
      `Sign-in failed (${stStatus}). Check API URL and that SuperTokens Core is up.`
    );
  }
}

export type OtpCreateResult = {
  deviceId: string;
  preAuthSessionId: string;
  flowType: string;
  email?: string;
  phoneNumber?: string;
};

export async function createPasswordlessCode(input: {
  email?: string;
  phoneNumber?: string;
}): Promise<OtpCreateResult> {
  const email = input.email?.trim().toLowerCase();
  const phoneNumber = input.phoneNumber?.trim();
  const body: Json = {};
  if (email) body.email = email;
  if (phoneNumber) body.phoneNumber = phoneNumber;

  const payload = await postAuth("/signinup/code", "passwordless", body);
  if (payload.status !== "OK") {
    throw new StaffApiError(400, (payload.message as string) ?? "Could not send code");
  }
  return {
    deviceId: String(payload.deviceId),
    preAuthSessionId: String(payload.preAuthSessionId),
    flowType: String(payload.flowType ?? "USER_INPUT_CODE"),
    email,
    phoneNumber,
  };
}

export async function consumePasswordlessCode(input: {
  deviceId: string;
  preAuthSessionId: string;
  userInputCode: string;
}): Promise<void> {
  const payload = await postAuth("/signinup/code/consume", "passwordless", {
    deviceId: input.deviceId,
    preAuthSessionId: input.preAuthSessionId,
    userInputCode: input.userInputCode.trim(),
  });
  if (payload.status === "OK") return;
  if (payload.status === "INCORRECT_USER_INPUT_CODE_ERROR") {
    throw new StaffApiError(401, "Incorrect code. Try again.");
  }
  if (payload.status === "EXPIRED_USER_INPUT_CODE_ERROR") {
    throw new StaffApiError(401, "Code expired. Request a new one.");
  }
  throw new StaffApiError(401, (payload.reason as string) ?? "Could not verify code");
}

export async function thirdPartySignInWithOAuthTokens(input: {
  thirdPartyId: "google" | "apple";
  oAuthTokens: { access_token?: string; id_token?: string };
}): Promise<void> {
  const payload = await postAuth("/signinup", "thirdparty", {
    thirdPartyId: input.thirdPartyId,
    oAuthTokens: input.oAuthTokens,
  });
  if (payload.status === "OK") return;
  if (payload.status === "NO_EMAIL_GIVEN_BY_PROVIDER") {
    throw new StaffApiError(400, "Provider did not return an email. Use another method.");
  }
  throw new StaffApiError(
    401,
    (payload.reason as string) ?? (payload.message as string) ?? "Social sign-in failed"
  );
}
