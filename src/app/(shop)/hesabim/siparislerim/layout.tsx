import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Siparişlerim",
  description: "Tüm siparişlerinizi görüntüleyin ve takip edin.",
};

export default function SiparislerimLayout({ children }: { children: React.ReactNode }) {
  return children;
}
