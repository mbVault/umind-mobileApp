import { getSubscriptionMe } from "../api/subscriptions";
import { getOrder } from "../api/orders";

export type SubscriptionPaymentWaitResult =
  | { outcome: "active"; status: string }
  | { outcome: "timeout"; status: string | null };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function waitForSubscriptionPayment(input: {
  accessToken: string;
  orderId?: string;
  timeoutMs?: number;
  intervalMs?: number;
}): Promise<SubscriptionPaymentWaitResult> {
  const timeoutMs = input.timeoutMs ?? 90_000;
  const intervalMs = input.intervalMs ?? 2_000;
  const started = Date.now();
  let lastStatus: string | null = null;

  while (Date.now() - started < timeoutMs) {
    const me = await getSubscriptionMe(input.accessToken);
    lastStatus = me.subscription?.status ?? null;

    if (input.orderId) {
      try {
        await getOrder(input.accessToken, input.orderId);
      } catch {
        // ignore while polling
      }
    }

    if (lastStatus === "ACTIVE") {
      return { outcome: "active", status: lastStatus };
    }

    await sleep(intervalMs);
  }

  return { outcome: "timeout", status: lastStatus };
}
