import crypto from 'crypto';
import Razorpay from 'razorpay';

// Used by the Kundli Milan report checkout. Env is read on each call (not at
// import), so tests and late-configured deployments behave correctly.

let instance: Razorpay | null = null;

function getRazorpayInstance(): Razorpay | null {
  if (instance) return instance;
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  try {
    instance = new Razorpay({ key_id: keyId, key_secret: keySecret });
    return instance;
  } catch {
    return null;
  }
}

export interface Order {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  created_at: number;
}

export function createOrder(amount: number, currency: string = 'INR', receiptId: string): Promise<Order> {
  const rz = getRazorpayInstance();
  if (!rz) throw new Error('Razorpay not configured');
  // Razorpay caps receipts at 40 characters.
  return rz.orders.create({ amount, currency, receipt: receiptId.slice(0, 40) }) as Promise<Order>;
}

function safeEqualHex(expected: string, given: string): boolean {
  if (!given || expected.length !== given.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(given));
}

export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
  return safeEqualHex(expected, String(signature || ''));
}

/**
 * Verify a Razorpay webhook (header `x-razorpay-signature`): HMAC-SHA256 of
 * the RAW body keyed by the webhook secret. Kundli reports use
 * KUNDLI_RAZORPAY_WEBHOOK_SECRET, falling back to RAZORPAY_WEBHOOK_SECRET.
 */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.KUNDLI_RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return safeEqualHex(expected, signature);
}
