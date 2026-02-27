"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Loader2,
  User,
  Truck,
  SearchCheck,
  Printer,
  PackageCheck,
  Timer,
} from "lucide-react";

interface OrderInfo {
  orderNumber: string;
  totalAmount: number;
  totalMeters: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
}

export default function OdemeBasariliPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0f16] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#137fec]" />
        </div>
      }
    >
      <OdemeBasariliContent />
    </Suspense>
  );
}

function OdemeBasariliContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const orderNumber = searchParams.get("oid");
  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1) Try sessionStorage first (works for both guest & member)
    try {
      const stored = sessionStorage.getItem("lastOrder");
      if (stored) {
        const parsed = JSON.parse(stored) as OrderInfo;
        // Match by orderNumber if we have oid, otherwise use whatever is stored
        if (!orderNumber || parsed.orderNumber === orderNumber) {
          setOrder(parsed);
          sessionStorage.removeItem("lastOrder");
          setIsLoading(false);
          return;
        }
      }
    } catch {
      // sessionStorage unavailable
    }

    // 2) Fallback: fetch from API (works for logged-in users)
    if (!orderNumber) {
      setIsLoading(false);
      return;
    }

    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/${orderNumber}`);
        if (res.ok) {
          const data = await res.json();
          setOrder({
            orderNumber: data.order.orderNumber,
            totalAmount: data.order.totalAmount,
            totalMeters: data.order.totalMeters,
            status: data.order.status,
            paymentMethod: data.order.paymentMethod,
            createdAt: data.order.createdAt,
          });
        }
      } catch {
        // Order may not be accessible for guests
      } finally {
        setIsLoading(false);
      }
    }
    fetchOrder();
  }, [orderNumber]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const time = date.toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return isToday ? `bugün, ${time}` : date.toLocaleDateString("tr-TR") + `, ${time}`;
  };

  const trackHref = session?.user?.id
    ? "/hesabim/siparislerim"
    : "/siparis-takip";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0f16] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#137fec]" />
      </div>
    );
  }

  return (
    <div className="bg-[#0a0f16] text-slate-100 font-[family-name:var(--font-display)] antialiased selection:bg-[#00f0ff] selection:text-black overflow-x-hidden min-h-screen flex flex-col">
      {/* Custom scrollbar styles + page-specific styles */}
      <style jsx global>{`
        .thank-page::-webkit-scrollbar {
          width: 8px;
        }
        .thank-page::-webkit-scrollbar-track {
          background: #0a0f16;
        }
        .thank-page::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 4px;
        }
        .thank-page::-webkit-scrollbar-thumb:hover {
          background: #137fec;
        }
        .neon-text {
          text-shadow: 0 0 10px rgba(0, 240, 255, 0.5);
        }
        .timeline-line {
          background: linear-gradient(to bottom, #137fec 0%, #334155 50%, #1e293b 100%);
        }
        .timeline-active-glow {
          box-shadow: 0 0 20px rgba(19, 127, 236, 0.6);
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(4px);
        }
      `}</style>

      {/* Video background */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-20"
        >
          <source
            src="https://videos.pexels.com/video-files/3936483/3936483-uhd_2560_1440_24fps.mp4"
            type="video/mp4"
          />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f16] via-[#0a0f16]/90 to-[#0a0f16]/80" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(19,127,236,0.05)_0%,rgba(0,0,0,0.8)_100%)]" />
      </div>

      {/* Glass header */}
      <header className="fixed top-0 left-0 right-0 z-40 px-6 py-6">
        <div className="max-w-[1400px] mx-auto glass-panel rounded-2xl px-6 h-16 flex items-center justify-between shadow-2xl shadow-black/20">
          <Link href="/" className="flex items-center gap-3">
            <div className="size-8 text-[#00f0ff] drop-shadow-[0_0_5px_rgba(19,127,236,0.5)]">
              <svg
                className="w-full h-full"
                fill="none"
                viewBox="0 0 48 48"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M42.4379 44C42.4379 44 36.0744 33.9038 41.1692 24C46.8624 12.9336 42.2078 4 42.2078 4L7.01134 4C7.01134 4 11.6577 12.932 5.96912 23.9969C0.876273 33.9029 7.27094 44 7.27094 44L42.4379 44Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <h2 className="text-white text-lg font-bold tracking-tight">
              DTF<span className="text-[#137fec]">Baskıcım</span>
            </h2>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href={session?.user?.id ? "/hesabim" : "/giris"}
              className="flex size-10 items-center justify-center rounded-full bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-all"
            >
              <User className="size-5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-grow flex items-center justify-center py-32 px-4 sm:px-6">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left column */}
          <div className="lg:col-span-7 space-y-8 animate-float">
            {/* Success badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-green-500/30 bg-green-500/10 text-green-400 text-xs font-bold tracking-widest uppercase mb-2 backdrop-blur-md">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Sipariş Başarıyla Oluşturuldu
            </div>

            {/* Heading */}
            <h1 className="text-5xl md:text-7xl font-black text-white leading-tight tracking-tight">
              Teşekkürler!
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#137fec] via-[#00f0ff] to-white neon-text">
                Baskı Sürecini Başlattık.
              </span>
            </h1>

            <p className="text-slate-400 text-lg max-w-xl leading-relaxed">
              Siparişiniz üretim hattına başarıyla iletildi. Dosyalarınız yapay
              zeka destekli ön kontrolden geçiyor.
            </p>

            {/* Order info card */}
            <div className="glass-panel p-6 sm:p-8 rounded-2xl border-l-4 border-l-[#137fec] relative overflow-hidden group">
              {/* Decorative background icon */}
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <Printer className="size-24" />
              </div>

              <div className="flex flex-col sm:flex-row gap-8 relative z-10">
                <div>
                  <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">
                    Sipariş No
                  </div>
                  <div className="text-2xl font-mono font-bold text-white">
                    {order ? `#${order.orderNumber}` : `#${orderNumber || "---"}`}
                  </div>
                </div>
                <div className="w-px bg-slate-700 hidden sm:block" />
                <div>
                  <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">
                    Metraj
                  </div>
                  <div className="text-2xl font-bold text-[#00f0ff]">
                    {order
                      ? `${order.totalMeters.toFixed(2)} m`
                      : "—"}
                  </div>
                </div>
                <div className="w-px bg-slate-700 hidden sm:block" />
                <div>
                  <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">
                    Tahmini Teslimat
                  </div>
                  <div className="text-2xl font-bold text-white">
                    2 İş Günü
                  </div>
                </div>
              </div>

              {/* Action button */}
              <div className="mt-6 pt-6 border-t border-slate-700/50">
                <Link
                  href={trackHref}
                  className="w-full bg-[#137fec] hover:bg-[#137fec]/90 text-white px-6 py-4 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(19,127,236,0.3)] hover:shadow-[0_0_30px_rgba(19,127,236,0.5)] flex items-center justify-center gap-2 group/btn"
                >
                  <Truck className="size-5 group-hover/btn:animate-bounce" />
                  Siparişi Takip Et
                </Link>
              </div>
            </div>
          </div>

          {/* Right column — Timeline */}
          <div className="lg:col-span-5 relative">
            <div className="glass-panel p-8 rounded-2xl relative overflow-hidden">
              {/* Decorative blur */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#137fec]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

              <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
                <Timer className="size-5 text-[#137fec]" />
                Operasyon Akışı
              </h3>

              <div className="relative pl-4">
                {/* Timeline line */}
                <div className="absolute left-[27px] top-4 bottom-4 w-[2px] timeline-line rounded-full" />

                <div className="space-y-10 relative">
                  {/* Step 1 — Active */}
                  <div className="flex gap-6 relative">
                    <div className="relative z-10 flex-shrink-0">
                      <div className="w-6 h-6 rounded-full bg-[#137fec] timeline-active-glow flex items-center justify-center border-2 border-[#0a0f16]">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      </div>
                    </div>
                    <div className="flex-grow pt-0.5">
                      <h4 className="text-lg font-bold text-[#00f0ff] neon-text">
                        Sipariş Alındı
                      </h4>
                      <p className="text-sm text-slate-300 mt-1">
                        Sipariş sisteme düştü, ödeme onaylandı.
                      </p>
                      <div className="mt-2 text-xs font-mono text-[#137fec]/80">
                        {order ? formatTime(order.createdAt) : "şimdi"}
                      </div>
                    </div>
                  </div>

                  {/* Step 2 — Pending */}
                  <TimelineStep
                    icon={<SearchCheck className="size-3.5 text-slate-400" />}
                    title="Dosya Kontrolü"
                    description="Yapay zeka görsel analizi yapılıyor."
                  />

                  {/* Step 3 — Pending */}
                  <TimelineStep
                    icon={<Printer className="size-3.5 text-slate-400" />}
                    title="Üretim"
                    description="DTF baskı ve kürleme işlemi."
                  />

                  {/* Step 4 — Pending */}
                  <TimelineStep
                    icon={<PackageCheck className="size-3.5 text-slate-400" />}
                    title="Paketleme"
                    description="Son kontroller ve kargolama."
                  />

                  {/* Step 5 — Pending */}
                  <TimelineStep
                    icon={<Truck className="size-3.5 text-slate-400" />}
                    title="Teslimat"
                    description="Kurye dağıtıma çıkacak."
                  />
                </div>
              </div>

              {/* System status */}
              <div className="mt-8 pt-6 border-t border-slate-700/50 flex items-center justify-between text-xs">
                <span className="text-slate-500 uppercase tracking-widest">
                  Sistem Durumu
                </span>
                <div className="flex items-center gap-2 text-green-400">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                  Canlı İşleniyor
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Custom footer */}
      <footer className="relative z-10 border-t border-white/10 bg-black/80 backdrop-blur-md py-8 px-6 mt-auto">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-600">
          <p>&copy; {new Date().getFullYear()} DTF Baskıcım. Tüm hakları saklıdır.</p>
          <div className="flex gap-6">
            <Link
              href="/yardim"
              className="hover:text-slate-400 transition-colors"
            >
              Yardım Merkezi
            </Link>
            <Link
              href="/iletisim"
              className="hover:text-slate-400 transition-colors"
            >
              İletişim
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function TimelineStep({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-6 relative group">
      <div className="relative z-10 flex-shrink-0">
        <div className="w-6 h-6 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center group-hover:border-slate-400 transition-colors">
          {icon}
        </div>
      </div>
      <div className="flex-grow pt-0.5 opacity-60 group-hover:opacity-80 transition-opacity">
        <h4 className="text-lg font-bold text-slate-300">{title}</h4>
        <p className="text-sm text-slate-500 mt-1">{description}</p>
      </div>
    </div>
  );
}
