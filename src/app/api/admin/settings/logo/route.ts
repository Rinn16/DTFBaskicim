import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { uploadToS3 } from "@/lib/s3";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("logo") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Sadece resim dosyaları kabul edilir" }, { status: 400 });
    }

    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "Logo dosyası 2MB'dan küçük olmalıdır" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop() || "png";
    const key = `settings/invoice-logo.${ext}`;

    await uploadToS3(key, buffer, file.type);

    const settings = await db.siteSettings.update({
      where: { id: "default" },
      data: { invoiceCompanyLogoKey: key },
    });

    return NextResponse.json({ settings, logoKey: key });
  } catch (error) {
    console.error("Logo upload error:", error);
    return NextResponse.json(
      { error: "Logo yüklenemedi" },
      { status: 500 },
    );
  }
}
