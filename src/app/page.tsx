import type { Metadata } from "next";
import Link from "next/link";
import {
  ShoppingCart,
  FileUp,
  ArrowRight,
  ShieldCheck,
  Waypoints,
  Settings,
} from "lucide-react";
import { ProcessSection } from "@/components/home/process-section";
import { HomeAuthButtons } from "@/components/home/home-auth-buttons";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = {
  title: "DTF Baskıcım — Tech-Forward Factory",
  description:
    "Hassas mühendislik, dijital mükemmellik. Geleceğin baskı teknolojisi ile tasarımlarınızı endüstriyel standartta üretiyoruz.",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "DTF Baskıcım",
  url: "https://dtfbaskicim.com",
  description:
    "Endüstriyel kalitede DTF baskı hizmeti. Geleceğin baskı teknolojisi ile tasarımlarınızı endüstriyel standartta üretiyoruz.",
  logo: "https://dtfbaskicim.com/logo.png",
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    availableLanguage: "Turkish",
  },
};

/* ─── SVG Logo (shared between header & footer) ─── */
function LogoSvg({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M42.4379 44C42.4379 44 36.0744 33.9038 41.1692 24C46.8624 12.9336 42.2078 4 42.2078 4L7.01134 4C7.01134 4 11.6577 12.932 5.96912 23.9969C0.876273 33.9029 7.27094 44 7.27094 44L42.4379 44Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function HomePage() {
  return (
    <div className="bg-background text-foreground/80 font-display antialiased selection:bg-neon selection:text-black overflow-x-hidden min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ═══════════ Animated Background ═══════════ */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Neon blobs — dark only */}
        <div className="hidden dark:block">
          <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] animate-pulse-glow" />
          <div className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] bg-neon/5 rounded-full blur-[80px] animate-float" />
          <div className="absolute top-1/4 right-1/4 w-2 h-2 rounded-full bg-primary/40 animate-[float_4s_infinite]" />
          <div className="absolute top-1/3 left-1/3 w-3 h-3 rounded-full bg-neon/30 animate-[float_5s_infinite_1s]" />
          <div className="absolute bottom-1/3 right-10 w-4 h-4 rounded-full bg-foreground/10 animate-[float_7s_infinite_0.5s]" />
        </div>
        {/* Grid pattern — both modes */}
        <div className="absolute inset-0 bg-[linear-gradient(oklch(0_0_0/0.06)_1px,transparent_1px),linear-gradient(90deg,oklch(0_0_0/0.06)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]" />
      </div>

      {/* ═══════════ Side Navigation (Desktop) ═══════════ */}
      <nav className="fixed right-8 top-1/2 -translate-y-1/2 z-50 hidden lg:flex flex-col gap-6">
        <a
          className="group flex items-center gap-4 justify-end"
          href="#hero"
        >
          <span className="text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity text-primary dark:text-accent-brand">
            Başlangıç
          </span>
          <div className="w-3 h-3 rounded-full border border-muted-foreground group-hover:bg-primary group-hover:border-primary dark:group-hover:bg-neon dark:group-hover:border-neon transition-colors shadow-primary/20 dark:shadow-[0_0_10px_rgba(0,240,255,0.5)]" />
        </a>
        <a
          className="group flex items-center gap-4 justify-end"
          href="#process"
        >
          <span className="text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity text-primary dark:text-accent-brand">
            Süreç
          </span>
          <div className="w-3 h-3 rounded-full border border-muted-foreground group-hover:bg-primary group-hover:border-primary dark:group-hover:bg-neon dark:group-hover:border-neon transition-colors" />
        </a>
        <a
          className="group flex items-center gap-4 justify-end"
          href="#specs"
        >
          <span className="text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity text-primary dark:text-accent-brand">
            Teknoloji
          </span>
          <div className="w-3 h-3 rounded-full border border-muted-foreground group-hover:bg-primary group-hover:border-primary dark:group-hover:bg-neon dark:group-hover:border-neon transition-colors" />
        </a>
      </nav>

      {/* ═══════════ Header ═══════════ */}
      <header className="fixed top-0 left-0 right-0 z-40 px-6 py-6 transition-all duration-300">
        <div className="max-w-[1400px] mx-auto glass-panel rounded-2xl px-6 h-16 flex items-center justify-between shadow-2xl shadow-black/20">
          <Link href="/" className="flex items-center gap-3">
            <div className="size-8 text-primary dark:text-neon neon-glow">
              <LogoSvg className="w-full h-full" />
            </div>
            <h2 className="text-foreground text-lg font-bold tracking-tight">
              DTF<span className="text-primary">Baskıcım</span>
            </h2>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/tasarim"
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-muted text-sm font-medium transition-colors text-muted-foreground"
            >
              <FileUp className="h-[18px] w-[18px]" />
              Dosya Yükle
            </Link>
            <ThemeToggle />
            <Link
              href="/sepet"
              className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/80 transition-all shadow-primary/20 dark:shadow-[0_0_15px_rgba(19,127,236,0.4)]"
            >
              <ShoppingCart className="h-5 w-5" />
            </Link>
            <HomeAuthButtons />
          </div>
        </div>
      </header>

      {/* ═══════════ Main Content ═══════════ */}
      <main className="relative z-10 pt-32 pb-20">
        {/* ── Hero Section ── */}
        <section
          className="relative w-full min-h-[85vh] flex flex-col items-center justify-center px-4 overflow-hidden"
          id="hero"
        >
          {/* Video Background */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover opacity-60"
            >
              <source
                src="https://videos.pexels.com/video-files/3043685/3043685-uhd_2560_1440_24fps.mp4"
                type="video/mp4"
              />
            </video>
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
            <div className="absolute inset-0 bg-background/30 backdrop-blur-[2px]" />
          </div>

          <div className="relative z-10 w-full max-w-[1400px] mx-auto text-center flex flex-col items-center">
            <div className="relative mb-6 cursor-default select-none">
              {/* Giant "DTF" ghost text — layer 1 (blur) */}
              <div
                className="text-[12rem] md:text-[18rem] lg:text-[24rem] font-black leading-none tracking-tighter mix-blend-overlay opacity-30 blur-sm absolute top-0 left-1/2 -translate-x-1/2 select-none pointer-events-none"
                aria-hidden="true"
              >
                DTF
              </div>
              {/* Giant "DTF" ghost text — layer 2 (gradient) */}
              <div
                className="text-[12rem] md:text-[18rem] lg:text-[24rem] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white/10 to-transparent select-none pointer-events-none"
                aria-hidden="true"
              >
                DTF
              </div>

              {/* Hero content on top */}
              <div className="relative z-20 mt-12 md:mt-24 lg:mt-32">
                <span className="inline-block py-1 px-3 rounded border border-primary/30 dark:border-neon/30 bg-primary/10 dark:bg-neon/10 text-primary dark:text-accent-brand text-xs font-bold tracking-[0.2em] mb-4 uppercase backdrop-blur-md">
                  Next Gen Printing
                </span>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground tracking-tight mb-6">
                  The Tech-Forward
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-foreground via-muted-foreground to-muted-foreground/70">
                    Factory.
                  </span>
                </h1>
                <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-10 font-light">
                  Hassas mühendislik, dijital mükemmellik. Geleceğin baskı
                  teknolojisi ile tasarımlarınızı endüstriyel standartta
                  üretiyoruz.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-6">
                  <Link
                    href="/tasarim"
                    className="group relative px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full font-bold text-base overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-primary/20 dark:shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-neon via-primary to-neon opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl hidden dark:block" />
                    <span className="relative flex items-center gap-2">
                      Üretime Başla
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Link>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                      Sistem Aktif
                    </span>
                    <span className="w-px h-3 bg-border" />
                    <span>24/7 Operasyon</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Machine Status Card (desktop) */}
            <div className="absolute bottom-[-100px] right-4 md:right-10 w-64 glass-panel rounded-xl p-4 -rotate-[5deg] hover:rotate-0 transition-transform duration-500 hidden lg:block border-t border-border">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Makine Durumu
                </span>
                <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              </div>
              <div className="font-mono text-xs text-primary dark:text-accent-brand mb-1">
                RUNNING_JOB_#8291
              </div>
              <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary dark:bg-neon w-[78%] relative">
                  <div className="absolute right-0 top-0 bottom-0 w-2 bg-foreground blur-[2px]" />
                </div>
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-muted-foreground/70 font-mono">
                <span>WIDTH: 57cm</span>
                <span>DPI: 300</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Process Section (Client Component) ── */}
        <ProcessSection />

        {/* ── Specs / Technology Section ── */}
        <section className="py-24 relative z-10 px-6" id="specs">
          <div className="max-w-[1200px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              {/* Left Column — Tech Stats Panel */}
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-primary to-neon opacity-20 blur-2xl rounded-full hidden dark:block" />
                <div className="relative glass-panel rounded-2xl p-8 border border-border overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Settings className="h-32 w-32" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-6">
                    Teknik Üstünlük
                  </h3>

                  <div className="space-y-6">
                    {/* Stat bar: Renk Doğruluğu */}
                    <div className="group">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-muted-foreground text-sm">
                          Renk Doğruluğu (Delta E)
                        </span>
                        <span className="text-primary dark:text-accent-brand font-mono text-sm group-hover:text-foreground transition-colors">
                          &lt; 1.0
                        </span>
                      </div>
                      <div className="h-1 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary to-primary dark:to-neon w-[98%] group-hover:animate-pulse" />
                      </div>
                    </div>

                    {/* Stat bar: Baskı Çözünürlüğü */}
                    <div className="group">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-muted-foreground text-sm">
                          Baskı Çözünürlüğü
                        </span>
                        <span className="text-primary dark:text-accent-brand font-mono text-sm group-hover:text-foreground transition-colors">
                          2880 DPI
                        </span>
                      </div>
                      <div className="h-1 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary to-primary dark:to-neon w-[95%] group-hover:animate-pulse" />
                      </div>
                    </div>

                    {/* Stat bar: Yıkama Dayanımı */}
                    <div className="group">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-muted-foreground text-sm">
                          Yıkama Dayanımı
                        </span>
                        <span className="text-primary dark:text-accent-brand font-mono text-sm group-hover:text-foreground transition-colors">
                          60+ Yıkama
                        </span>
                      </div>
                      <div className="h-1 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary to-primary dark:to-neon w-full group-hover:animate-pulse" />
                      </div>
                    </div>
                  </div>

                  {/* Bottom stats */}
                  <div className="mt-8 pt-8 border-t border-border grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-3xl font-black text-foreground">24sa</div>
                      <div className="text-xs text-muted-foreground/70 uppercase">
                        Kargo Süresi
                      </div>
                    </div>
                    <div>
                      <div className="text-3xl font-black text-foreground">∞</div>
                      <div className="text-xs text-muted-foreground/70 uppercase">
                        Renk Limiti Yok
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column — Features */}
              <div className="flex flex-col gap-8">
                <div>
                  <span className="inline-block py-1 px-2 rounded bg-muted text-muted-foreground text-[10px] font-bold tracking-widest uppercase mb-4">
                    Özellikler
                  </span>
                  <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                    Maksimum Performans,
                    <br /> Minimum Efor.
                  </h2>
                  <p className="text-muted-foreground leading-relaxed text-lg">
                    Geleneksel baskı yöntemlerinin limitlerini kaldırıyoruz.
                    Karmaşık zemin temizleme, renk ayırma veya kalıp maliyeti
                    yok. Sadece tasarımınızı yükleyin ve gerisini teknolojimize
                    bırakın.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl hover:bg-muted transition-colors cursor-default border border-transparent hover:border-border">
                    <ShieldCheck className="h-8 w-8 text-primary mb-3" />
                    <h4 className="text-foreground font-bold mb-1">
                      Garantili Kalite
                    </h4>
                    <p className="text-sm text-muted-foreground/70">
                      Her metre baskı, optik sensörlerle anlık kontrol edilir.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl hover:bg-muted transition-colors cursor-default border border-transparent hover:border-border">
                    <Waypoints className="h-8 w-8 text-primary dark:text-neon mb-3" />
                    <h4 className="text-foreground font-bold mb-1">
                      API Entegrasyonu
                    </h4>
                    <p className="text-sm text-muted-foreground/70">
                      E-ticaret sitenizle direkt bağlantı kurun, siparişleri
                      otomatize edin.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ═══════════ Footer ═══════════ */}
      <Footer />
    </div>
  );
}
