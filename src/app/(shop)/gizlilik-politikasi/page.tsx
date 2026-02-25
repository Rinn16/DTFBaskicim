import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gizlilik Politikası ve KVKK Aydınlatma Metni | DTF Baskıcım",
  description:
    "DTF Baskıcım gizlilik politikası ve 6698 sayılı KVKK kapsamında kişisel verilerin korunması aydınlatma metni.",
};

export default function GizlilikPolitikasiPage() {
  return (
    <section className="py-16 px-6">
      <div className="prose prose-neutral dark:prose-invert max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Gizlilik Politikası ve KVKK Aydınlatma Metni
        </h1>
        <p className="text-muted-foreground text-sm mb-10">
          Son güncelleme tarihi: 26 Şubat 2026
        </p>

        {/* Veri Sorumlusu */}
        <h2 className="text-xl font-semibold mt-10 mb-4">Veri Sorumlusu</h2>
        <p>
          Bu aydınlatma metni, <strong>DTF Baskıcım</strong> tarafından 6698
          sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;)
          kapsamında, kişisel verilerinizin işlenme süreçlerine ilişkin sizleri
          bilgilendirmek amacıyla hazırlanmıştır.
        </p>

        {/* KVKK Kapsamında Aydınlatma */}
        <h2 className="text-xl font-semibold mt-10 mb-4">
          6698 Sayılı KVKK Kapsamında Aydınlatma Metni
        </h2>
        <p>
          DTF Baskıcım olarak, müşterilerimizin ve web sitemizi ziyaret eden
          kişilerin kişisel verilerinin korunmasına büyük önem vermekteyiz. Bu
          aydınlatma metni, hangi kişisel verilerin toplandığı, nasıl işlendiği,
          kimlerle paylaşılabileceği ve haklarınız hakkında sizi
          bilgilendirmektedir.
        </p>

        {/* Toplanan Kişisel Veriler */}
        <h2 className="text-xl font-semibold mt-10 mb-4">
          Toplanan Kişisel Veriler
        </h2>
        <p>
          Hizmetlerimizi sunabilmek amacıyla aşağıdaki kişisel veriler
          toplanmaktadır:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Ad ve soyad</li>
          <li>E-posta adresi</li>
          <li>Telefon numarası</li>
          <li>Teslimat ve fatura adresi</li>
          <li>
            Fatura bilgileri (TC kimlik numarası, vergi dairesi, vergi numarası)
          </li>
          <li>IP adresi</li>
          <li>Çerez (cookie) bilgileri</li>
        </ul>

        {/* Veri İşleme Amaçları */}
        <h2 className="text-xl font-semibold mt-10 mb-4">
          Veri İşleme Amaçları
        </h2>
        <p>Toplanan kişisel veriler aşağıdaki amaçlarla işlenmektedir:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            Sipariş işlemlerinin yürütülmesi ve teslimat süreçlerinin yönetimi
          </li>
          <li>Fatura düzenlenmesi (e-fatura ve e-arşiv fatura)</li>
          <li>Kargo takibi ve lojistik süreçlerinin yönetimi</li>
          <li>Müşteri iletişimi (SMS ve e-posta yoluyla bilgilendirme)</li>
          <li>
            Yasal yükümlülüklerin yerine getirilmesi (vergi mevzuatı, ticaret
            kanunu vb.)
          </li>
          <li>
            Hizmet kalitesinin artırılması ve müşteri deneyiminin
            iyileştirilmesi
          </li>
        </ul>

        {/* Verilerin Aktarılması */}
        <h2 className="text-xl font-semibold mt-10 mb-4">
          Verilerin Aktarılması
        </h2>
        <p>
          Kişisel verileriniz, aşağıdaki taraflarla yalnızca gerekli olduğu
          ölçüde ve ilgili mevzuata uygun olarak paylaşılabilmektedir:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong>Ödeme altyapısı sağlayıcısı:</strong> PayTR - ödeme
            işlemlerinin gerçekleştirilmesi amacıyla
          </li>
          <li>
            <strong>Kargo firmaları:</strong> Sipariş teslimat süreçlerinin
            yürütülmesi amacıyla
          </li>
          <li>
            <strong>SMS hizmet sağlayıcısı:</strong> VatanSMS - sipariş ve
            bilgilendirme mesajlarının gönderilmesi amacıyla
          </li>
          <li>
            <strong>E-fatura hizmet sağlayıcısı:</strong> Trendyol E-Faturam -
            fatura düzenleme ve iletme amacıyla
          </li>
          <li>
            <strong>Yetkili kamu kurum ve kuruluşları:</strong> Yasal zorunluluk
            halinde ilgili mevzuat gereğince
          </li>
        </ul>

        {/* Veri Saklama Süreleri */}
        <h2 className="text-xl font-semibold mt-10 mb-4">
          Veri Saklama Süreleri
        </h2>
        <p>
          Kişisel verileriniz, ticari ilişkinizin devam ettiği süre boyunca ve
          ilişkinizin sona ermesinin ardından ilgili mevzuatta öngörülen yasal
          saklama süreleri boyunca muhafaza edilmektedir:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong>Fatura ve muhasebe kayıtları:</strong> Vergi Usul Kanunu
            gereğince 10 yıl
          </li>
          <li>
            <strong>Diğer kişisel veriler:</strong> Ticari ilişkinin sona
            ermesinden itibaren 3 yıl
          </li>
        </ul>
        <p>
          Yasal saklama sürelerinin dolmasıyla birlikte kişisel verileriniz
          silinmekte, yok edilmekte veya anonim hale getirilmektedir.
        </p>

        {/* Veri Güvenliği */}
        <h2 className="text-xl font-semibold mt-10 mb-4">Veri Güvenliği</h2>
        <p>
          Kişisel verilerinizin güvenliğini sağlamak amacıyla aşağıdaki teknik
          ve idari tedbirler alınmaktadır:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>SSL şifreleme ile veri iletiminin güvenliği</li>
          <li>Güvenli sunucu altyapısı ve düzenli güvenlik güncellemeleri</li>
          <li>
            Erişim kısıtlamaları ve yetkilendirme mekanizmaları ile verilere
            erişimin sınırlandırılması
          </li>
          <li>Kişisel verilere erişim yetkisinin sınırlı tutulması</li>
        </ul>

        {/* İlgili Kişi Hakları */}
        <h2 className="text-xl font-semibold mt-10 mb-4">
          İlgili Kişi Hakları (KVKK Madde 11)
        </h2>
        <p>
          KVKK&apos;nin 11. maddesi kapsamında, kişisel veri sahibi olarak
          aşağıdaki haklara sahipsiniz:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
          <li>
            Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme
          </li>
          <li>
            Kişisel verilerinizin işlenme amacını ve bunların amacına uygun
            kullanılıp kullanılmadığını öğrenme
          </li>
          <li>
            Yurt içinde veya yurt dışında kişisel verilerinizin aktarıldığı
            üçüncü kişileri bilme
          </li>
          <li>
            Kişisel verilerinizin eksik veya yanlış işlenmiş olması halinde
            bunların düzeltilmesini isteme
          </li>
          <li>
            KVKK&apos;nin 7. maddesi kapsamında kişisel verilerinizin
            silinmesini veya yok edilmesini isteme
          </li>
          <li>
            Düzeltme ve silme işlemlerinin, kişisel verilerinizin aktarıldığı
            üçüncü kişilere bildirilmesini isteme
          </li>
          <li>
            İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz
            edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz
            etme
          </li>
          <li>
            Kişisel verilerinizin kanuna aykırı olarak işlenmesi sebebiyle
            zarara uğramanız halinde tazminat talep etme
          </li>
        </ul>

        {/* Başvuru Yöntemleri */}
        <h2 className="text-xl font-semibold mt-10 mb-4">
          Başvuru Yöntemleri
        </h2>
        <p>
          Yukarıda belirtilen haklarınızı kullanmak için aşağıdaki yöntemle
          başvuruda bulunabilirsiniz:
        </p>
        <p>
          <strong>E-posta:</strong>{" "}
          <a
            href="mailto:info@dtfbaskicim.com"
            className="text-primary underline underline-offset-4 hover:text-primary/80"
          >
            info@dtfbaskicim.com
          </a>{" "}
          adresine kimliğinizi tespit edici bilgiler ile birlikte yazılı
          başvuru yapabilirsiniz.
        </p>
        <p>
          Başvurunuz, talebin niteliği dikkate alınarak en geç 30 (otuz) gün
          içinde ücretsiz olarak sonuçlandırılacaktır. Ancak işlemin ayrıca bir
          maliyet gerektirmesi halinde, Kişisel Verileri Koruma Kurulu
          tarafından belirlenen tarife üzerinden ücret alınabilir.
        </p>

        {/* Politika Değişiklikleri */}
        <h2 className="text-xl font-semibold mt-10 mb-4">
          Politika Değişiklikleri
        </h2>
        <p>
          DTF Baskıcım, bu gizlilik politikasını ve KVKK aydınlatma metnini
          gerekli gördüğü durumlarda güncelleme hakkını saklı tutar. Yapılan
          güncellemeler bu sayfada yayınlanacak olup, önemli değişiklikler
          hakkında müşterilerimiz bilgilendirilecektir.
        </p>
        <p>
          Web sitemizi kullanmaya devam etmeniz, güncel gizlilik politikamızı
          kabul ettiğiniz anlamına gelmektedir.
        </p>
      </div>
    </section>
  );
}
