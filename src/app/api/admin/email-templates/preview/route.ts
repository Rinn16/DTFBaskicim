import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getBaseUrl } from "@/lib/utils";
import { baseLayout, replaceVariables } from "@/lib/email-templates";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const { content, subject } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: "İçerik zorunlu" },
        { status: 400 },
      );
    }

    // Sample item rows HTML for preview
    const sampleItemsHtml = `<tr>
  <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td width="48" valign="top">
        <div style="width:44px;height:44px;background-color:#e2e8f0;border-radius:8px;text-align:center;line-height:44px;font-size:18px;color:#94a3b8;">&#9113;</div>
      </td>
      <td style="padding-left:12px;" valign="middle">
        <p style="margin:0;font-weight:700;color:#1e293b;font-size:14px;font-family:'Manrope',Arial,sans-serif;">DTF Metraj Baskı (56cm)</p>
        <p style="margin:2px 0 0;font-size:11px;color:#64748b;font-family:'Courier New',monospace;">Dosya: tshirt_design_v2.png</p>
      </td>
      <td width="80" align="right" valign="middle">
        <span style="font-size:13px;font-weight:500;color:#475569;background-color:#f1f5f9;padding:4px 8px;border-radius:4px;font-family:'Manrope',Arial,sans-serif;">5 Adet</span>
      </td>
    </tr></table>
  </td>
</tr>
<tr>
  <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td width="48" valign="top">
        <div style="width:44px;height:44px;background-color:#e2e8f0;border-radius:8px;text-align:center;line-height:44px;font-size:18px;color:#94a3b8;">&#9113;</div>
      </td>
      <td style="padding-left:12px;" valign="middle">
        <p style="margin:0;font-weight:700;color:#1e293b;font-size:14px;font-family:'Manrope',Arial,sans-serif;">DTF Metraj Baskı (56cm)</p>
        <p style="margin:2px 0 0;font-size:11px;color:#64748b;font-family:'Courier New',monospace;">Dosya: logo_badge.png</p>
      </td>
      <td width="80" align="right" valign="middle">
        <span style="font-size:13px;font-weight:500;color:#475569;background-color:#f1f5f9;padding:4px 8px;border-radius:4px;font-family:'Manrope',Arial,sans-serif;">3 Adet</span>
      </td>
    </tr></table>
  </td>
</tr>`;

    const sampleData: Record<string, string> = {
      musteriAdi: "Ahmet Yılmaz",
      siparisNo: "DTF-250224-A1B2C3",
      toplamTutar: "1.250,00",
      toplamMetre: "2.50",
      urunSayisi: "2",
      odemeTuru: "Kredi Kartı",
      siparisTarihi: "24 Şubat 2025",
      urunListesi: sampleItemsHtml,
      teslimatAdresi: "Teknoloji Mah. Sanayi Cad. No: 42<br/>Şişli / İstanbul",
      siparisDetayUrl: `${getBaseUrl()}/hesabim/siparisler`,
      kargoUcreti: "49,90",
      takipKodu: "TR12345678901",
      siteUrl: getBaseUrl(),
    };

    const processedContent = replaceVariables(content, sampleData);
    const processedSubject = subject ? replaceVariables(subject, sampleData) : "";

    // If template is full HTML, use as-is; otherwise wrap in baseLayout
    const html = processedContent.includes("</html>")
      ? processedContent
      : baseLayout(processedContent);

    return NextResponse.json({ html, subject: processedSubject });
  } catch (error) {
    console.error("Email template preview error:", error);
    return NextResponse.json(
      { error: "Önizleme oluşturulamadı" },
      { status: 500 },
    );
  }
}
