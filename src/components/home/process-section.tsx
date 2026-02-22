"use client";

import { useRef } from "react";
import { ArrowLeft, ArrowRight, Upload, Printer, Flame, Truck } from "lucide-react";

export function ProcessSection() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction === "left" ? -440 : 440,
      behavior: "smooth",
    });
  };

  return (
    <section
      className="py-24 border-t border-border relative bg-background overflow-hidden"
      id="process"
    >
      {/* Section Header */}
      <div className="max-w-[1400px] mx-auto px-6 mb-12 flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <span className="text-primary font-mono text-xs uppercase tracking-widest mb-2 block">
            Workflow v3.0
          </span>
          <h3 className="text-3xl md:text-5xl font-bold text-foreground">
            Design to Print<span className="text-primary dark:text-accent-brand">.</span>
          </h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => scroll("left")}
            className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
            aria-label="Önceki"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
            aria-label="Sonraki"
          >
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Horizontal Scroll Track */}
      <div
        ref={scrollRef}
        className="w-full overflow-x-auto pb-12 no-scrollbar pl-6 md:pl-[max(2rem,calc((100vw-1400px)/2))]"
      >
        <div className="flex gap-16 py-10" style={{ width: "max-content" }}>
          {/* Card 01 — Dosya Yükleme */}
          <div className="assembly-item w-[300px] md:w-[400px] shrink-0 group">
            <div className="relative aspect-[4/3] bg-gradient-to-br from-muted to-card rounded-2xl border border-border p-6 overflow-hidden">
              <div
                className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay transition-opacity group-hover:opacity-60"
                style={{
                  backgroundImage:
                    "url('https://images.unsplash.com/photo-1626785774573-4b7993143a2d?q=80&w=2070&auto=format&fit=crop')",
                }}
              />
              <div className="absolute top-4 right-4 text-6xl font-black text-foreground/5 group-hover:text-primary/20 transition-colors">
                01
              </div>
              <div className="relative z-10 h-full flex flex-col justify-end">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4 text-primary backdrop-blur-sm border border-primary/20">
                  <Upload className="h-5 w-5" />
                </div>
                <h4 className="text-2xl font-bold text-foreground mb-2">
                  Dosya Yükleme
                </h4>
                <p className="text-muted-foreground text-sm">
                  Yapay zeka destekli kontrol sistemi ile dosyanız saniyeler
                  içinde analize alınır.
                </p>
              </div>
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-500" />
            </div>
            {/* Connector line */}
            <div className="absolute top-1/2 -right-12 w-8 h-[2px] bg-muted hidden md:block">
              <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-transparent via-primary dark:via-neon to-transparent animate-pulse" />
            </div>
          </div>

          {/* Card 02 — Hassas Baskı */}
          <div className="assembly-item w-[300px] md:w-[400px] shrink-0 group">
            <div className="relative aspect-[4/3] bg-gradient-to-br from-muted to-card rounded-2xl border border-border p-6 overflow-hidden">
              <div className="absolute inset-0 bg-card">
                <div
                  className="w-full h-full opacity-20"
                  style={{
                    backgroundImage:
                      "radial-gradient(#444 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                  }}
                />
              </div>
              <div className="absolute top-4 right-4 text-6xl font-black text-foreground/5 group-hover:text-primary/20 dark:group-hover:text-neon/20 transition-colors">
                02
              </div>
              <div className="relative z-10 h-full flex flex-col justify-end">
                <div className="w-12 h-12 bg-primary/20 dark:bg-neon/20 rounded-lg flex items-center justify-center mb-4 text-primary dark:text-neon backdrop-blur-sm border border-primary/20 dark:border-neon/20">
                  <Printer className="h-5 w-5" />
                </div>
                <h4 className="text-2xl font-bold text-foreground mb-2">
                  Hassas Baskı
                </h4>
                <p className="text-muted-foreground text-sm">
                  Japon mikro-piezo baskı kafaları ile 1440dpi çözünürlükte
                  mürekkep püskürtme.
                </p>
              </div>
              {/* Floating element */}
              <div className="absolute top-10 right-10 w-24 h-32 bg-muted border border-primary/30 dark:border-neon/30 rounded transform rotate-6 translate-x-4 group-hover:translate-x-0 group-hover:rotate-12 transition-all duration-500 backdrop-blur-md">
                <div className="h-1 w-full bg-primary/50 dark:bg-neon/50 absolute top-2 animate-pulse" />
                <div className="p-2 space-y-2 mt-4">
                  <div className="h-1 w-2/3 bg-border rounded" />
                  <div className="h-1 w-1/2 bg-border rounded" />
                </div>
              </div>
            </div>
            <div className="absolute top-1/2 -right-12 w-8 h-[2px] bg-muted hidden md:block">
              <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-transparent via-primary dark:via-neon to-transparent animate-pulse [animation-delay:100ms]" />
            </div>
          </div>

          {/* Card 03 — Kürleme & Transfer */}
          <div className="assembly-item w-[300px] md:w-[400px] shrink-0 group">
            <div className="relative aspect-[4/3] bg-gradient-to-br from-muted to-card rounded-2xl border border-border p-6 overflow-hidden">
              <div
                className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay"
                style={{
                  backgroundImage:
                    "url('https://images.unsplash.com/photo-1565538420182-132d731aa268?q=80&w=2070&auto=format&fit=crop')",
                }}
              />
              <div className="absolute top-4 right-4 text-6xl font-black text-foreground/5 group-hover:text-purple-500/20 transition-colors">
                03
              </div>
              <div className="relative z-10 h-full flex flex-col justify-end">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4 text-purple-400 backdrop-blur-sm border border-purple-500/20">
                  <Flame className="h-5 w-5" />
                </div>
                <h4 className="text-2xl font-bold text-foreground mb-2">
                  Kürleme &amp; Transfer
                </h4>
                <p className="text-muted-foreground text-sm">
                  Otomatik tozlama ve fırınlama hattı ile mükemmel yapışma
                  dayanıklılığı.
                </p>
              </div>
              {/* Spinning dashed circle */}
              <div className="absolute bottom-20 right-10 w-20 h-20 rounded-full border-2 border-dashed border-purple-500/30 animate-[spin_10s_linear_infinite]" />
            </div>
            <div className="absolute top-1/2 -right-12 w-8 h-[2px] bg-muted hidden md:block">
              <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-transparent via-primary dark:via-neon to-transparent animate-pulse [animation-delay:200ms]" />
            </div>
          </div>

          {/* Card 04 — Hızlı Teslimat */}
          <div className="assembly-item w-[300px] md:w-[400px] shrink-0 group">
            <div className="relative aspect-[4/3] bg-gradient-to-br from-muted to-card rounded-2xl border border-border p-6 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-green-900/20 to-transparent" />
              <div className="absolute top-4 right-4 text-6xl font-black text-foreground/5 group-hover:text-green-500/20 transition-colors">
                04
              </div>
              <div className="relative z-10 h-full flex flex-col justify-end">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4 text-green-400 backdrop-blur-sm border border-green-500/20">
                  <Truck className="h-5 w-5" />
                </div>
                <h4 className="text-2xl font-bold text-foreground mb-2">
                  Hızlı Teslimat
                </h4>
                <p className="text-muted-foreground text-sm">
                  Paketlenen ürünleriniz aynı gün kargoya verilir ve yola
                  çıkar.
                </p>
              </div>
              {/* Floating box */}
              <div className="absolute top-10 right-10 w-20 h-20 bg-gradient-to-br from-muted to-card border border-border transform rotate-12 skew-y-6 shadow-2xl group-hover:scale-110 transition-transform">
                <div className="absolute -top-4 -right-4 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-[10px] text-black font-bold">
                  ✓
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
