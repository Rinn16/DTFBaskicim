import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { exportQueue } from "@/lib/queue";

export async function POST(
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
      select: { id: true, orderNumber: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Sipariş bulunamadı" }, { status: 404 });
    }

    await exportQueue.add(`export-${order.orderNumber}`, {
      orderId: order.id,
      orderNumber: order.orderNumber,
    });

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
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Sipariş bulunamadı" }, { status: 404 });
    }

    const hasExports = !!(order.exportPng && order.exportTiff && order.exportPdf);

    return NextResponse.json({
      hasExports,
      status: order.status,
      exports: hasExports
        ? {
            png: order.exportPng,
            tiff: order.exportTiff,
            pdf: order.exportPdf,
          }
        : null,
    });
  } catch (error) {
    console.error("Admin export status error:", error);
    return NextResponse.json({ error: "Durum alınamadı" }, { status: 500 });
  }
}
