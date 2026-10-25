import { apiRequest } from "./client";

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
  checkout?: unknown;
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
): Promise<unknown> {
  return apiRequest(`/bookings/${bookingId}/checkout`, { method: "POST", accessToken });
}
