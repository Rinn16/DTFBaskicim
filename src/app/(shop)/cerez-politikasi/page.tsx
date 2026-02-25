import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Çerez Politikası | DTF Baskıcım",
  description:
    "DTF Baskıcım çerez (cookie) politikası. Sitemizde kullanılan çerez türleri, amaçları ve yönetimi hakkında bilgi.",
};

export default function CerezPolitikasiPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
        Çerez (Cookie) Politikası
      </h1>

      <p className="mb-12 text-sm text-muted-foreground">
        Son güncelleme tarihi: 26 Şubat 2026
      </p>

      {/* Çerez Nedir? */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold">Çerez Nedir?</h2>
        <p className="leading-relaxed text-muted-foreground">
          Çerezler, web sitelerinin tarayıcınıza yerleştirdiği küçük metin
          dosyalarıdır. Sitemizin düzgün çalışması, güvenliğin sağlanması ve
          kullanıcı deneyiminin iyileştirilmesi amacıyla çerezler
          kullanılmaktadır.
        </p>
      </section>

      {/* Kullanılan Çerez Türleri */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold">
          Kullanılan Çerez Türleri
        </h2>

        {/* Zorunlu Çerezler */}
        <div className="mb-8">
          <h3 className="mb-2 text-lg font-medium">1. Zorunlu Çerezler</h3>
          <p className="mb-4 leading-relaxed text-muted-foreground">
            Sitenin temel işlevleri için gereklidir. Oturum yönetimi, güvenlik
            ve sepet bilgileri bu çerezler aracılığıyla sağlanır. Bu çerezler
            olmadan site düzgün çalışamaz ve devre dışı bırakılamaz.
          </p>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">
                    Çerez Adı
                  </th>
                  <th className="px-4 py-3 text-left font-medium">Amaç</th>
                  <th className="px-4 py-3 text-left font-medium">Süre</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b">
                  <td className="px-4 py-3">
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                      next-auth.session-token
                    </code>
                  </td>
                  <td className="px-4 py-3">Oturum yönetimi</td>
                  <td className="px-4 py-3">Oturum süresince</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-3">
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                      next-auth.csrf-token
                    </code>
                  </td>
                  <td className="px-4 py-3">CSRF güvenlik koruması</td>
                  <td className="px-4 py-3">Oturum süresince</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                      next-auth.callback-url
                    </code>
                  </td>
                  <td className="px-4 py-3">Yönlendirme bilgisi</td>
                  <td className="px-4 py-3">Oturum süresince</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* İşlevsel Çerezler */}
        <div className="mb-8">
          <h3 className="mb-2 text-lg font-medium">2. İşlevsel Çerezler</h3>
          <p className="mb-4 leading-relaxed text-muted-foreground">
            Tercihlerinizi hatırlamak için kullanılır. Bu çerezler sayesinde
            site, daha kişiselleştirilmiş bir deneyim sunabilir.
          </p>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">
                    Çerez Adı
                  </th>
                  <th className="px-4 py-3 text-left font-medium">Amaç</th>
                  <th className="px-4 py-3 text-left font-medium">Süre</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b">
                  <td className="px-4 py-3">
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                      theme
                    </code>
                  </td>
                  <td className="px-4 py-3">Tema tercihi (açık/koyu)</td>
                  <td className="px-4 py-3">1 yıl</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                      cookie-consent
                    </code>
                  </td>
                  <td className="px-4 py-3">Çerez onay durumu</td>
                  <td className="px-4 py-3">1 yıl</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Performans/Analitik Çerezler */}
        <div>
          <h3 className="mb-2 text-lg font-medium">
            3. Performans / Analitik Çerezler
          </h3>
          <p className="leading-relaxed text-muted-foreground">
            Şu an aktif olarak analitik çerez kullanılmamaktadır. İleride
            kullanılması durumunda bu politika güncellenecektir.
          </p>
        </div>
      </section>

      {/* Çerez Yönetimi */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold">Çerez Yönetimi</h2>
        <p className="mb-3 leading-relaxed text-muted-foreground">
          Tarayıcı ayarlarınızdan çerezleri kontrol edebilirsiniz. Zorunlu
          çerezlerin devre dışı bırakılması sitenin düzgün çalışmasını
          engelleyebilir.
        </p>
        <p className="leading-relaxed text-muted-foreground">
          Her tarayıcının çerez yönetimi farklıdır. Çerezleri nasıl
          yöneteceğiniz hakkında bilgi almak için tarayıcınızın yardım menüsüne
          başvurabilirsiniz.
        </p>
      </section>

      {/* Üçüncü Taraf Çerezleri */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold">Üçüncü Taraf Çerezleri</h2>
        <p className="leading-relaxed text-muted-foreground">
          Ödeme altyapısı (PayTR) işlem sırasında kendi çerezlerini
          kullanabilir. Bu çerezler PayTR&apos;nin gizlilik politikasına
          tabidir.
        </p>
      </section>

      {/* Politika Güncellemeleri */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold">Politika Güncellemeleri</h2>
        <p className="leading-relaxed text-muted-foreground">
          Bu politika gerektiğinde güncellenebilir. Güncel versiyon her zaman bu
          sayfada yayınlanır.
        </p>
      </section>

      {/* İletişim */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold">İletişim</h2>
        <p className="leading-relaxed text-muted-foreground">
          Çerezlerle ilgili sorularınız için bizimle iletişime geçebilirsiniz:
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
