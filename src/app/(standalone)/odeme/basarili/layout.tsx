import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ödeme Başarılı",
  description: "Siparişiniz başarıyla oluşturuldu.",
};

export default function BasariliLayout({ children }: { children: React.ReactNode }) {
  return children;
}
