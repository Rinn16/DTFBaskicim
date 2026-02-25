import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kullanım Şartları | DTF Baskıcım",
  description:
    "DTF Baskıcım web sitesi kullanım şartları, üyelik kuralları, sipariş koşulları ve sorumluluk reddi bilgileri.",
};

export default function KullanimSartlariPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
        Kullanım Şartları
      </h1>

      <p className="mb-12 text-sm text-muted-foreground">
        Son güncelleme tarihi: 26 Şubat 2026
      </p>

      {/* Genel Hükümler */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold">1. Genel Hükümler</h2>
        <p className="leading-relaxed text-muted-foreground">
          Bu web sitesini kullanarak bu şartları kabul etmiş olursunuz. DTF
          Baskıcım bu şartları önceden bildirimde bulunmaksızın değiştirme
          hakkını saklı tutar.
        </p>
      </section>

      {/* Hizmet Kapsamı */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold">2. Hizmet Kapsamı</h2>
        <p className="mb-3 leading-relaxed text-muted-foreground">
          DTF Baskıcım aşağıdaki hizmetleri sunmaktadır:
        </p>
        <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
          <li>DTF (Direct to Film) baskı hizmeti</li>
          <li>Kişiye özel tasarım basımı</li>
          <li>Online sipariş ve ödeme altyapısı</li>
        </ul>
      </section>

      {/* Üyelik Kuralları */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold">3. Üyelik Kuralları</h2>
        <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
          <li>Üyelik için 18 yaşından büyük olmak gerekir.</li>
          <li>Doğru ve güncel bilgi vermek zorunludur.</li>
          <li>Hesap güvenliği kullanıcının sorumluluğundadır.</li>
          <li>Şifre paylaşılmamalıdır.</li>
        </ul>
      </section>

      {/* Fikri Mülkiyet ve Tasarım Sorumluluğu */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold">
          4. Fikri Mülkiyet ve Tasarım Sorumluluğu
        </h2>
        <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
          <li>
            Yüklenen tasarımların telif hakkı sorumluluğu tamamen müşteriye
            aittir.
          </li>
          <li>
            Müşteri, yüklediği görsellerin telif haklarına sahip olduğunu veya
            kullanım izni aldığını beyan eder.
          </li>
          <li>
            DTF Baskıcım, telif hakkı ihlali içeren tasarımlardan dolayı
            sorumluluk kabul etmez.
          </li>
          <li>
            Telif hakkı ihlali tespit edilen siparişler iptal edilebilir.
          </li>
          <li>
            Site tasarımı, logosu ve içerikleri DTF Baskıcım&apos;a aittir.
          </li>
        </ul>
      </section>

      {/* Sipariş ve Ödeme */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold">5. Sipariş ve Ödeme</h2>
        <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
          <li>Siparişler onaylandıktan sonra üretime alınır.</li>
          <li>
            Ödeme kredi kartı veya banka havalesi ile yapılabilir.
          </li>
          <li>Fiyatlar KDV dahildir.</li>
        </ul>
      </section>

      {/* Sorumluluk Reddi */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold">6. Sorumluluk Reddi</h2>
        <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
          <li>
            Baskı renkleri ekranda görünenden farklılık gösterebilir (ekran
            kalibrasyonu, baskı tekniği farkları).
          </li>
          <li>
            Farklı monitörlerdeki renk farkları iade sebebi değildir.
          </li>
          <li>
            Site kesintileri veya teknik arızalar nedeniyle oluşabilecek
            zararlardan sorumluluk kabul edilmez.
          </li>
          <li>
            Mücbir sebepler nedeniyle teslimat gecikmeleri sorumluluk doğurmaz.
          </li>
        </ul>
      </section>

      {/* Yasaklanan Kullanımlar */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold">
          7. Yasaklanan Kullanımlar
        </h2>
        <p className="mb-3 leading-relaxed text-muted-foreground">
          Aşağıdaki kullanımlar kesinlikle yasaktır:
        </p>
        <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
          <li>Yasadışı, müstehcen veya hakaret içeren tasarımlar.</li>
          <li>Üçüncü kişilerin haklarını ihlal eden içerikler.</li>
          <li>Siteye zarar vermeye yönelik girişimler.</li>
        </ul>
      </section>

      {/* Uyuşmazlık Çözümü */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold">8. Uyuşmazlık Çözümü</h2>
        <p className="leading-relaxed text-muted-foreground">
          Bu kullanım şartları Türkiye Cumhuriyeti kanunlarına tabidir.
          Uyuşmazlık durumunda İstanbul Mahkemeleri ve İcra Daireleri
          yetkilidir.
        </p>
      </section>

      {/* İletişim */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold">9. İletişim</h2>
        <p className="leading-relaxed text-muted-foreground">
          Kullanım şartlarıyla ilgili sorularınız için bizimle iletişime
          geçebilirsiniz:
        </p>
        <p className="mt-2 text-muted-foreground">
          <a
            href="mailto:info@dtfbaskicim.com"
            className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
          >
            info@dtfbaskicim.com
          </a>
        </p>
      </section>
    </div>
  );
}
