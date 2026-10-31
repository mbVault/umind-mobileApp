import RazorpayCheckout, { type RazorpayError, type RazorpaySuccess } from "react-native-razorpay";

export type RazorpayCheckoutClient = {
  keyId: string;
  orderId: string;
  amount: number | string;
  currency: string;
};

export class RazorpayCheckoutCancelledError extends Error {
  constructor(message = "Payment cancelled") {
    super(message);
    this.name = "RazorpayCheckoutCancelledError";
  }
}

export class RazorpayCheckoutFailedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RazorpayCheckoutFailedError";
  }
}

/** Open native Razorpay sheet. Success here is not booking confirmation — poll backend after. */
export async function openRazorpayCheckout(input: {
  checkout: RazorpayCheckoutClient;
  description?: string;
  prefillName?: string;
}): Promise<RazorpaySuccess> {
  const { checkout } = input;
  if (!checkout.keyId || !checkout.orderId) {
    throw new RazorpayCheckoutFailedError("Checkout payload missing Razorpay key or order id");
  }

  try {
    return await RazorpayCheckout.open({
      key: checkout.keyId,
      amount: String(checkout.amount),
      currency: checkout.currency || "INR",
      order_id: checkout.orderId,
      name: "U Mind",
      description: input.description ?? "Psychologist session",
      theme: { color: "#5B45E0" },
      ...(input.prefillName ? { prefill: { name: input.prefillName } } : {}),
    });
  } catch (err) {
    const e = err as RazorpayError | string;
    const description =
      typeof e === "string"
        ? e
        : e?.error?.description || e?.description || "Payment failed";
    const code = typeof e === "string" ? undefined : e?.code ?? e?.error?.code;
    const lowered = String(description).toLowerCase();
    if (
      code === 0 ||
      code === "0" ||
      code === 2 ||
      code === "2" ||
      lowered.includes("cancel") ||
      lowered.includes("back pressed")
    ) {
      throw new RazorpayCheckoutCancelledError(description);
    }
    throw new RazorpayCheckoutFailedError(description);
  }
}
