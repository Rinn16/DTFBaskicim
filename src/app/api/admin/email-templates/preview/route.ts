import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { baseLayout, replaceVariables } from "@/lib/email-templates";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const { content, subject, type } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: "İçerik zorunlu" },
        { status: 400 },
      );
    }

    const sampleData: Record<string, string> = {
      musteriAdi: "Ahmet Yılmaz",
      siparisNo: "ORD-2024001",
      toplamTutar: "150.00",
      toplamMetre: "2.50",
      urunSayisi: "3",
      odemeTuru: "Kredi Kartı",
    };

    // WELCOME şablonu sadece musteriAdi kullanır, diğer veriler zaten sampleData'da

    const processedContent = replaceVariables(content, sampleData);
    const processedSubject = subject ? replaceVariables(subject, sampleData) : "";
    const html = baseLayout(processedContent);

    return NextResponse.json({ html, subject: processedSubject });
  } catch (error) {
    console.error("Email template preview error:", error);
    return NextResponse.json(
      { error: "Önizleme oluşturulamadı" },
      { status: 500 },
    );
  }
}
