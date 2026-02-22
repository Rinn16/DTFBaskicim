import { NextResponse } from "next/server";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { auth } from "@/lib/auth";
import { s3Client, S3_BUCKET } from "@/lib/s3";
import { rateLimit } from "@/lib/rate-limit";
import { UPLOAD } from "@/lib/constants";

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    // Use userId for authenticated users, IP for guests
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";
    const rateLimitKey = userId ? `upload:${userId}` : `upload:guest-ip:${ip}`;

    const { success } = await rateLimit(rateLimitKey, 20, 3600);
    if (!success) {
      return NextResponse.json(
        { error: "Çok fazla yükleme denemesi. Lütfen daha sonra tekrar deneyin." },
        { status: 429 }
      );
    }

    const { fileName, fileType, fileSize } = await request.json();

    if (!fileName || !fileType) {
      return NextResponse.json(
        { error: "Dosya adı ve tipi gerekli" },
        { status: 400 }
      );
    }

    // Validate file type
    if (
      !UPLOAD.ALLOWED_TYPES.includes(
        fileType as (typeof UPLOAD.ALLOWED_TYPES)[number]
      )
    ) {
      return NextResponse.json(
        { error: "Desteklenmeyen dosya formatı. PNG, JPG, TIFF veya WebP yükleyin." },
        { status: 400 }
      );
    }

    // Validate file size
    if (fileSize && fileSize > UPLOAD.MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Dosya boyutu 50MB'dan büyük olamaz" },
        { status: 400 }
      );
    }

    // Generate unique key — authenticated users get their folder, guests get shared folder
    const ext = fileName.split(".").pop() || "png";
    const folder = userId ? `uploads/${userId}` : "uploads/guest";
    const key = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const presignedPost = await createPresignedPost(s3Client, {
      Bucket: S3_BUCKET,
      Key: key,
      Conditions: [
        ["content-length-range", 0, UPLOAD.MAX_FILE_SIZE],
        ["starts-with", "$Content-Type", "image/"],
      ],
      Fields: {
        "Content-Type": fileType,
      },
      Expires: UPLOAD.PRESIGN_EXPIRY,
    });

    // Replace internal Docker hostname with public URL for browser access
    const publicS3Url = process.env.S3_PUBLIC_URL || presignedPost.url;
    const url = presignedPost.url.replace(
      process.env.S3_ENDPOINT!,
      publicS3Url
    );

    return NextResponse.json({
      url,
      fields: presignedPost.fields,
      key,
    });
  } catch (error) {
    console.error("Presign error:", error);
    return NextResponse.json(
      { error: "Yükleme hazırlığı başarısız" },
      { status: 500 }
    );
  }
}
