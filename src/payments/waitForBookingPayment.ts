import { getBooking } from "../api/bookings";
import { getOrder } from "../api/orders";

export type BookingPaymentWaitResult =
  | { outcome: "confirmed"; bookingStatus: string; orderStatus: string | null }
  | { outcome: "expired"; bookingStatus: string; orderStatus: string | null }
  | { outcome: "timeout"; bookingStatus: string; orderStatus: string | null };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Webhook is source of truth. Poll booking (and order if known) until confirmed/expired or timeout.
 */
export async function waitForBookingPayment(input: {
  accessToken: string;
  bookingId: string;
  orderId?: string;
  timeoutMs?: number;
  intervalMs?: number;
}): Promise<BookingPaymentWaitResult> {
  const timeoutMs = input.timeoutMs ?? 90_000;
  const intervalMs = input.intervalMs ?? 2_000;
  const started = Date.now();

  let lastBookingStatus = "PENDING_PAYMENT";
  let lastOrderStatus: string | null = null;

  while (Date.now() - started < timeoutMs) {
    const booking = await getBooking(input.accessToken, input.bookingId);
    lastBookingStatus = booking.status;

    if (input.orderId) {
      try {
        const order = await getOrder(input.accessToken, input.orderId);
        lastOrderStatus = order.status;
      } catch {
        // ignore transient order fetch errors while polling
      }
    }

    if (booking.status === "CONFIRMED") {
      return { outcome: "confirmed", bookingStatus: booking.status, orderStatus: lastOrderStatus };
    }
    if (booking.status === "EXPIRED" || booking.status === "CANCELLED") {
      return { outcome: "expired", bookingStatus: booking.status, orderStatus: lastOrderStatus };
    }

    await sleep(intervalMs);
  }

  return { outcome: "timeout", bookingStatus: lastBookingStatus, orderStatus: lastOrderStatus };
}
