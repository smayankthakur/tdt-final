import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bookings admin',
  robots: { index: false, follow: false },
};

export default function BookingAdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
