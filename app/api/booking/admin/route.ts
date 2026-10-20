import { NextResponse } from "next/server";
import { getCfg, getOrder, must, saveCfg, sb, toBooking, updateBooking } from "@/lib/booking/db";
import { createMeet } from "@/lib/booking/calendar";
import { sendClientConfirmation } from "@/lib/booking/mailer";
import { originOf, resumeToken } from "@/lib/booking/session";
import { isAdmin } from "@/lib/adminAuth";
import type { Cfg } from "@/lib/booking/slots";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
const ENV = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REFRESH_TOKEN", "SMTP_HOST", "SMTP_USER", "SMTP_PASS", "OWNER_EMAIL"];
const unauthorized = () => NextResponse.json({ error: "unauthorized" }, { status: 401 });

export async function GET(req: Request) {
  if (!(await isAdmin(req))) return unauthorized();
  const rows = must(await sb().from("pr_bookings").select("*").eq("status", "confirmed").order("slot_key")) as any[];
  const bookings = rows.map((r) => {
    const b = toBooking(r);
    const [d, t] = String(b.slot).split("T");
    return { ...b, answers: { "Slot": `${d} ${t} IST`, ...(b.answers || {}) } };
  });
  const os = must(await sb().from("pr_orders").select("*").order("created_at_ms", { ascending: false }).limit(300)) as any[];
  const orders = os.map((r) => ({
    bid: r.bid, status: r.status, tier: r.tier, amount: r.amount, heldSlot: r.held_slot, paymentId: r.payment_id,
    email: r.email, phone: r.phone, name: r.name, slot: r.slot, meetLink: r.meet_link, formDone: r.form_done,
    createdAt: Number(r.created_at_ms), paidAt: r.paid_at_ms == null ? null : Number(r.paid_at_ms),
  }));
  return NextResponse.json({ cfg: await getCfg(), bookings, orders, missingEnv: ENV.filter((k) => !process.env[k]) });
}

const isHHMM = (s: unknown) => typeof s === "string" && /^\d{2}:\d{2}$/.test(s);
const isDate = (s: unknown) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
function validCfg(c: any): c is Cfg {
  if (!c || typeof c !== "object") return false;
  const nums = ["duration", "step", "minDays", "maxDays", "advanceDays", "urgentHours", "urgentLeadHours"].filter((k) => k in c);
  if (nums.some((k) => typeof c[k] !== "number" || c[k] < 0 || c[k] > 1000)) return false;
  for (const grid of ["days", "urgentDays"]) {
    const g = c[grid];
    if (!g || typeof g !== "object" || Array.isArray(g)) return false;
    for (const [k, d] of Object.entries(g) as [string, any][]) {
      if (!/^[0-6]$/.test(k) || typeof d?.on !== "boolean" || !isHHMM(d.start) || !isHHMM(d.end)) return false;
    }
  }
  if (typeof c.duration !== "number" || typeof c.step !== "number" || c.step < 15) return false;
  if (c.blocked && (!Array.isArray(c.blocked) || c.blocked.some((d: unknown) => !isDate(d)))) return false;
  for (const k of ["fromDate", "toDate"]) if (k in c && c[k] && !isDate(c[k])) return false;
  return JSON.stringify(c).length < 20000;
}

export async function PUT(req: Request) {
  if (!(await isAdmin(req))) return unauthorized();
  const cfg = await req.json().catch(() => null);
  if (!validCfg(cfg)) return NextResponse.json({ error: "Settings sahi format mein nahi hain." }, { status: 400 });
  await saveCfg(cfg);
  return NextResponse.json({ ok: true });
}

// Re-create the Meet link and re-send the customer email for one booking,
// or make a 24-hour form link for a paid customer who lost the payment page.
export async function POST(req: Request) {
  if (!(await isAdmin(req))) return unauthorized();
  const body = await req.json().catch(() => ({}));
  if (body.resume) {
    const o = await getOrder(String(body.resume));
    if (!o || o.status !== "paid" || o.formDone) return NextResponse.json({ error: "Yeh order paid + form-baaki nahi hai." }, { status: 400 });
    return NextResponse.json({ link: `${originOf(req)}/api/booking/resume?t=${resumeToken(o.bid)}` });
  }
  const slot = String(body.slot || "");
  const row = must(await sb().from("pr_bookings").select("*").eq("slot_key", slot).maybeSingle());
  if (!row) return NextResponse.json({ error: "booking nahi mili" }, { status: 404 });
  const b = toBooking(row), [date, time] = slot.split("T"), out: string[] = [];
  let meetLink: string | null = b.meetLink || null, calendarErr = "", mailErr = "";
  if (!meetLink) {
    try {
      const m = await createMeet(slot, { name: b.name || "", email: b.email || "", bid: b.bid, phone: b.phone || "", tier: b.tier });
      meetLink = m.meetLink || null;
      await updateBooking(slot, { meet_link: meetLink, event_id: m.eventId || null, calendar_ok: true, calendar_err: "" });
      await sb().from("pr_orders").update({ meet_link: meetLink }).eq("bid", b.bid);
      out.push("Meet link ban gaya ✓");
    } catch (e: any) {
      calendarErr = String(e?.message || e).slice(0, 300);
      await updateBooking(slot, { calendar_ok: false, calendar_err: calendarErr });
      out.push("Meet link ERROR: " + calendarErr);
    }
  }
  if (meetLink || !calendarErr) {
    try {
      await sendClientConfirmation({ name: b.name || "", email: b.email || "", bid: b.bid, date, time, meetLink });
      await updateBooking(slot, { client_mail_ok: true, mail_err: "" });
      out.push("Customer ko email bhej di ✓");
    } catch (e: any) {
      mailErr = String(e?.message || e).slice(0, 300);
      await updateBooking(slot, { client_mail_ok: false, mail_err: mailErr });
      out.push("Email ERROR: " + mailErr);
    }
  }
  return NextResponse.json({ result: out.join(" · "), meetLink });
}
