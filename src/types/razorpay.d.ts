// Razorpay Checkout is loaded from https://checkout.razorpay.com/v1/checkout.js
// on the pages that take payments (reading, kundli report).
export {};

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay?: any;
  }
}
