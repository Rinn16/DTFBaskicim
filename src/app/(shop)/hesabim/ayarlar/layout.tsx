import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hesap Ayarları",
  description: "Kişisel bilgilerinizi ve hesap ayarlarınızı düzenleyin.",
};

export default function AyarlarLayout({ children }: { children: React.ReactNode }) {
  return children;
}
