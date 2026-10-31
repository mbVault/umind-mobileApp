declare module "react-native-razorpay" {
  export type RazorpaySuccess = {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  };

  export type RazorpayError = {
    code?: number | string;
    description?: string;
    error?: { code?: string; description?: string; reason?: string; step?: string; source?: string };
  };

  export type RazorpayOptions = {
    key: string;
    amount: string | number;
    currency: string;
    order_id: string;
    name?: string;
    description?: string;
    prefill?: { name?: string; email?: string; contact?: string };
    theme?: { color?: string };
    notes?: Record<string, string>;
  };

  const RazorpayCheckout: {
    open: (options: RazorpayOptions) => Promise<RazorpaySuccess>;
  };

  export default RazorpayCheckout;
}
