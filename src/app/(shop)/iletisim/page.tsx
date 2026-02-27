import type { Metadata } from "next";
import { Mail, Clock, MapPin, Instagram, Twitter, Linkedin } from "lucide-react";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = {
  title: "İletişim | DTF Baskıcım",
  description:
    "DTF Baskıcım ile iletişime geçin. Sorularınız, önerileriniz veya destek talepleriniz için bize ulaşın.",
};

export default function IletisimPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      {/* Header */}
      <h1 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
        İletişim
      </h1>
      <p className="mb-12 leading-relaxed text-muted-foreground">
        Sorularınız, önerileriniz veya destek talepleriniz için bizimle
        iletişime geçebilirsiniz.
      </p>

      {/* İletişim Bilgileri */}
      <div className="mb-16 grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* E-posta */}
        <div className="rounded-lg border border-border bg-muted/50 p-6">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <h3 className="mb-1 font-semibold">E-posta</h3>
          <a
            href="mailto:info@dtfbaskicim.com"
            className="text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            info@dtfbaskicim.com
          </a>
        </div>

        {/* Çalışma Saatleri */}
        <div className="rounded-lg border border-border bg-muted/50 p-6">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <h3 className="mb-1 font-semibold">Çalışma Saatleri</h3>
          <p className="text-sm text-muted-foreground">
            Pazartesi - Cumartesi
          </p>
          <p className="text-sm text-muted-foreground">09:00 - 18:00</p>
        </div>

        {/* Adres */}
        <div className="rounded-lg border border-border bg-muted/50 p-6">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <h3 className="mb-1 font-semibold">Adres</h3>
          <p className="text-sm text-muted-foreground">
            Güzelyalı Burgaz Mah. Kazım Karabekir Cad. No:13/C
            <br />
            Mudanya / Bursa
          </p>
        </div>
      </div>

      {/* Bize Ulaşın */}
      <section className="mb-16">
        <h2 className="mb-4 text-xl font-semibold">Bize Ulaşın</h2>
        <div className="rounded-lg border border-border bg-muted/50 p-6">
          <p className="leading-relaxed text-muted-foreground">
            Sipariş, iade veya teknik destek talepleriniz için{" "}
            <a
              href="mailto:info@dtfbaskicim.com"
              className="font-medium text-primary hover:underline"
            >
              info@dtfbaskicim.com
            </a>{" "}
            adresine e-posta gönderebilirsiniz. Siparişlerinizle ilgili
            sorularınızda sipariş numaranızı belirtmeyi unutmayın.
          </p>
        </div>
      </section>

      {/* Sosyal Medya */}
      <section className="mb-16">
        <h2 className="mb-4 text-xl font-semibold">Sosyal Medya</h2>
        <div className="flex gap-4">
          <a
            href="https://instagram.com/dtfbaskicim"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-muted/50 transition-colors hover:bg-muted"
          >
            <Instagram className="h-5 w-5 text-muted-foreground" />
          </a>
          <a
            href="https://twitter.com/dtfbaskicim"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-muted/50 transition-colors hover:bg-muted"
          >
            <Twitter className="h-5 w-5 text-muted-foreground" />
          </a>
          <a
            href="https://linkedin.com/company/dtfbaskicim"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-muted/50 transition-colors hover:bg-muted"
          >
            <Linkedin className="h-5 w-5 text-muted-foreground" />
          </a>
        </div>
      </section>

      {/* İletişim Formu */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">Mesaj Gönderin</h2>
        <ContactForm />
      </section>
    </div>
  );
}
