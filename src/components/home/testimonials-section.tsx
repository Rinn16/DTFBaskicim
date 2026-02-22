"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

const testimonials = [
  {
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAQqQSZtRcFeokMgTQQQnMx7Rl_nGGttkJFmRn91JIUedlHQifX52zJAk6IeotoKHs2bGVXwaj1A0pyjauT0am0wt-YaE6gqvzYJKRJ5Z0P0uaDXI0znAxiVCySk_SLrnwcCOy2L6Lp8YChKXMHIWfQ1gnqaB6KnyBw9eiwR4V-eNU0J77glKHe-XsiI6JOaTND0PQyg0H1JOrR2eWFCu2Rjpfwpbsg4_Aup-KgWZ_iYEC0UmJEK--MxDBgz_HqI61tWf_nVzSprwc",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAd7on-ppq3btnMSryTzZ_imoviN4LZ0JpIHdswbN5K88YQvKLGJm9sSB4vxSroL-hJ5fGOgxzItD64PZRRja-xBaYeSgDMZo75aazNfHczDqAqavrgpeWMZy0bdAW4q30SjUb_xHJIwMyjMBprBhwKNfIn2eNIlCc1tw2Je5nAd66zUsnjd7QoxcggYzTNWRDnVObHqnmdFpoZOUREAB1Nx4l94fWqEQr59Pfy305hXt5cPbajB8dKOiT65aDHc34gYV7wOoTm_QQ",
    name: "@burak_tasarim",
    comment: "Renk kalitesi inanılmaz, müşterilerim bayılıyor!",
  },
  {
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB8uv-MfXSd4UPRHALL0ZlDpxvrrbifzZcNSuD0sAzOcjBtwokOIOViH-W7QUmsd1VrooRF2fPLhwbNT6s6nehFX5TmefCvmk1dMdiCojQSq2kqraQr9dyfR2byuEnlvwAlVOEIhqWCu52k6CMn8gbGsZGIMsSEtiACnHnuOhqsaxCWIUunFxpDL6FMJjvZ-F15eqIyosQX3xXgAHT2CJp6duB1iHHRon9P6NpNmuq0CoJ-5ZAvyMJGwrXWsBnuyYc_9tf0xFi_wRE",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBL4OuLJViJCz4ByTWJ-ZsCt3UkR-2pFEQQ18bJWuMP_gco1S0akFIjHbapR5CQWF_O33XWYKB7Gwo4TOIlhvRza3AEsRbwHJ-Z995DtYoLhEWYFTPaCvhJ4mGdRO1gS5oD2wMqx23alSqkjWLQz31xWKkHVafPFj4QoyIFDJ82--AO92G7eAj2IgZUBkC2kTr8BGhDn76iVEmN2DMWtPfbppyz69xLZvGc508LafenwDaWE_eFSCjazcwbuM9fH_Mpg_adLvBdrFs",
    name: "@moda_atolyesi",
    comment: "Sipariş verdim, ertesi gün elime ulaştı. Süper hızlı!",
  },
  {
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAtUtj0T0c7RbIGTAIQEepnTJPA8TaS-LF--mKGTzBw1i2tGoPiOYsQUMRkte55HRcE1xmMgIop5xyDtw3tiCRiWRTPqsANVnXGqzusAzY4ayCKJ5jQPrHv9terEWhMMafuT-QekbaKMPCH544JQtQGfMFAezxSxbUXPLIdgERlWOnefHLnfaVV1F18IPwQVDZMYzLJtW4AgSYWhH48GQF9XiO9TntiFQVhIGQBn7rHB97abzvsjcWwWgWZcCOvM7RK_PXmmboB5Sk",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCY_sB__fvLTdoRFZO6geQDCCbHdWkKtNXnLQUxtM7E12YB0KNJyJCd_ZSyR818STVo7DA2oJ5s0LE89deKnyQ7-RuFW-kAlZM_3BTA4nClhxfmlPXClO4cENzOx_Z9uFeIgG09AL9J4Gp4lwy9Z0KWGmDx6pS1EVgxis6dP0Bg56karZ96kuctuot0T25DaOfp910ucXk3n8DkfWupjXdZrajWWhAl7Fi-Jnhotm2pKiCWA6J-Rg-IgtS72NGWruuxojitKuIexuo",
    name: "@print_master",
    comment: "Toplu siparişlerde fiyat avantajı gerçekten fark yaratıyor.",
  },
  {
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC_XqD-d4Vaf7tUJwcW38P8OFKbfiyID9aAa4kIfi7TdEhiBqQZedkYhplUHsWjHcUDVT7DX2D7G7ivjBTYyYPYGen0kYoRC4X4FWVJ2lIq2lE8w7Ay69rbMzTh-9RQD5BQuevVDqrSJoziQeA3HJJ0EPIN_09IENVYAMtD8mWWO6awVh4GrwdoGKRn8ArEW_OspROmhbfEyBzOeqJX7dOdm1sf-sZTQks62rfFUK0EOlhPrcdE8_7ihQNEEWRWkORld_TQ4gBJo9c",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCCjLaW9XgT3QBxQTLMP7rG4nPO-pLn0EYnbsr_4PELlRcV5ulUxqZSUblgRdHDpV8KNPDilX_mr3zCIzbUGjSkRVL6vKFpvKA3jxYw5zDaxGIDW5BxK14VlznoYMWMjGNBVYUkDUuuRbZ2A-SflteRGLgNO_Ur-R_8RAOEbR8cWIftiAaQy8TLHX0Q3VO6BveFlUnEMKIX_XcUOwCifJ_veKqG2vtHxkudZOL6WvX1HO2fM0QttEK29FnMIVHZBIBBpd42Zk2V90M",
    name: "@butik_zeynep",
    comment: "Kalite ve hız bir arada. Kesinlikle tavsiye ederim.",
  },
  {
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBJOLo7qnXUu7alxYDvkqiCohWfUF6Azspa4ZwOubBFdyLrmObCKgHWyAkkI5Qj1V5xloBmYIiqMzPZH8sdIfhjFDSPLdBceO1QMQ8i0VKAtMzyHnhjK53nlCFzEAaBKIrLlN8rcr1BwbXf38i87TvJpL6VRjj5Z-B82e5_IaBLV9CVrfP_DbQzbVwpsG2S_2C6cOcEws5MQ-vG7NzYsA_MH1ZMSfgBKXRpnzp5sKhuYxXI-R5cDCTJGNl5Js-Wrh4SSodnZuTjRBY",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDM66qcvbx0aHUm4OuP-y9Ke3RnOCfrni53RK4f5EDzsLx5OTxsbd371sCtW6xcPPHyaiFS3nsRW1UntzUEKZNEuloI7bJchbXd7v2p5Ox8kATBYSMgpgQZ9AhePD7cNiTMuvi3_K2lpumzHF-Hiz6R4aL3X_VnVr4iFN6XwVTX-YZYvC0y7eD6tMqSpfbb_TuXunw_rFtb7OjUlvX_QMmTb5k9_GWkaMqcdUmOdRq3TTVmI28MQlyafHRR8iW7SG50K-QZLGQvyjk",
    name: "@sport_wear_tr",
    comment: "Spor giyim markamız için mükemmel sonuçlar alıyoruz.",
  },
];

export function TestimonialsSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollButtons, { passive: true });
    updateScrollButtons();
    return () => el.removeEventListener("scroll", updateScrollButtons);
  }, [updateScrollButtons]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = 300;
    el.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <section className="py-20 px-4 md:px-6">
      <div className="mx-auto max-w-[1200px]">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Müşteri <span className="text-primary">Deneyimleri</span>
            </h2>
            <p className="mt-3 text-muted-foreground text-lg">
              Binlerce mutlu müşterimizin hikayelerinden bazıları.
            </p>
          </div>

          {/* Desktop scroll arrows */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Önceki"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Sonraki"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Carousel */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-4"
        >
          {testimonials.map((item) => (
            <div
              key={item.name}
              className="group/card snap-center shrink-0 w-[280px] h-[500px] relative rounded-2xl overflow-hidden cursor-pointer"
            >
              {/* Background Image */}
              <Image
                src={item.image}
                alt={`${item.name} müşteri deneyimi`}
                fill
                className="object-cover transition-transform duration-700 group-hover/card:scale-105"
                sizes="280px"
              />

              {/* Gradient Overlay */}
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

              {/* Play Button (hover) */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity duration-300">
                <div className="h-16 w-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                  <Play className="h-7 w-7 text-white ml-1" fill="white" />
                </div>
              </div>

              {/* User Info */}
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <div className="flex items-center gap-3 mb-2">
                  <Image
                    src={item.avatar}
                    alt={item.name}
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-full object-cover border border-white/20"
                  />
                  <span className="text-white text-sm font-semibold">
                    {item.name}
                  </span>
                </div>
                <p className="text-white/90 text-sm leading-relaxed">
                  {item.comment}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Instagram CTA */}
        <div className="mt-10 text-center">
          <a
            href="https://instagram.com/dtfbaskicim"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              variant="outline"
              size="lg"
              className="rounded-full font-bold px-8 h-12 gap-2"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
              Instagram&apos;da Bizi Takip Edin
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}
