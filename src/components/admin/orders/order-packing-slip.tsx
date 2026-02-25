"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface PackingSlipProps {
  orderNumber: string;
  orderDate: string;
  customerName: string;
  address: {
    fullName: string;
    phone: string;
    address: string;
    district: string;
    city: string;
    zipCode: string | null;
  } | null;
  items: { imageName: string; quantity: number }[];
  totalMeters: number;
  trackingCode: string | null;
  companyName?: string;
}

export function PackingSlipButton(props: PackingSlipProps) {
  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=400,height=600");
    if (!printWindow) return;

    const itemsHtml = props.items
      .map(
        (item) =>
          `<tr><td style="padding:4px 8px;border-bottom:1px solid #eee">${item.imageName}</td><td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td></tr>`
      )
      .join("");

    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Sevk Fisi - ${props.orderNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; color: #333; }
    h2 { margin: 0 0 5px 0; font-size: 16px; }
    .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 15px; }
    .section { margin-bottom: 15px; }
    .section-title { font-weight: bold; font-size: 11px; text-transform: uppercase; color: #666; margin-bottom: 5px; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 4px 8px; border-bottom: 2px solid #333; font-size: 11px; }
    .footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #ccc; font-size: 10px; color: #999; }
    @media print { body { margin: 10mm; } }
  </style>
</head>
<body>
  <div class="header">
    <h2>SEVK FISI</h2>
    <div style="display:flex;justify-content:space-between">
      <span>Siparis No: <strong>${props.orderNumber}</strong></span>
      <span>Tarih: ${new Date(props.orderDate).toLocaleDateString("tr-TR")}</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Teslimat Bilgileri</div>
    ${props.address ? `
    <p style="margin:2px 0"><strong>${props.address.fullName}</strong></p>
    <p style="margin:2px 0">${props.address.address}</p>
    <p style="margin:2px 0">${props.address.district}/${props.address.city}${props.address.zipCode ? " " + props.address.zipCode : ""}</p>
    <p style="margin:2px 0">Tel: ${props.address.phone}</p>
    ` : `<p>${props.customerName}</p>`}
  </div>

  ${props.trackingCode ? `
  <div class="section">
    <div class="section-title">Kargo Takip</div>
    <p style="font-size:14px;font-weight:bold">${props.trackingCode}</p>
  </div>
  ` : ""}

  <div class="section">
    <div class="section-title">Urunler</div>
    <table>
      <thead>
        <tr><th>Gorsel</th><th style="text-align:center">Adet</th></tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
    </table>
    <p style="margin-top:8px"><strong>Toplam: ${props.totalMeters.toFixed(2)} metre</strong></p>
  </div>

  <div class="footer">
    ${props.companyName || "DTF Baskicim"}
  </div>

  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <Button
      size="sm"
      variant="outline"
      className="gap-1.5"
      onClick={handlePrint}
    >
      <Printer className="h-3.5 w-3.5" />
      Sevk Fişi Yazdır
    </Button>
  );
}
