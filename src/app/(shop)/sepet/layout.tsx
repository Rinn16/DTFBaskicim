import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sepetim",
};

export default function SepetLayout({ children }: { children: React.ReactNode }) {
  return children;
}
