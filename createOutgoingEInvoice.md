# createOutgoingEInvoice

> **Endpoint:** `POST /api/invoice/documents/outgoing-einvoice`  
> **Base URL:** `https://apigateway.trendyolecozum.com`  
> **Content-Type:** `application/json`

## E-Fatura oluşturmak için kullanılır.

## Request Body

### Üst Seviye Alanlar

| Alan               | Tip             | Zorunlu  | Açıklama                                                                                                                                                                                                                                                                                                                              |
| ------------------ | --------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `autoInvoiceId`    | boolean         | —        | Varsayılan: `true`. 16 haneli fatura numarasının otomatik olarak verilmesi isteniyorsa `true` olarak gönderilmelidir. `true` olduğu durumda sistem varsayılan seriden bir sonraki numarayı otomatik verir. Manuel numara için `false` yapıp `invoiceInfo.invoiceId` alanına 16 haneli numara girilmelidir. Örnek: `ABC2024000000001`. |
| `xsltCode`         | string          | —        | Özel fatura şablonu kullanmak için verilen xsltCode. Boş gönderilirse standart görünüm kullanılır.                                                                                                                                                                                                                                    |
| `companyId`        | int64           | **Evet** | Size ait firma id bilgisi. Token içinde ve `customerSignIn` response'unda mevcuttur.                                                                                                                                                                                                                                                  |
| `localReferenceId` | string          | —        | Maks. 127 karakter. Muhasebe/ERP sisteminizdeki identifier numarası.                                                                                                                                                                                                                                                                  |
| `prefix`           | string (Prefix) | —        | Maks. 3 karakter, `^[A-Z0-9]{3}$`. 3 haneli fatura ön-eki (hepsi büyük harf). Girilmezse varsayılan ön-ek kullanılır.                                                                                                                                                                                                                 |
| `userId`           | int64           | **Evet** | Fatura oluşturan user'ın id bilgisi. `customerSignIn` response'unda ve token içinde mevcuttur.                                                                                                                                                                                                                                        |
| `source`           | Source          | **Evet** | `[PORTAL, WEB, MOBILE, PARTNER]`. Faturanın kesildiği ortam. Pazaryeri entegratörleri için `PARTNER`.                                                                                                                                                                                                                                 |
| `notes`            | string[]        | —        | Fatura içinde liste şeklinde notlar.                                                                                                                                                                                                                                                                                                  |
| `issuedAt`         | date-time       | —        | Fatura tarihi. Boş bırakılırsa isteğin ulaştığı tarih/saat alınır.                                                                                                                                                                                                                                                                    |
| `targetAlias`      | string          | —        | Maks. 255 karakter. Birden fazla fatura etiketi olan alıcılar için etiket seçimi.                                                                                                                                                                                                                                                     |
| `deliveryTypeCode` | string          | —        | 3 karakter. Mikro ihracat faturaları için teslim şekli kodu.                                                                                                                                                                                                                                                                          |

---

### `recipientInfo` (Alıcı Bilgileri) — **Zorunlu**

| Alan          | Tip                          | Zorunlu  | Açıklama                               |
| ------------- | ---------------------------- | -------- | -------------------------------------- |
| `taxId`       | string                       | **Evet** | Min. 10 karakter. VKN/TCKN bilgisi.    |
| `countryCode` | CountryCode                  | —        | Varsayılan: `TR`. Ülke kodu.           |
| `city`        | string                       | **Evet** | Min. 2 karakter. Şehir bilgisi.        |
| `district`    | string                       | —        | İlçe bilgisi.                          |
| `address`     | string                       | —        | 2-255 karakter. Adres bilgisi.         |
| `postalCode`  | string                       | —        | 5 karakter. Posta kodu.                |
| `phone`       | string (ExtendedPhoneNumber) | —        | `^\\+?[0-9]{7,15}$`. Telefon numarası. |
| `email`       | email                        | —        | Min. 2 karakter. Email adresi.         |
| `name`        | string                       | **Evet** | 2-127 karakter. Ad.                    |
| `surname`     | string                       | —        | 2-255 karakter. Soyad.                 |
| `taxOffice`   | string                       | —        | Min. 2 karakter. Vergi dairesi.        |

#### `recipientInfo.passengerInfo` (Yolcu Bilgisi)

| Alan                | Tip    | Zorunlu  | Açıklama                             |
| ------------------- | ------ | -------- | ------------------------------------ |
| `passportNo`        | string | **Evet** | Maks. 9 karakter. Pasaport numarası. |
| `passportIssueDate` | date   | —        | Pasaport verilme tarihi.             |

#### `recipientInfo.passengerInfo.bankInformation` (Banka Bilgileri)

| Alan                   | Tip    | Zorunlu  | Açıklama                              |
| ---------------------- | ------ | -------- | ------------------------------------- |
| `bankName`             | string | **Evet** | 2-127 karakter. Banka ismi.           |
| `bankBranchOfficeName` | string | **Evet** | 2-127 karakter. Banka şube ismi.      |
| `accountType`          | string | **Evet** | 3 karakter. Hesap türü (Örn. TRY).    |
| `accountNumber`        | string | **Evet** | 3-63 karakter. Hesap numarası (IBAN). |
| `paymentNote`          | string | —        | Maks. 255 karakter. Ödeme notu.       |

---

### `currencyInfo` (Kur Bilgileri)

| Alan              | Tip       | Zorunlu | Açıklama                                         |
| ----------------- | --------- | ------- | ------------------------------------------------ |
| `currency`        | string    | —       | Min. 2 karakter. Varsayılan: `TRY`. Para birimi. |
| `hasExchange`     | boolean   | —       | Kur bilgisi kullanılacaksa `true`.               |
| `calculationRate` | double    | —       | Kur bilgisi.                                     |
| `sourceCurrency`  | string    | —       | Min. 2 karakter. Kaynak para birimi.             |
| `targetCurrency`  | string    | —       | Min. 2 karakter. Hedef para birimi.              |
| `exchangeDate`    | date-time | —       | Kur bilgisinin tarihi.                           |

---

### `invoiceInfo` (Fatura Bilgileri) — **Zorunlu**

| Alan              | Tip             | Zorunlu | Açıklama                                                                                                                                                                                                  |
| ----------------- | --------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `invoiceType`     | InvoiceType     | —       | `[EARSIVFATURA, TEMELFATURA, TICARIFATURA, TEMELIRSALIYE, HKS, IHRACAT, KAMU, ENERJI, ILAC_TIBBICIHAZ, YOLCUBERABERFATURA]`. Fatura senaryo bilgisi.                                                      |
| `invoiceTypeCode` | InvoiceTypeCode | —       | `[SATIS, IADE, TEVKIFAT, ISTISNA, OZELMATRAH, IHRACKAYITLI, TEVKIFATIADE, SEVK, MATBUDAN, KONAKLAMAVERGISI, SARJ, SARJANLIK, TEKNOLOJIDESTEK, KOMISYONCU, HKSSATIS, HKSKOMISYONCU]`. Fatura türü bilgisi. |
| `invoiceId`       | string          | —       | `^[A-Z0-9]{3}20[0-9]{2}[0-9]{9}$`. Manuel fatura numarası, 16 hane. Örn: `ABC2024000000001`.                                                                                                              |
| `invoiceUuid`     | uuid            | —       | Faturanın ETTN numarası. Girilmezse otomatik atanır.                                                                                                                                                      |

---

### `invoiceLines` (Fatura Kalemleri) — **Zorunlu** — Array

| Alan                           | Tip               | Zorunlu  | Açıklama                                                              |
| ------------------------------ | ----------------- | -------- | --------------------------------------------------------------------- |
| `unitCode`                     | UnitCode          | —        | Varsayılan: `C62`. Birim kodu.                                        |
| `quantity`                     | double            | **Evet** | Miktar.                                                               |
| `totalAmount`                  | int64             | **Evet** | Toplam tutar.                                                         |
| `taxAmount`                    | int64             | **Evet** | Toplam vergi tutarı.                                                  |
| `taxableAmount`                | int64             | **Evet** | Vergi matrahı.                                                        |
| `taxPercent`                   | int32             | **Evet** | Vergi oranı.                                                          |
| `taxName`                      | string            | —        | Vergi adı.                                                            |
| `taxCode`                      | string            | —        | Vergi türü kodu.                                                      |
| `itemName`                     | string            | **Evet** | Ürün adı.                                                             |
| `unitPriceAmount`              | double            | **Evet** | Birim fiyatı.                                                         |
| `totalDiscountAmount`          | int64             | **Evet** | İndirim miktarı.                                                      |
| `originCode`                   | OriginCode        | —        | Ürün menşei bilgisi.                                                  |
| `microExportRequiredCustomsId` | RequiredCustomsId | —        | `^\\d{12}$`. Mikro ihracat faturaları için GTIP kodu.                 |
| `chargeUnitSerialNo`           | string            | —        | Maks. 127 karakter. Enerji faturaları için şarj birimi seri numarası. |

#### `invoiceLines[].withholdingTax` (Tevkifat Bilgileri)

| Alan          | Tip    | Zorunlu  | Açıklama      |
| ------------- | ------ | -------- | ------------- |
| `taxAmount`   | int32  | **Evet** | Vergi tutarı. |
| `percent`     | int32  | **Evet** | Vergi oranı.  |
| `taxTypeCode` | string | **Evet** | Vergi kodu.   |
| `name`        | string | **Evet** | Vergi adı.    |

#### `invoiceLines[].totalTax` (Toplam Vergi)

| Alan             | Tip   | Zorunlu  | Açıklama                         |
| ---------------- | ----- | -------- | -------------------------------- |
| `totalTaxAmount` | int32 | **Evet** | Toplam vergi tutarı.             |
| `subTotalTaxes`  | array | **Evet** | Vergi türlerine göre kırılımlar. |

#### `invoiceLines[].totalTax.subTotalTaxes[]`

| Alan                     | Tip     | Zorunlu  | Açıklama                                                                                                                                 |
| ------------------------ | ------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `taxableAmount`          | int32   | **Evet** | Vergilendirilebilir tutar.                                                                                                               |
| `taxAmount`              | int64   | **Evet** | Vergi tutarı.                                                                                                                            |
| `taxType`                | TaxType | —        | `[KDV, OTV_1, OTV_2, OTV_3, OTV_3A, OTV_3B, OTV_3C, OTV_4, KONAKLAMA, OIV, STAMP_TAX, TRT_SHARE, PASTURE_FUND, STOCK_REGISTRATION_FEE]`. |
| `percent`                | number  | —        | Vergi oranı.                                                                                                                             |
| `taxUnitPrice`           | number  | —        | ÖTV için vergi birim tutarı.                                                                                                             |
| `taxCode`                | string  | —        | _(deprecated)_ Vergi kodu.                                                                                                               |
| `name`                   | string  | —        | Vergi adı.                                                                                                                               |
| `taxExemptionReason`     | string  | —        | KDV istisna sebebi.                                                                                                                      |
| `taxExemptionReasonCode` | int32   | —        | KDV istisna sebebi kodu.                                                                                                                 |

#### `invoiceLines[].exportInfo` (İhracat Bilgileri)

**delivery** (Zorunlu):
| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `city` | string | **Evet** | Maks. 127 karakter. Şehir ismi. |
| `country` | string | **Evet** | Maks. 127 karakter. Ülke ismi. |
| `deliveryTypeCode` | string | **Evet** | 3 karakter. Teslim şekli kodu. |
**shipment** (Zorunlu):
| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `requiredCustomsId` | RequiredCustomsId | **Evet** | `^\\d{12}$`. GTIP kodu. |
| `transportMeanCode` | string | **Evet** | Maks. 1 karakter. Sevkiyat türü kodu. |
| `packagingTypeCode` | string | — | 2 karakter. Eşya kap cinsi kodu. |
| `packagingQuantity` | integer | — | Kap adedi. |

#### `invoiceLines[].exportRegisteredAdditionalInfo` (İhraç Kayıtlı)

| Alan                | Tip               | Zorunlu  | Açıklama                      |
| ------------------- | ----------------- | -------- | ----------------------------- |
| `lineId`            | string            | **Evet** | 11 karakter. Fatura numarası. |
| `requiredCustomsId` | RequiredCustomsId | **Evet** | `^\\d{12}$`. GTIP kodu.       |

#### `invoiceLines[].technologySupportInfo` (Teknoloji Destek)

| Alan                    | Tip                   | Zorunlu  | Açıklama                           |
| ----------------------- | --------------------- | -------- | ---------------------------------- |
| `technologySupportType` | TechnologySupportType | **Evet** | `[TELEPHONE, TABLET]`. Cihaz türü. |
| `imei`                  | Imei                  | —        | `^[0-9]{15}$`. IMEI numarası.      |
| `imei2`                 | Imei                  | —        | `^[0-9]{15}$`. IMEI numarası.      |
| `imei3`                 | Imei                  | —        | `^[0-9]{15}$`. IMEI numarası.      |

#### `invoiceLines[].medicalInvoiceInfo` (İlaç-Tıbbi Cihaz)

| Alan                          | Tip                | Zorunlu  | Açıklama                                        |
| ----------------------------- | ------------------ | -------- | ----------------------------------------------- |
| `medicalProductType`          | MedicalProductType | **Evet** | `[MEDICINE, MEDICAL_DEVICE, OTHER]`.            |
| `medicineAdditionalInfo`      | array              | —        | Ürün türü `MEDICINE` ise doldurulmalıdır.       |
| `medicalDeviceAdditionalInfo` | array              | —        | Ürün türü `MEDICAL_DEVICE` ise doldurulmalıdır. |

**medicineAdditionalInfo[]:**
| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `gtinNo` | string | **Evet** | `^\\d{13}$`. GTIN numarası. |
| `batchNo` | string | **Evet** | `^\\d{1,155}$`. Lot numarası. |
| `sequenceNo` | string | **Evet** | `^\\d{1,155}$`. Sıra numarası. |
| `expirationDate` | date | — | Son kullanma tarihi. |
**medicalDeviceAdditionalInfo[]:**
| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `productNo` | string | **Evet** | `^\\d{1,155}$`. Ürün numarası. |
| `batchNo` | string | **Evet** | `^\\d{1,155}$`. Parti/Lot numarası. |
| `sequenceNo` | string | — | `^\\d{1,155}$`. Sıra numarası. |
| `manufacturingDate` | date | **Evet** | Üretim tarihi. |

#### `invoiceLines[].marketplaceSaleTypeInvoiceInfo` (HKS)

| Alan                | Tip    | Zorunlu  | Açıklama                                       |
| ------------------- | ------ | -------- | ---------------------------------------------- |
| `tagNo`             | string | **Evet** | 19 karakter. Künye numarası.                   |
| `productOwnerName`  | string | —        | 2-255 karakter. Ürün sahibinin adı.            |
| `productOwnerTaxId` | TaxId  | —        | `^\\d{10,11}$`. Ürün sahibinin vergi numarası. |

---

### `totalTax` (Toplam Vergi Bilgileri) — **Zorunlu**

| Alan             | Tip   | Zorunlu  | Açıklama                                                     |
| ---------------- | ----- | -------- | ------------------------------------------------------------ |
| `totalTaxAmount` | int32 | **Evet** | Toplam vergi tutarı.                                         |
| `subTotalTaxes`  | array | **Evet** | Vergi türlerine göre kırılımlar (aynı yapı yukarıdaki gibi). |

---

### `totalWithholdingTax` (Tevkifat Bilgileri)

| Alan                  | Tip   | Zorunlu  | Açıklama                          |
| --------------------- | ----- | -------- | --------------------------------- |
| `totalTaxAmount`      | int64 | **Evet** | Toplam vergi tutarı.              |
| `subWithholdingTaxes` | array | —        | Ayrıştırılmış tevkifat bilgileri. |

**subWithholdingTaxes[]:**
| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `taxAmount` | int32 | **Evet** | Vergi tutarı. |
| `percent` | int32 | **Evet** | Vergi oranı. |
| `taxTypeCode` | string | **Evet** | Vergi kodu. |
| `name` | string | **Evet** | Vergi adı. |

---

### `invoiceTotal` (Fatura Toplam Tutarları) — **Zorunlu**

| Alan                   | Tip   | Zorunlu  | Açıklama                     |
| ---------------------- | ----- | -------- | ---------------------------- |
| `lineExtensionAmount`  | int32 | **Evet** | Toplam tutar.                |
| `taxExclusiveAmount`   | int32 | **Evet** | Vergiler hariç toplam tutar. |
| `taxInclusiveAmount`   | int32 | **Evet** | Vergiler dahil toplam tutar. |
| `payableAmount`        | int32 | **Evet** | Ödenecek toplam tutar.       |
| `allowanceTotalAmount` | int32 | —        | İndirimler toplamı.          |

---

### `dispatchInfos` (İrsaliye Bilgileri) — Array

| Alan           | Tip    | Zorunlu  | Açıklama                                                                   |
| -------------- | ------ | -------- | -------------------------------------------------------------------------- |
| `dispatchId`   | string | —        | İrsaliye numarası (16 haneli). Girilmezse varsayılan numaradan devam eder. |
| `dispatchDate` | date   | **Evet** | Sevk tarihi.                                                               |

---

### `orderInfo` (Sipariş Bilgileri)

| Alan        | Tip    | Zorunlu  | Açıklama          |
| ----------- | ------ | -------- | ----------------- |
| `orderId`   | string | **Evet** | Sipariş numarası. |
| `orderDate` | date   | **Evet** | Sipariş tarihi.   |

---

### `deliveryInfo` (Teslimat Bilgileri)

| Alan             | Tip    | Zorunlu  | Açıklama                           |
| ---------------- | ------ | -------- | ---------------------------------- |
| `carrierTaxId`   | TaxId  | **Evet** | `^\\d{10,11}$`. Taşıyıcı VKN/TCKN. |
| `carrierName`    | string | **Evet** | Taşıyıcı isim/ünvan.               |
| `carrierSurname` | string | —        | Taşıyıcı soyad.                    |
| `sentAt`         | date   | **Evet** | Taşıma tarihi.                     |

---

### `billingReference` (İade Fatura Bilgisi)

| Alan        | Tip                      | Zorunlu  | Açıklama                                            |
| ----------- | ------------------------ | -------- | --------------------------------------------------- |
| `invoiceId` | string                   | **Evet** | `^[A-Z0-9]{3}20[0-9]{2}[0-9]{9}$`. Fatura numarası. |
| `issueDate` | date                     | **Evet** | Fatura kesilme tarihi.                              |
| `typeCode`  | BillingReferenceTypeCode | —        | Varsayılan: `IADE`. `[IADE]`.                       |

### `billingReferences` (Çoklu İade Fatura Bilgisi) — Array

## Aynı yapı `billingReference` ile aynıdır.

### `bankInfo` (Banka Bilgileri) — Array

| Alan                   | Tip    | Zorunlu  | Açıklama                              |
| ---------------------- | ------ | -------- | ------------------------------------- |
| `bankName`             | string | **Evet** | 2-127 karakter. Banka ismi.           |
| `bankBranchOfficeName` | string | **Evet** | 2-127 karakter. Banka şube ismi.      |
| `accountType`          | string | **Evet** | 3 karakter. Hesap türü (Örn. TRY).    |
| `accountNumber`        | string | **Evet** | 3-63 karakter. Hesap numarası (IBAN). |
| `paymentNote`          | string | —        | Maks. 255 karakter. Ödeme notu.       |

---

### `marketplaceExpenses` (HKS KOMİSYONCU Masraf Bilgileri) — Array

| Alan     | Tip                    | Zorunlu  | Açıklama                                                                                                                                                                                                                                                                       |
| -------- | ---------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `type`   | MarketplaceExpenseType | **Evet** | `[HKSKOMISYON, HKSKOMISYONKDV, HKSNAVLUN, HKSNAVLUNKDV, HKSHAMMALIYE, HKSHAMMALIYEKDV, HKSNAKLIYE, HKSNAKLIYEKDV, HKSGVTEVKIFAT, HKSBAGKURTEVKIFAT, HKSRUSUM, HKSRUSUMKDV, HKSTICBORSASI, HKSTICBORSASIKDV, HKSMILLISAVUNMAFON, HKSMSFONKDV, HKSDIGERMASRAFLAR, HKSDIGERKDV]`. |
| `rate`   | number                 | —        | Masraf oranı.                                                                                                                                                                                                                                                                  |
| `amount` | number                 | **Evet** | Masraf tutarı.                                                                                                                                                                                                                                                                 |

---

### `chargeInfo` (SARJ ve SARJANLIK Faturaları)

| Alan                      | Tip       | Zorunlu  | Açıklama                                 |
| ------------------------- | --------- | -------- | ---------------------------------------- |
| `licensePlate`            | string    | **Evet** | Maks. 127 karakter. Araç plaka bilgisi.  |
| `startAt`                 | date-time | **Evet** | Şarj işlem başlama tarihi.               |
| `endAt`                   | date-time | **Evet** | Şarj işlem bitiş tarihi.                 |
| `vehicleIdentificationNo` | string    | —        | Maks. 17 karakter. Araç kimlik numarası. |
| `esuReportInfo`           | array     | —        | EŞÜ rapor bilgileri.                     |

**esuReportInfo[]:**
| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `id` | string | **Evet** | Maks. 127 karakter. EŞÜ rapor ID. |
| `date` | date | **Evet** | EŞÜ rapor oluşturma tarihi. |

---

### `paymentInfo` (Ödeme Bilgileri)

| Alan               | Tip          | Zorunlu | Açıklama                                            |
| ------------------ | ------------ | ------- | --------------------------------------------------- |
| `purchaseUrl`      | string       | —       | 2-255 karakter. Satın alınan web sitesi.            |
| `paymentAgentName` | string       | —       | Maks. 127 karakter. Ödeme aracısı ismi.             |
| `paymentType`      | string       | —       | Ödeme türü.                                         |
| `paymentDate`      | date-time    | —       | Ödeme tarihi.                                       |
| `paymentDueDate`   | date-time    | —       | Son ödeme tarihi.                                   |
| `paymentMeans`     | PaymentMeans | —       | `[CREDIT_CARD, EFT, ON_DELIVERY, MEDIATOR, OTHER]`. |
| `instructionNote`  | string       | —       | Ödeme notu.                                         |

---

### `publicInvoicePaymentInfo` (KAMU Faturaları Ödeme Bilgisi)

| Alan                   | Tip    | Zorunlu  | Açıklama                          |
| ---------------------- | ------ | -------- | --------------------------------- |
| `bankName`             | string | **Evet** | 2-127 karakter. Banka ismi.       |
| `bankBranchOfficeName` | string | **Evet** | 2-127 karakter. Banka şube ismi.  |
| `accountType`          | string | **Evet** | 3 karakter. Hesap türü.           |
| `accountNumber`        | string | **Evet** | 3-63 karakter. Hesap numarası.    |
| `payerTaxId`           | string | **Evet** | `^\\d{10}$`. Ödemeyi yapacak VKN. |

---

### `intermediaryInfo` (YOLCUBERABERFATURA Aracı Bilgisi)

| Alan          | Tip         | Zorunlu  | Açıklama                                       |
| ------------- | ----------- | -------- | ---------------------------------------------- |
| `taxId`       | TaxId       | **Evet** | `^\\d{10,11}$`. Aracı firmanın vergi numarası. |
| `title`       | string      | —        | Maks. 255 karakter. Aracı firmanın ünvanı.     |
| `alias`       | string      | **Evet** | Maks. 255 karakter. Aracı firmanın etiketi.    |
| `country`     | string      | —        | Maks. 255 karakter. Ülke bilgisi.              |
| `countryCode` | CountryCode | —        | Varsayılan: `TR`. Ülke kodu.                   |
| `city`        | string      | —        | Maks. 255 karakter. Şehir.                     |
| `district`    | string      | —        | Maks. 255 karakter. İlçe/Semt.                 |

---

## Responses

### 200 — Created Outgoing EInvoice Object

```json
{
  "id": 0,
  "autoInvoiceId": false,
  "currency": "string",
  "localReferenceId": "string",
  "gibStatusCode": 0,
  "invoiceUuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "invoiceId": "string",
  "prefix": "string",
  "year": 0,
  "rank": 0,
  "userId": 0,
  "source": "PORTAL",
  "status": 10,
  "gibStatus": "REPORTED",
  "taxExcludedPrice": 0,
  "taxAmount": 0,
  "discountAmount": 0,
  "price": 0,
  "payableAmount": 0,
  "taxInclusiveAmount": 0,
  "receiverName": "string",
  "receiverSurname": "string",
  "receiverTitle": "string",
  "receiverTaxId": "string",
  "scenario": "EARSIVFATURA",
  "invoiceTypeCode": "SATIS",
  "xsltCode": "string",
  "externalCancellationType": "KEP",
  "issuedAt": "2025-11-28T11:48:13.374Z",
  "createdAt": "2025-11-28T11:48:13.374Z",
  "lastUpdatedAt": "2025-11-28T11:48:13.374Z",
  "envelopeId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "targetAlias": "string",
  "replyNote": "string",
  "replyGibStatusCode": 0,
  "replyType": "APPROVED",
  "gtbRefNo": "string"
}
```

**Response Alanları:**
| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `id` | int64 | **Evet** | — |
| `autoInvoiceId` | boolean | — | Varsayılan: `false` |
| `currency` | string | **Evet** | 3 karakter. |
| `localReferenceId` | string | — | Maks. 127 karakter. |
| `gibStatusCode` | int32 | — | GİB durum kodu (E-Fatura ve E-İrsaliyeler için). |
| `invoiceUuid` | uuid | **Evet** | Fatura ETTN numarası. |
| `invoiceId` | string | **Evet** | Maks. 16 karakter. |
| `prefix` | Prefix | **Evet** | Maks. 3 karakter, `^[A-Z0-9]{3}$`. |
| `year` | int32 | **Evet** | — |
| `rank` | int32 | **Evet** | — |
| `userId` | int64 | **Evet** | — |
| `source` | Source | **Evet** | `[PORTAL, WEB, MOBILE, PARTNER]`. |
| `status` | Status | **Evet** | `[10, 20, 29, 30, 40, 50, 100, 105, 200, 205, 305, 405]`. Fatura Statü Kodları bölümünde açıklanmıştır. |
| `gibStatus` | GibStatus | — | `[REPORTED, READY_TO_BE_REPORTED]`. E-Arşiv faturaların GİB rapor durumu. |
| `taxExcludedPrice` | int64 | **Evet** | — |
| `taxAmount` | int64 | **Evet** | — |
| `discountAmount` | int64 | — | Varsayılan: `0`. |
| `price` | int64 | — | — |
| `payableAmount` | int64 | — | — |
| `taxInclusiveAmount` | int64 | — | — |
| `receiverName` | string | — | — |
| `receiverSurname` | string | — | — |
| `receiverTitle` | string | — | — |
| `receiverTaxId` | string | — | — |
| `scenario` | InvoiceType | **Evet** | — |
| `invoiceTypeCode` | InvoiceTypeCode | **Evet** | — |
| `xsltCode` | string | **Evet** | Maks. 127 karakter. |
| `externalCancellationType` | ExternalCancellationType | — | `[KEP, NOTARY, GIB_PORTAL]`. |
| `issuedAt` | date-time | — | — |
| `createdAt` | date-time | **Evet** | — |
| `lastUpdatedAt` | date-time | **Evet** | — |
| `envelopeId` | uuid | **Evet** | Zarf numarası (GİB tarafında kullanılan UUID). |
| `targetAlias` | string | **Evet** | Maks. 255 karakter. Alıcı etiket bilgisi. |
| `replyNote` | string | — | — |
| `replyGibStatusCode` | int32 | — | — |
| `replyType` | ResponseType | — | `[APPROVED, AUTO_APPROVED, DENIED, RETURNED]`. |
| `gtbRefNo` | string | — | Maks. 23 karakter. |

---

### 404 — Not Found

Olası hata tipleri: `TargetAliasNotFoundProblem`, `TaxPayerNotFoundProblem`, `InvoiceTaxIdNotFoundProblem`, `StylesheetWithCodeNotFoundProblem`, `ApplicationNotFoundProblem`, `CorporateNotFoundProblem`, `CorporatePrefixNotFoundProblem`, `CorporateDefaultPrefixNotFoundProblem`, `InvoiceAddressNotFoundProblem`.
| Alan | Tip | Açıklama |
|------|-----|----------|
| `message` | string | — |
| `title` | string | Kısa özet. |
| `status` | int32 | 100-599 arası HTTP durum kodu. |
| `detail` | string | Detaylı açıklama. |
| `instance` | uri-reference | Hatanın URI referansı. |

### 409 — Invoice Build Failed

Olası hata tipleri: `InvoiceUblBuildFailedProblem`, `InvoiceOperationRestrictedProblem`, `ApplicationMismatchProblem`, `InvoiceIdNotSetProblem`, `InvoiceIdAlreadyExistsProblem`, `InvoiceCouldNotBeSavedProblem`, `InvoiceUuidCantBeUsedProblem`, `CorporatePrefixIsUnusableProblem`, `InsufficientCreditProblem`, `ReceiverAndSenderEmailsAreSameProblem`, `ScenarioNotValidProblem`.

### 422 — UBL Validation Failed or Multiple Aliases Exist

Olası hata tipleri: `UBLValidationFailedProblem`, `MultipleAliasesExistProblem`, `ValidationProblem`.
`ValidationProblem` için ek `errors` alanı:
| Alan | Tip | Açıklama |
|------|-----|----------|
| `errors[].code` | string | — |
| `errors[].defaultMessage` | string | — |
| `errors[].field` | string | — |

### 500 — Stylesheet Can Not Be Applied

```json
{
  "code": "string",
  "type": "/problem/connection-error",
  "title": "Service Unavailable",
  "status": 503,
  "detail": "Connection to database timed out",
  "instance": "/problem/connection-error#token-info-read-timed-out"
}
```

### Default Error

```json
{
  "type": "/problem/connection-error",
  "title": "Service Unavailable",
  "status": 503,
  "detail": "Connection to database timed out",
  "instance": "/problem/connection-error#token-info-read-timed-out"
}
```

---

## Örnek Request Body (JSON)

```json
{
  "autoInvoiceId": true,
  "xsltCode": "string",
  "companyId": 0,
  "localReferenceId": "string",
  "prefix": "string",
  "userId": 0,
  "source": "PORTAL",
  "notes": ["string"],
  "recipientInfo": {
    "taxId": "string",
    "countryCode": "TR",
    "city": "string",
    "district": "string",
    "address": "string",
    "postalCode": "string",
    "phone": "string",
    "email": "user@example.com",
    "name": "string",
    "surname": "string",
    "taxOffice": "string",
    "passengerInfo": {
      "passportNo": "string",
      "passportIssueDate": "2025-11-28",
      "bankInformation": {
        "bankName": "string",
        "bankBranchOfficeName": "string",
        "accountType": "string",
        "accountNumber": "string",
        "paymentNote": "string"
      }
    }
  },
  "currencyInfo": {
    "currency": "TRY",
    "hasExchange": true,
    "calculationRate": 0,
    "sourceCurrency": "string",
    "targetCurrency": "string",
    "exchangeDate": "2025-11-28T11:48:13.323Z"
  },
  "invoiceInfo": {
    "invoiceType": "EARSIVFATURA",
    "invoiceTypeCode": "SATIS",
    "invoiceId": "string",
    "invoiceUuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  },
  "invoiceLines": [
    {
      "unitCode": "C62",
      "quantity": 0,
      "totalAmount": 0,
      "taxAmount": 0,
      "taxableAmount": 0,
      "taxPercent": 0,
      "taxName": "string",
      "taxCode": "string",
      "itemName": "string",
      "unitPriceAmount": 0,
      "totalDiscountAmount": 0,
      "withholdingTax": {
        "taxAmount": 0,
        "percent": 0,
        "taxTypeCode": "string",
        "name": "string"
      },
      "totalTax": {
        "totalTaxAmount": 0,
        "subTotalTaxes": [
          {
            "taxableAmount": 0,
            "taxAmount": 0,
            "taxType": "KDV",
            "percent": 0,
            "taxUnitPrice": 0,
            "name": "string",
            "taxExemptionReason": "string",
            "taxExemptionReasonCode": 0
          }
        ]
      },
      "exportInfo": {
        "delivery": {
          "city": "string",
          "country": "string",
          "deliveryTypeCode": "string"
        },
        "shipment": {
          "requiredCustomsId": "string",
          "transportMeanCode": "string",
          "packagingTypeCode": "string",
          "packagingQuantity": 0
        }
      },
      "originCode": "AF",
      "exportRegisteredAdditionalInfo": {
        "lineId": "string",
        "requiredCustomsId": "string"
      },
      "technologySupportInfo": {
        "technologySupportType": "TELEPHONE",
        "imei": "string",
        "imei2": "string",
        "imei3": "string"
      },
      "medicalInvoiceInfo": {
        "medicalProductType": "MEDICINE",
        "medicineAdditionalInfo": [
          {
            "gtinNo": "string",
            "batchNo": "string",
            "sequenceNo": "string",
            "expirationDate": "2025-11-28"
          }
        ],
        "medicalDeviceAdditionalInfo": [
          {
            "productNo": "string",
            "batchNo": "string",
            "sequenceNo": "string",
            "manufacturingDate": "2025-11-28"
          }
        ]
      },
      "marketplaceSaleTypeInvoiceInfo": {
        "tagNo": "string",
        "productOwnerName": "string",
        "productOwnerTaxId": "string"
      },
      "microExportRequiredCustomsId": "string",
      "chargeUnitSerialNo": "string"
    }
  ],
  "totalTax": {
    "totalTaxAmount": 0,
    "subTotalTaxes": [
      {
        "taxableAmount": 0,
        "taxAmount": 0,
        "taxType": "KDV",
        "percent": 0,
        "taxUnitPrice": 0,
        "name": "string",
        "taxExemptionReason": "string",
        "taxExemptionReasonCode": 0
      }
    ]
  },
  "totalWithholdingTax": {
    "totalTaxAmount": 0,
    "subWithholdingTaxes": [
      {
        "taxAmount": 0,
        "percent": 0,
        "taxTypeCode": "string",
        "name": "string"
      }
    ]
  },
  "invoiceTotal": {
    "lineExtensionAmount": 0,
    "taxExclusiveAmount": 0,
    "taxInclusiveAmount": 0,
    "payableAmount": 0,
    "allowanceTotalAmount": 0
  },
  "dispatchInfos": [
    {
      "dispatchId": "string",
      "dispatchDate": "2025-11-28"
    }
  ],
  "orderInfo": {
    "orderId": "string",
    "orderDate": "2025-11-28"
  },
  "issuedAt": "2025-11-28T11:48:13.323Z",
  "deliveryInfo": {
    "carrierTaxId": "string",
    "carrierName": "string",
    "carrierSurname": "string",
    "sentAt": "2025-11-28"
  },
  "billingReference": {
    "invoiceId": "string",
    "issueDate": "2025-11-28",
    "typeCode": "IADE"
  },
  "billingReferences": [
    {
      "invoiceId": "string",
      "issueDate": "2025-11-28",
      "typeCode": "IADE"
    }
  ],
  "bankInfo": [
    {
      "bankName": "string",
      "bankBranchOfficeName": "string",
      "accountType": "string",
      "accountNumber": "string",
      "paymentNote": "string"
    }
  ],
  "deliveryTypeCode": "string",
  "marketplaceExpenses": [
    {
      "type": "HKSKOMISYON",
      "rate": 0,
      "amount": 0
    }
  ],
  "chargeInfo": {
    "licensePlate": "string",
    "startAt": "2025-11-28T11:48:13.324Z",
    "endAt": "2025-11-28T11:48:13.324Z",
    "vehicleIdentificationNo": "string",
    "esuReportInfo": [
      {
        "id": "string",
        "date": "2025-11-28"
      }
    ]
  },
  "targetAlias": "string",
  "paymentInfo": {
    "purchaseUrl": "string",
    "paymentAgentName": "string",
    "paymentType": "string",
    "paymentDate": "2025-11-28T11:48:13.324Z",
    "paymentDueDate": "2025-11-28T11:48:13.324Z",
    "paymentMeans": "CREDIT_CARD",
    "instructionNote": "string"
  },
  "publicInvoicePaymentInfo": {
    "bankName": "string",
    "bankBranchOfficeName": "string",
    "accountType": "string",
    "accountNumber": "string",
    "payerTaxId": "string"
  },
  "intermediaryInfo": {
    "taxId": "string",
    "title": "string",
    "alias": "string",
    "country": "string",
    "countryCode": "TR",
    "city": "string",
    "district": "string"
  }
}
```
