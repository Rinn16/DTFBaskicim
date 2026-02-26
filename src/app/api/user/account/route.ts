import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const userId = session.user.id;

    // Aktif sipariş kontrolü
    const activeOrders = await db.order.count({
      where: {
        userId,
        status: { in: ["PROCESSING", "SHIPPED", "PENDING_PAYMENT"] },
      },
    });

    if (activeOrders > 0) {
      return NextResponse.json(
        { error: "Aktif siparişleriniz olduğu için hesabınız şu anda silinemez. Siparişleriniz tamamlandıktan sonra tekrar deneyin." },
        { status: 400 }
      );
    }

    // Kullanıcıyı anonimleştir (VUK gereği fatura verileri 10 yıl saklanır,
    // bu yüzden User kaydını silmek yerine anonimleştiriyoruz)
    const anonymizedEmail = `deleted_${userId}@anonymized.local`;

    await db.$transaction([
      // Kullanıcı profilini anonimleştir
      db.user.update({
        where: { id: userId },
        data: {
          email: anonymizedEmail,
          phone: null,
          name: "Silinmiş",
          surname: "Kullanıcı",
          passwordHash: null,
          companyName: null,
          taxNumber: null,
          image: null,
          billingFirstName: null,
          billingLastName: null,
          billingFullName: null,
          billingCompanyName: null,
          billingTaxOffice: null,
          billingTaxNumber: null,
          billingAddress: null,
          billingCity: null,
          billingDistrict: null,
          billingZipCode: null,
        },
      }),
      // Adreslerini sil
      db.address.deleteMany({ where: { userId } }),
      // Sepeti temizle
      db.cartItem.deleteMany({ where: { userId } }),
      // Taslakları sil
      db.designDraft.deleteMany({ where: { userId } }),
      // OAuth hesap bağlantılarını sil
      db.account.deleteMany({ where: { userId } }),
      // Oturumları sil
      db.session.deleteMany({ where: { userId } }),
    ]);

    return NextResponse.json({ message: "Hesabınız başarıyla silindi" });
  } catch (error) {
    console.error("Account deletion error:", error);
    return NextResponse.json({ error: "Hesap silinirken bir hata oluştu" }, { status: 500 });
  }
}
