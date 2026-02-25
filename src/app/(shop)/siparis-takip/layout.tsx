import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sipariş Takip",
  description: "Sipariş numaranızla siparişinizin durumunu takip edin.",
};

export default function SiparisTakipLayout({ children }: { children: React.ReactNode }) {
  return children;
}
