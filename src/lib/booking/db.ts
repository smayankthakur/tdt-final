import { createAdminClient } from "@/lib/supabase/server";
import { DEFAULT_CFG, type Cfg } from "./slots";

// Personal Reading data lives in Supabase (tables pr_orders, pr_bookings,
// pr_problems, pr_config — supabase/10_unified_platform.sql). All access is
// server-side with the service-role key; slot holds/claims and "mark paid"
// run as single Postgres functions so they are atomic.
export const sb = () => createAdminClient();
export const CFG_ID = "schedule2026";

export type Order = {
  bid: string; status: "created" | "paid"; tier: "standard" | "urgent"; amount: number;
  heldSlot: string | null; origin: string | null; plinkId: string | null; paymentId: string | null;
  email: string | null; phone: string | null; name: string | null; slot: string | null; meetLink: string | null;
  formDone: boolean; createdAt: number; paidAt: number | null; formAt: number | null;
};

export const toOrder = (r: any): Order | null =>
  r ? {
    bid: r.bid, status: r.status, tier: r.tier, amount: r.amount, heldSlot: r.held_slot, origin: r.origin,
    plinkId: r.plink_id, paymentId: r.payment_id, email: r.email, phone: r.phone, name: r.name, slot: r.slot,
    meetLink: r.meet_link, formDone: !!r.form_done, createdAt: Number(r.created_at_ms),
    paidAt: r.paid_at_ms == null ? null : Number(r.paid_at_ms), formAt: r.form_at_ms == null ? null : Number(r.form_at_ms),
  } : null;

export const toBooking = (r: any) => ({
  slot: r.slot_key, status: r.status, tier: r.tier, bid: r.bid,
  holdUntil: r.hold_until_ms == null ? null : Number(r.hold_until_ms),
  name: r.name, email: r.email, phone: r.phone, paymentId: r.payment_id, formDone: !!r.form_done,
  answers: r.answers || {}, meetLink: r.meet_link, eventId: r.event_id, calendarOk: r.calendar_ok,
  calendarErr: r.calendar_err, clientMailOk: r.client_mail_ok, ownerMailOk: r.owner_mail_ok, mailErr: r.mail_err,
  createdAt: Number(r.created_at_ms),
});

const must = <T,>(r: { data: T; error: any }): T => { if (r.error) throw r.error; return r.data; };

export async function getOrder(bid: string): Promise<Order | null> {
  return toOrder(must(await sb().from("pr_orders").select("*").eq("bid", bid).maybeSingle()));
}

export async function getCfg(): Promise<Cfg> {
  const row = must(await sb().from("pr_config").select("cfg").eq("id", CFG_ID).maybeSingle()) as { cfg: Cfg } | null;
  if (!row?.cfg || typeof row.cfg !== "object") return DEFAULT_CFG;
  const merged = { ...DEFAULT_CFG, ...row.cfg };
  // A damaged saved setting must never take the booking calendar down.
  const gridOk = (g: unknown) => !!g && typeof g === "object" && !Array.isArray(g);
  if (!gridOk(merged.days) || !gridOk(merged.urgentDays) || !Array.isArray(merged.blocked) || !(merged.step > 0)) {
    console.error("[booking] saved schedule settings are invalid — using defaults");
    return DEFAULT_CFG;
  }
  return merged;
}

export async function saveCfg(cfg: Cfg) {
  must(await sb().from("pr_config").upsert({ id: CFG_ID, cfg, updated_at: new Date().toISOString() }));
}

/** Bookings (held or confirmed) whose slot falls between two IST dates, inclusive. */
export async function bookingsBetween(firstDate: string, lastDate: string) {
  const rows = must(await sb().from("pr_bookings").select("slot_key,status,bid,hold_until_ms")
    .gte("slot_key", firstDate).lte("slot_key", lastDate + "~")) as any[];
  return rows.map((r) => ({ key: r.slot_key as string, status: r.status, bid: r.bid, holdUntil: r.hold_until_ms == null ? null : Number(r.hold_until_ms) }));
}

export async function updateBooking(slot: string, patch: Record<string, unknown>) {
  must(await sb().from("pr_bookings").update(patch).eq("slot_key", slot));
}
export async function updateOrder(bid: string, patch: Record<string, unknown>) {
  must(await sb().from("pr_orders").update(patch).eq("bid", bid));
}
export { must };
