import { NextResponse } from "next/server";
import { headers } from "next/headers";
import bcrypt from "bcryptjs";
import { ZodError } from "zod";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { registerSchema } from "@/validations/auth";
import { sendWelcomeEmail, sendVerificationEmail } from "@/services/email.service";
import { createEmailVerificationToken } from "@/lib/verification";

export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim()
      || headersList.get("x-real-ip")
      || "127.0.0.1";

    const { success } = await rateLimit(`register:${ip}`, 5, 3600);
    if (!success) {
      return NextResponse.json(
        { error: "Çok fazla kayıt denemesi. Lütfen 1 saat sonra tekrar deneyin." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validated = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: validated.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Bu email adresi zaten kayıtlı" },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(validated.password, 12);

    // Create user
    const user = await db.user.create({
      data: {
        email: validated.email,
        name: validated.name,
        surname: validated.surname,
        phone: validated.phone || null,
        passwordHash,
        companyName: validated.companyName || null,
        taxNumber: validated.taxNumber || null,
        authProvider: "EMAIL",
      },
    });

    // Fire-and-forget: doğrulama emaili + hoşgeldin emaili
    if (user.email) {
      createEmailVerificationToken(user.email).then((token) => {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
        const verifyUrl = `${baseUrl}/email-dogrula/${token}`;
        sendVerificationEmail(user.email!, verifyUrl).catch((err) =>
          console.error("[email] Verification email failed:", err)
        );
      }).catch((err) => console.error("[email] Token creation failed:", err));

      sendWelcomeEmail(user.email, user.name).catch((err) =>
        console.error("[email] Welcome email failed:", err),
      );
    }

    return NextResponse.json(
      {
        message: "Kayıt başarılı",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          surname: user.surname,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Geçersiz veri", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Bir hata oluştu" },
      { status: 500 }
    );
  }
}
