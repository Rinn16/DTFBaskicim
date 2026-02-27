import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mesafeli Satış Sözleşmesi | DTF Baskıcım",
  description:
    "DTF Baskıcım mesafeli satış sözleşmesi. 6502 Sayılı Tüketicinin Korunması Hakkında Kanun kapsamında hazırlanmış yasal sözleşme metni.",
};

export default function MesafeliSatisSozlesmesiPage() {
  return (
    <div className="max-w-4xl mx-auto py-16 px-6">
      <h1 className="text-3xl font-bold tracking-tight mb-2">
        Mesafeli Satış Sözleşmesi
      </h1>
      <p className="text-sm text-muted-foreground mb-10">
        Son güncelleme tarihi: 26 Şubat 2026
      </p>

      <div className="space-y-10 text-sm leading-relaxed text-foreground/90">
        {/* Madde 1 */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Madde 1 - Taraflar</h2>
          <div className="space-y-4">
            <div>
              <p className="font-medium mb-1">SATICI:</p>
              <ul className="list-none space-y-1 ml-1">
                <li>
                  <span className="font-medium">Ünvan:</span> Rima Reklam Promosyon Danışmanlık Dış Ticaret Ltd Şti
                </li>
                <li>
                  <span className="font-medium">Ticari İsim:</span> DTF Baskıcım
                </li>
                <li>
                  <span className="font-medium">Vergi No:</span> 4631210209
                </li>
                <li>
                  <span className="font-medium">Adres:</span> Güzelyalı Burgaz Mah. Kazım Karabekir Cad. No:13/C Mudanya / Bursa
                </li>
                <li>
                  <span className="font-medium">E-posta:</span>{" "}
                  info@dtfbaskicim.com
                </li>
                <li>
                  <span className="font-medium">Web:</span> www.dtfbaskicim.com
                </li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-1">ALICI:</p>
              <p className="ml-1">
                Sipariş sırasında bilgilerini beyan eden kişi. ALICI&apos;nın
                adı, soyadı, adresi, telefon numarası, e-posta adresi ve diğer
                bilgileri sipariş formunda yer almaktadır.
              </p>
            </div>
          </div>
        </section>

        {/* Madde 2 */}
        <section>
          <h2 className="text-lg font-semibold mb-3">
            Madde 2 - Sözleşmenin Konusu
          </h2>
          <p>
            Bu sözleşme, 6502 Sayılı Tüketicinin Korunması Hakkında Kanun ve
            Mesafeli Sözleşmeler Yönetmeliği hükümleri uyarınca,
            ALICI&apos;nın SATICI&apos;ya ait web sitesinden elektronik ortamda
            siparişini verdiği kişiye özel DTF baskı ürünlerinin satışı ve
            teslimatına ilişkin tarafların hak ve yükümlülüklerini düzenler.
          </p>
        </section>

        {/* Madde 3 */}
        <section>
          <h2 className="text-lg font-semibold mb-3">
            Madde 3 - Sözleşme Konusu Ürün/Hizmet
          </h2>
          <p>
            Kişiye özel DTF (Direct to Film) baskı hizmeti. Ürünlerin temel
            nitelikleri, satış fiyatı (KDV dahil), ödeme şekli ve teslimat
            bilgileri sipariş özeti sayfasında belirtilir.
          </p>
        </section>

        {/* Madde 4 */}
        <section>
          <h2 className="text-lg font-semibold mb-3">
            Madde 4 - Genel Hükümler
          </h2>
          <p>
            ALICI, sözleşme konusu ürünün temel niteliklerini, satış fiyatını
            ve ödeme şeklini, teslimat koşullarını okuyup bilgi sahibi olduğunu
            ve elektronik ortamda gerekli teyidi verdiğini kabul eder.
          </p>
        </section>

        {/* Madde 5 */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Madde 5 - Ödeme</h2>
          <p>
            Kredi kartı veya banka havalesi ile ödeme yapılabilir. Kredi kartı
            ile yapılan ödemelerde PayTR güvenli ödeme altyapısı kullanılır.
            Kart bilgileri DTF Baskıcım tarafından saklanmaz.
          </p>
        </section>

        {/* Madde 6 */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Madde 6 - Teslimat</h2>
          <ul className="list-disc list-outside ml-5 space-y-2">
            <li>
              Teslimat, ALICI&apos;nın sipariş formunda belirttiği adrese
              yapılır.
            </li>
            <li>
              Tahmini teslimat süresi sipariş onayından itibaren 3-7 iş
              günüdür (üretim + kargo).
            </li>
            <li>
              Teslimat masrafları ALICI&apos;ya aittir (ücretsiz kargo
              kampanyaları hariç).
            </li>
            <li>
              Kargo firmalarıyla anlaşmalı olarak gönderim yapılır.
            </li>
          </ul>
        </section>

        {/* Madde 7 - Cayma Hakkı */}
        <section>
          <h2 className="text-lg font-semibold mb-3">
            Madde 7 - Cayma Hakkı
          </h2>
          <div className="rounded-lg border border-border bg-muted/50 p-5 space-y-3">
            <p>
              6502 Sayılı Kanun ve Mesafeli Sözleşmeler Yönetmeliği&apos;nin
              15. maddesi (ç) bendi gereğince:
            </p>
            <p className="font-bold text-foreground">
              &ldquo;Tüketicinin istekleri veya açıkça onun kişisel ihtiyaçları
              doğrultusunda hazırlanan mallarda cayma hakkı kullanılamaz.&rdquo;
            </p>
            <p>
              DTF Baskıcım&apos;dan sipariş edilen tüm ürünler, müşterinin
              yüklediği tasarıma göre kişiye özel olarak üretilmektedir.
            </p>
            <p className="font-bold text-foreground">
              Bu nedenle, sözleşme konusu ürünlerde CAYMA HAKKI
              BULUNMAMAKTADIR.
            </p>
            <p>
              ALICI, bu durumu sipariş öncesinde kabul etmiş sayılır.
            </p>
          </div>
        </section>

        {/* Madde 8 */}
        <section>
          <h2 className="text-lg font-semibold mb-3">
            Madde 8 - İade Koşulları
          </h2>
          <p className="mb-3">
            Aşağıdaki durumlarda iade kabul edilir:
          </p>
          <ul className="list-disc list-outside ml-5 space-y-2">
            <li>
              Kargo sırasında hasar görmüş ürünler (kargo tutanağı ve fotoğraf
              ile belgelenmelidir).
            </li>
            <li>
              Üretim/baskı kaynaklı hatalar (sipariş edilen tasarımdan farklı
              basım, baskı kalite hatası).
            </li>
          </ul>
          <p className="mt-3">
            Hasar veya hata durumunda teslimattan itibaren{" "}
            <strong>7 gün</strong> içinde{" "}
            <strong>info@dtfbaskicim.com</strong> adresine fotoğraflı bildirim
            yapılmalıdır.
          </p>
        </section>

        {/* Madde 9 */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Madde 9 - Garanti</h2>
          <p>
            Üretimden kaynaklanan kusurlar için SATICI sorumluluk kabul eder.
            Üretim hatası tespit edilen ürünler ücretsiz olarak yeniden
            üretilir veya ödeme iadesi yapılır.
          </p>
        </section>

        {/* Madde 10 */}
        <section>
          <h2 className="text-lg font-semibold mb-3">
            Madde 10 - Uyuşmazlık
          </h2>
          <p>
            İşbu sözleşmeden doğan uyuşmazlıklarda Gümrük ve Ticaret
            Bakanlığı&apos;nca ilan edilen değere kadar Tüketici Hakem
            Heyetleri, aşan değerlerde Tüketici Mahkemeleri yetkilidir.
          </p>
        </section>

        {/* Madde 11 */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Madde 11 - Yürürlük</h2>
          <p>
            ALICI, sipariş sürecinde bu sözleşmeyi okuduğunu ve kabul ettiğini
            onaylar. Sözleşme, sipariş tarihinde yürürlüğe girer.
          </p>
        </section>
      </div>
    </div>
  );
}
