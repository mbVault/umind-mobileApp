import { apiRequest } from "./client";
import type { RazorpayCheckoutClient } from "../payments/razorpayCheckout";

export type SubscriptionPlan = {
  id: string;
  code: string;
  name: string;
  priceMinorUnits: number;
  currency: string;
  interval: string;
  durationDays: number;
};

export type SubscriptionMe = {
  subscription: {
    id: string;
    status: string;
    billingMode: string;
    planCode: string;
    planName: string;
    trialStartsAt: string | null;
    trialEndsAt: string | null;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    cancelledAt: string | null;
    cancelAtPeriodEnd: boolean;
  } | null;
  entitlements: {
    canAccessSaathi: boolean;
    canAccessAudio: boolean;
    canBookPsychologist: boolean;
  };
};

export type SubscriptionCheckoutResult = {
  order: {
    id: string;
    status: string;
    purpose: string;
    amountMinorUnits: number;
    currency: string;
    provider: string;
  };
  payment: { id: string; status: string };
  checkout: RazorpayCheckoutClient | Record<string, unknown>;
  provider: string;
  subscription: {
    id: string;
    status: string;
    planId: string;
    planCode: string;
  };
};

export function listSubscriptionPlans(): Promise<{ items: SubscriptionPlan[] }> {
  return apiRequest("/subscription-plans/");
}

export function getSubscriptionMe(accessToken: string): Promise<SubscriptionMe> {
  return apiRequest("/subscriptions/me", { accessToken });
}

export function startSubscriptionCheckout(
  accessToken: string,
  planId: string,
  idempotencyKey?: string,
): Promise<SubscriptionCheckoutResult> {
  return apiRequest("/subscriptions/checkout", {
    method: "POST",
    accessToken,
    body: { planId },
    headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
  });
}
