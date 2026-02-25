import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "İptal ve İade Politikası | DTF Baskıcım",
  description:
    "DTF Baskıcım iptal ve iade politikası. Kişiye özel üretilen ürünlerde cayma hakkı, kargo hasarı, üretim hatası ve iade süreci hakkında bilgi.",
};

export default function IptalVeIadePolitikasiPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
        İptal ve İade Politikası
      </h1>

      <p className="mb-12 text-sm text-muted-foreground">
        Son güncelleme tarihi: 26 Şubat 2026
      </p>

      {/* Önemli Bilgilendirme */}
      <section className="mb-10 rounded-lg border border-amber-300 bg-amber-50 p-6 dark:border-amber-700 dark:bg-amber-950/30">
        <h2 className="mb-3 text-xl font-semibold text-amber-900 dark:text-amber-200">
          Önemli Bilgilendirme
        </h2>
        <p className="mb-3 leading-relaxed text-amber-800 dark:text-amber-300">
          DTF Baskıcım&apos;da satışa sunulan tüm ürünler, müşterinin yüklediği
          tasarıma göre <strong>KİŞİYE ÖZEL</strong> olarak üretilmektedir.
        </p>
        <p className="leading-relaxed text-amber-800 dark:text-amber-300">
          6502 Sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli
          Sözleşmeler Yönetmeliği&apos;nin 15. maddesi (ç) bendi gereğince,{" "}
          <strong>
            tüketicinin istekleri veya kişisel ihtiyaçları doğrultusunda
            hazırlanan mallarda cayma hakkı kullanılamaz.
          </strong>
        </p>
      </section>

      {/* Sipariş İptali */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold">1. Sipariş İptali</h2>
        <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
          <li>
            Üretime başlanmamış siparişler iptal edilebilir.
          </li>
          <li>
            İptal talebi için{" "}
            <a
              href="mailto:info@dtfbaskicim.com"
              className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
            >
              info@dtfbaskicim.com
            </a>{" "}
            adresine e-posta gönderilmelidir.
          </li>
          <li>
            Üretime başlanmış siparişlerde iptal kabul edilmez.
          </li>
          <li>
            İptal onaylandığında ödeme, ödeme yöntemiyle aynı şekilde 7-14 iş
            günü içinde iade edilir.
          </li>
        </ul>
      </section>

      {/* İade Kabul Edilen Durumlar */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold">
          2. İade Kabul Edilen Durumlar
        </h2>

        <div className="mb-6">
          <h3 className="mb-2 text-lg font-medium">a) Kargo Hasarı</h3>
          <p className="mb-2 leading-relaxed text-muted-foreground">
            Teslimat sırasında hasar gören ürünler için iade kabul edilir.
            Aşağıdaki adımların takip edilmesi gerekmektedir:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
            <li>Kargo görevlisi huzurunda kontrol yapılmalıdır.</li>
            <li>
              Hasarlı ürün için kargo firmasından tutanak alınmalıdır.
            </li>
            <li>Hasar fotoğrafları çekilmelidir.</li>
            <li>
              Teslimattan itibaren <strong>3 gün</strong> içinde{" "}
              <a
                href="mailto:info@dtfbaskicim.com"
                className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
              >
                info@dtfbaskicim.com
              </a>{" "}
              adresine bildirim yapılmalıdır.
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-medium">b) Üretim / Baskı Hatası</h3>
          <p className="mb-2 leading-relaxed text-muted-foreground">
            Bizden kaynaklanan kusurlar için iade kabul edilir:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
            <li>Sipariş edilen tasarımdan farklı basım.</li>
            <li>
              Baskı kalitesinde belirgin hata (bulanıklık, renk kayması, eksik
              baskı vb.).
            </li>
            <li>
              Teslimattan itibaren <strong>7 gün</strong> içinde fotoğraflı
              bildirim yapılmalıdır.
            </li>
          </ul>
        </div>
      </section>

      {/* İade Kabul Edilmeyen Durumlar */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold">
          3. İade Kabul Edilmeyen Durumlar
        </h2>
        <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
          <li>Beğenmeme.</li>
          <li>Yanlış tasarım yükleme (müşteri hatası).</li>
          <li>
            Renk beklentisi farklılıkları (ekran-baskı renk farkları).
          </li>
          <li>Kullanım sonrası oluşan hasarlar.</li>
          <li>Bildirim süresi geçmiş talepler.</li>
        </ul>
      </section>

      {/* İade Süreci */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold">4. İade Süreci</h2>
        <ol className="list-decimal space-y-3 pl-6 text-muted-foreground">
          <li>
            <strong className="text-foreground">Bildirim:</strong>{" "}
            <a
              href="mailto:info@dtfbaskicim.com"
              className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
            >
              info@dtfbaskicim.com
            </a>{" "}
            adresine fotoğraflı başvuru yapılır.
          </li>
          <li>
            <strong className="text-foreground">İnceleme:</strong> Talebiniz 3
            iş günü içinde değerlendirilir.
          </li>
          <li>
            <strong className="text-foreground">Onay / Red:</strong> Sonuç
            e-posta ile bildirilir.
          </li>
          <li>
            <strong className="text-foreground">Kargo:</strong> İade
            onaylanırsa, iade kargo bilgileri tarafınıza iletilir. İade kargo
            ücreti DTF Baskıcım tarafından karşılanır.
          </li>
          <li>
            <strong className="text-foreground">Para İadesi:</strong> İade ürün
            teslim alınıp incelendikten sonra, ödeme yöntemiyle aynı şekilde
            7-14 iş günü içinde yapılır.
          </li>
        </ol>
      </section>

      {/* İletişim */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold">5. İletişim</h2>
        <p className="leading-relaxed text-muted-foreground">
          İade ve iptal talepleriniz için bizimle iletişime geçebilirsiniz:
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
