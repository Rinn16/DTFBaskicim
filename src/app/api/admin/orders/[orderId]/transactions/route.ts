import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

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
    const transactions = await db.paymentTransaction.findMany({
      where: { orderId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error("Transactions GET error:", error);
    return NextResponse.json({ error: "İşlem geçmişi yüklenemedi" }, { status: 500 });
  }
}
