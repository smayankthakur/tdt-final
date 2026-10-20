import { sb, must } from "./db";
import { sendPaymentReceived } from "./mailer";

const keyId = () => process.env.BOOKING_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
const keySecret = () => process.env.BOOKING_RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET;
export const razorpayAuth = () => "Basic " + Buffer.from(`${keyId()}:${keySecret()}`).toString("base64");
const rz = async (path: string) =>
  (await fetch(`https://api.razorpay.com/v1/${path}`, { signal: AbortSignal.timeout(20000), headers: { Authorization: razorpayAuth() }, cache: "no-store" })).json();

/** Marks an order paid exactly once (webhook and the return-page check can both call this). */
export async function markPaid(bid: string, plinkId: string, paymentId: string | null, email: string, phone: string) {
  const tier = must(await sb().rpc("pr_mark_paid", {
    p_bid: bid, p_plink_id: plinkId, p_payment_id: paymentId, p_email: email, p_phone: phone, p_now: Date.now(),
  })) as string | null;
  if (tier && email) {
    await sendPaymentReceived({ email, bid, tier: tier as "standard" | "urgent" }).catch((e) => console.error("payment-received mail failed", e));
  }
}

/** Asks Razorpay directly whether this order's payment link is paid — works even if the webhook never arrives. */
export async function verifyWithRazorpay(bid: string, plinkId: string) {
  const pl = await rz(`payment_links/${plinkId}`);
  if (pl?.status !== "paid" || String(pl?.reference_id || "") !== bid) return false;
  const pid: string | null = pl.payments?.[0]?.payment_id || null;
  const p = pid ? await rz(`payments/${pid}`) : null;
  await markPaid(bid, plinkId, pid, p?.email || pl.customer?.email || "", p?.contact || pl.customer?.contact || "");
  return true;
}
