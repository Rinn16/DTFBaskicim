import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { exportQueue } from "@/lib/queue";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const { orderId } = await params;
    const body = await request.json().catch(() => ({}));
    const gangSheetId = body.gangSheetId as string | undefined;

    const order = await db.order.findUnique({
      where: { id: orderId },
      select: { id: true, orderNumber: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Sipariş bulunamadı" }, { status: 404 });
    }

    // Belirli bir gang sheet veya tümü
    if (gangSheetId) {
      const gangSheet = await db.orderGangSheet.findFirst({
        where: { id: gangSheetId, orderId },
      });
      if (!gangSheet) {
        return NextResponse.json({ error: "Gang sheet bulunamadı" }, { status: 404 });
      }

      await exportQueue.add(`export-${order.orderNumber}-${gangSheetId}`, {
        orderId: order.id,
        orderNumber: order.orderNumber,
        gangSheetId,
      });
    } else {
      await exportQueue.add(`export-${order.orderNumber}`, {
        orderId: order.id,
        orderNumber: order.orderNumber,
      });
    }

    return NextResponse.json({ message: "Export işi kuyruğa eklendi" });
  } catch (error) {
    console.error("Admin export trigger error:", error);
    return NextResponse.json({ error: "Export başlatılamadı" }, { status: 500 });
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const { orderId } = await params;

    const order = await db.order.findUnique({
      where: { id: orderId },
      select: {
        exportPng: true,
        exportTiff: true,
        exportPdf: true,
        status: true,
        gangSheets: {
          select: {
            id: true,
            exportPng: true,
            exportTiff: true,
            exportPdf: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Sipariş bulunamadı" }, { status: 404 });
    }

    const hasLegacyExports = !!(order.exportPng && order.exportTiff && order.exportPdf);

    const gangSheetExports = order.gangSheets.map((gs) => ({
      id: gs.id,
      hasExports: !!(gs.exportPng && gs.exportTiff && gs.exportPdf),
      exports: gs.exportPng
        ? { png: gs.exportPng, tiff: gs.exportTiff, pdf: gs.exportPdf }
        : null,
    }));

    return NextResponse.json({
      hasExports: hasLegacyExports || gangSheetExports.some((gs) => gs.hasExports),
      status: order.status,
      exports: hasLegacyExports
        ? {
            png: order.exportPng,
            tiff: order.exportTiff,
            pdf: order.exportPdf,
          }
        : null,
      gangSheets: gangSheetExports,
    });
  } catch (error) {
    console.error("Admin export status error:", error);
    return NextResponse.json({ error: "Durum alınamadı" }, { status: 500 });
  }
}
