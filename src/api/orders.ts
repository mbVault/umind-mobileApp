import { apiRequest } from "./client";

export type OrderDetail = {
  id: string;
  status: string;
  purpose: string;
  amountMinorUnits: number;
  currency: string;
  provider: string;
  providerOrderId: string | null;
  payments: {
    id: string;
    status: string;
    providerPaymentId: string | null;
    paidAt: string | null;
    failedAt: string | null;
  }[];
};

export function getOrder(accessToken: string, orderId: string): Promise<OrderDetail> {
  return apiRequest(`/orders/${orderId}`, { accessToken });
}
