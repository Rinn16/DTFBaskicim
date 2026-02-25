import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ödeme Başarısız",
  description: "Ödeme işleminiz tamamlanamadı. Tekrar deneyebilirsiniz.",
};

export default function BasarisizLayout({ children }: { children: React.ReactNode }) {
  return children;
}
