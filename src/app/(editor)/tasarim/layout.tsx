import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tasarım Oluştur",
  description: "DTF baskı için tasarımlarınızı yükleyin ve rulo üzerine yerleştirin.",
};

export default function TasarimLayout({ children }: { children: React.ReactNode }) {
  return children;
}
