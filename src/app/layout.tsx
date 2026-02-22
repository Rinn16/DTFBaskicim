import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SessionProvider } from "@/components/providers/session-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://dtfbaskicim.com"),
  title: {
    default: "DTF Baskıcım — Kusursuz Baskı, Metraj Özgürlüğü",
    template: "%s | DTF Baskıcım",
  },
  description:
    "Endüstriyel kalitede DTF baskı. Tasarımınızı yükleyin, rulo üzerine yerleştirin, metre bazında sipariş verin. 24 saatte kargo.",
  keywords: [
    "DTF baskı",
    "DTF transfer",
    "tekstil baskı",
    "tişört baskı",
    "dijital baskı",
    "DTF film",
    "DTF baski",
    "tisort baski",
    "tekstil baski",
    "DTF baskıcım",
    "kişiye özel baskı",
    "toptan DTF baskı",
    "metraj baskı",
    "rulo DTF",
    "24 saat kargo",
    "online DTF sipariş",
  ],
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: "DTF Baskıcım",
    title: "DTF Baskıcım — Kusursuz Baskı, Metraj Özgürlüğü",
    description:
      "Endüstriyel kalitede DTF baskı. Tasarımınızı yükleyin, metre bazında sipariş verin. 24 saatte kargo.",
  },
  twitter: {
    card: "summary_large_image",
    title: "DTF Baskıcım — Kusursuz Baskı, Metraj Özgürlüğü",
    description:
      "Endüstriyel kalitede DTF baskı. Tasarımınızı yükleyin, metre bazında sipariş verin. 24 saatte kargo.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={`${inter.variable} ${manrope.variable} font-sans antialiased`}>
        <ThemeProvider>
          <SessionProvider>
            <TooltipProvider>
              {children}
              <Toaster position="top-right" />
            </TooltipProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
