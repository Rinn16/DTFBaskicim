import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Yardım Merkezi | DTF Baskıcım",
  description:
    "DTF Baskıcım yardım merkezi. Sipariş süreci, ödeme, teslimat, iade ve tasarım hakkında sıkça sorulan sorular.",
};

function FaqItem({
  question,
  children,
}: {
  question: string;
  children: React.ReactNode;
}) {
  return (
    <details className="group rounded-lg border border-border bg-muted/50 [&[open]]:bg-muted/80">
      <summary className="cursor-pointer select-none px-6 py-4 font-semibold transition-colors hover:text-primary [&::-webkit-details-marker]:hidden">
        <span className="flex items-center justify-between">
          <span>{question}</span>
          <span className="ml-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 6L8 10L12 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </span>
      </summary>
      <div className="px-6 pb-4 leading-relaxed text-muted-foreground">
        {children}
      </div>
    </details>
  );
}

export default function YardimPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      {/* Header */}
      <h1 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
        Yardım Merkezi
      </h1>
      <p className="mb-12 leading-relaxed text-muted-foreground">
        Sıkça sorulan sorular ve yardım konuları
      </p>

      {/* Sipariş Süreci */}
      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold">Sipariş Süreci</h2>
        <div className="space-y-3">
          <FaqItem question="DTF baskı nedir?">
            DTF (Direct to Film), özel bir film üzerine tasarımın basılması ve
            ısı transferi ile kumaşa aktarılması tekniğidir. Pamuklu, polyester
            ve karışım kumaşlara uygulanabilir.
          </FaqItem>

          <FaqItem question="Nasıl sipariş veririm?">
            Tasarım editöründe görseli yükleyin, boyut ve adet seçin, sepete
            ekleyin ve ödeme yapın.
          </FaqItem>

          <FaqItem question="Sipariş onayı nasıl alırım?">
            Ödeme tamamlandıktan sonra e-posta ve/veya SMS ile sipariş onayı
            gönderilir.
          </FaqItem>

          <FaqItem question="Siparişimi nasıl takip edebilirim?">
            <Link
              href="/siparis-takip"
              className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
            >
              Sipariş Takip
            </Link>{" "}
            sayfasından sipariş numaranız ve e-posta adresinizle siparişinizi
            takip edebilirsiniz.
          </FaqItem>
        </div>
      </section>

      {/* Ödeme */}
      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold">Ödeme</h2>
        <div className="space-y-3">
          <FaqItem question="Hangi ödeme yöntemlerini kabul ediyorsunuz?">
            Kredi kartı (PayTR güvenli altyapısı) ve banka havalesi ile ödeme
            yapabilirsiniz.
          </FaqItem>

          <FaqItem question="Ödeme güvenli mi?">
            Evet, tüm kredi kartı işlemleri PayTR güvenli ödeme altyapısı
            üzerinden gerçekleştirilir. Kart bilgileriniz tarafımızca saklanmaz.
          </FaqItem>

          <FaqItem question="Banka havalesi ile nasıl ödeme yaparım?">
            Sipariş oluşturduktan sonra belirtilen banka hesabına havale/EFT
            yapabilirsiniz. Açıklama kısmına sipariş numaranızı yazmayı
            unutmayın.
          </FaqItem>
        </div>
      </section>

      {/* Teslimat */}
      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold">Teslimat</h2>
        <div className="space-y-3">
          <FaqItem question="Teslimat süresi ne kadar?">
            Sipariş onayından itibaren üretim + kargo dahil 3-7 iş günüdür.
          </FaqItem>

          <FaqItem question="Kargo ücreti ne kadar?">
            Kargo ücreti sipariş tutarına ve adrese göre hesaplanır. Belirli
            tutarın üzerindeki siparişlerde ücretsiz kargo uygulanabilir.
          </FaqItem>

          <FaqItem question="Kargom hasarlı geldi, ne yapmalıyım?">
            Kargo görevlisi huzurunda paketi kontrol edin, hasarlıysa tutanak
            tutturun ve fotoğraf çekin. 3 gün içinde{" "}
            <a
              href="mailto:info@dtfbaskicim.com"
              className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
            >
              info@dtfbaskicim.com
            </a>{" "}
            adresine bildirin.
          </FaqItem>
        </div>
      </section>

      {/* İade ve İptal */}
      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold">İade ve İptal</h2>
        <div className="space-y-3">
          <FaqItem question="İade yapabilir miyim?">
            Ürünlerimiz kişiye özel üretildiğinden, Mesafeli Sözleşmeler
            Yönetmeliği Madde 15/ç gereğince cayma hakkı bulunmamaktadır. Ancak
            kargo hasarı veya üretim hatası durumunda iade kabul edilir.
          </FaqItem>

          <FaqItem question="Siparişimi iptal edebilir miyim?">
            Üretime başlanmamış siparişler iptal edilebilir. Üretime
            başlandıktan sonra iptal kabul edilmez.
          </FaqItem>

          <FaqItem question="Detaylı iade politikası için ne yapmalıyım?">
            <Link
              href="/iptal-ve-iade-politikasi"
              className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
            >
              İptal ve İade Politikası
            </Link>{" "}
            sayfamızı inceleyebilirsiniz.
          </FaqItem>
        </div>
      </section>

      {/* Tasarım */}
      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold">Tasarım</h2>
        <div className="space-y-3">
          <FaqItem question="Hangi dosya formatlarını kabul ediyorsunuz?">
            PNG, JPG, SVG ve PDF formatları kabul edilmektedir. En iyi sonuç
            için yüksek çözünürlüklü (en az 300 DPI) PNG dosyaları önerilir.
          </FaqItem>

          <FaqItem question="Tasarım boyutu ne olmalı?">
            Tasarım editöründe istediğiniz boyutu cm cinsinden belirleyebilirsiniz.
          </FaqItem>

          <FaqItem question="Ekrandaki renkler baskıda farklı olabilir mi?">
            Evet, monitör kalibrasyonu ve baskı tekniği farkları nedeniyle
            renklerde küçük farklılıklar olabilir. Bu durum iade sebebi
            değildir.
          </FaqItem>
        </div>
      </section>

      {/* Hesap */}
      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold">Hesap</h2>
        <div className="space-y-3">
          <FaqItem question="Hesap oluşturmak zorunlu mu?">
            Hayır, misafir olarak da sipariş verebilirsiniz. Ancak hesap
            oluşturarak siparişlerinizi takip edebilir ve gelecek
            siparişlerinizde bilgilerinizi tekrar girmenize gerek kalmaz.
          </FaqItem>
        </div>
      </section>

      {/* İletişim */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">İletişim</h2>
        <div className="rounded-lg border border-border bg-muted/50 p-6">
          <p className="leading-relaxed text-muted-foreground">
            Sorularınız için{" "}
            <a
              href="mailto:info@dtfbaskicim.com"
              className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
            >
              info@dtfbaskicim.com
            </a>{" "}
            adresine e-posta gönderebilir veya{" "}
            <Link
              href="/iletisim"
              className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
            >
              İletişim
            </Link>{" "}
            sayfamızı ziyaret edebilirsiniz.
          </p>
        </div>
      </section>
    </div>
  );
}
