import crypto from "crypto";
import { db } from "@/lib/db";

export async function createEmailVerificationToken(email: string) {
  // Mevcut token'ları sil
  await db.verificationToken.deleteMany({
    where: { identifier: email },
  });

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 saat

  await db.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  });

  return token;
}
