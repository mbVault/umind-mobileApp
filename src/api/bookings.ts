import { apiRequest } from "./client";
import type { RazorpayCheckoutClient } from "../payments/razorpayCheckout";

export type CommunicationMode = "CHAT" | "VOICE" | "VIDEO";

export type AvailabilitySlot = {
  id: string;
  startsAt: string;
  endsAt: string;
};

export type CreateBookingResult = {
  booking: {
    id: string;
    status: string;
    scheduledStartAt: string;
    scheduledEndAt: string;
    communicationMode: CommunicationMode;
    psychologistProfileId: string;
    requiresPayment: boolean;
  };
};

export type BookingCheckoutResult = {
  bookingId: string;
  order: {
    id: string;
    status: string;
    purpose: string;
    amountMinorUnits: number;
    currency: string;
    provider: string;
  };
  payment: {
    id: string;
    status: string;
  };
  checkout: RazorpayCheckoutClient | Record<string, unknown>;
  provider: "RAZORPAY" | "STRIPE" | string;
};

export type BookingDetail = {
  id: string;
  status: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  communicationMode: CommunicationMode;
  psychologistProfileId: string;
  session: { id: string; status: string } | null;
};

export function listPsychologistAvailability(
  accessToken: string,
  psychologistId: string,
  fromIso: string,
  toIso: string,
): Promise<{ items: AvailabilitySlot[] }> {
  const qs = new URLSearchParams({ from: fromIso, to: toIso });
  return apiRequest(`/psychologists/${psychologistId}/availability?${qs}`, { accessToken });
}

export function createBooking(
  accessToken: string,
  body: {
    psychologistProfileId: string;
    slotId: string;
    communicationMode: CommunicationMode;
  },
): Promise<CreateBookingResult> {
  return apiRequest("/bookings/", { method: "POST", accessToken, body });
}

export function startBookingCheckout(
  accessToken: string,
  bookingId: string,
  idempotencyKey?: string,
): Promise<BookingCheckoutResult> {
  return apiRequest(`/bookings/${bookingId}/checkout`, {
    method: "POST",
    accessToken,
    headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
  });
}

export function getBooking(accessToken: string, bookingId: string): Promise<BookingDetail> {
  return apiRequest(`/bookings/${bookingId}`, { accessToken });
}
