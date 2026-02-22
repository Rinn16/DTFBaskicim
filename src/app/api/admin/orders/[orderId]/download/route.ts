import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { s3Client, S3_BUCKET } from "@/lib/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";

const CONTENT_TYPES: Record<string, string> = {
  png: "image/png",
  tiff: "image/tiff",
  pdf: "application/pdf",
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const { orderId } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format");

    if (!format || !["png", "tiff", "pdf"].includes(format)) {
      return NextResponse.json(
        { error: "Geçersiz format. png, tiff veya pdf kullanın" },
        { status: 400 }
      );
    }

    const order = await db.order.findUnique({
      where: { id: orderId },
      select: {
        orderNumber: true,
        exportPng: true,
        exportTiff: true,
        exportPdf: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Sipariş bulunamadı" }, { status: 404 });
    }

    const keyMap: Record<string, string | null> = {
      png: order.exportPng,
      tiff: order.exportTiff,
      pdf: order.exportPdf,
    };

    const s3Key = keyMap[format];
    if (!s3Key) {
      return NextResponse.json(
        { error: "Bu format için export bulunamadı" },
        { status: 404 }
      );
    }

    // Stream file through API instead of presigned URL to avoid
    // browser sending cookies to MinIO (causes MetadataTooLarge)
    const response = await s3Client.send(
      new GetObjectCommand({ Bucket: S3_BUCKET, Key: s3Key })
    );

    const stream = response.Body as ReadableStream;
    const fileName = `${order.orderNumber}-gangsheet.${format}`;

    return new Response(stream, {
      headers: {
        "Content-Type": CONTENT_TYPES[format] || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        ...(response.ContentLength && { "Content-Length": String(response.ContentLength) }),
      },
    });
  } catch (error) {
    console.error("Admin download error:", error);
    return NextResponse.json({ error: "İndirme linki oluşturulamadı" }, { status: 500 });
  }
}
