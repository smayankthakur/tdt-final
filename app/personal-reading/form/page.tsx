import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { COOKIE } from "@/lib/booking/session";
import ReadingForm from "@/components/booking/ReadingForm";
export const metadata = { title: "Personal Reading Form", robots: { index: false, follow: false } };

export default async function FormPage(
  props: { searchParams: Promise<Record<string, string | string[] | undefined>> }
) {
  const searchParams = await props.searchParams;
  // Payment links created before this update still return to /form?bid=…&razorpay_…: verify them the new way.
  // A bare ?bid= on its own opens nothing — the form only opens from the signed cookie set after payment.
  if (searchParams.razorpay_signature) {
    const q = new URLSearchParams(Object.entries(searchParams).flatMap(([k, v]) => (typeof v === "string" ? [[k, v]] : [])));
    redirect(`/api/booking/pay-return?${q}`);
  }
  // No booking cookie = no payment on this device: show "pay first" straight
  // away instead of a loading card.
  const hasBooking = !!(await cookies()).get(COOKIE)?.value;
  return (
    <div className="form-page">
      <div className="container form-wrap">
        <ReadingForm hasBooking={hasBooking} />
      </div>
    </div>
  );
}
