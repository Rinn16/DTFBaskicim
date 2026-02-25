import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ödeme",
  description: "Siparişiniz için ödeme işlemini tamamlayın.",
};

export default function OdemeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
