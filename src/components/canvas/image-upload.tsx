"use client";

import { useCallback, useRef } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UPLOAD, ROLL_CONFIG } from "@/lib/constants";
import { toast } from "sonner";
import { useCanvasStore } from "@/stores/canvas-store";
import { useUploadStore } from "@/stores/upload-store";
import type { UploadedImage } from "@/types/canvas";

async function uploadToS3(
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ key: string; url: string } | null> {
  try {
    // Get presigned URL
    const presignRes = await fetch("/api/upload/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      }),
    });

    if (!presignRes.ok) return null;

    const { url, fields, key } = await presignRes.json();

    // Upload to S3/MinIO with progress via XMLHttpRequest
    const formData = new FormData();
    Object.entries(fields).forEach(([k, v]) => formData.append(k, v as string));
    formData.append("file", file);

    const uploadOk = await new Promise<boolean>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => resolve(xhr.status >= 200 && xhr.status < 300 || xhr.status === 204);
      xhr.onerror = () => resolve(false);
      xhr.send(formData);
    });

    if (!uploadOk) return null;

    // Construct the object URL
    const objectUrl = `${url}/${key}`;
    return { key, url: objectUrl };
  } catch {
    return null;
  }
}

export function ImageUpload() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addUploadedImage = useCanvasStore((s) => s.addUploadedImage);

  const processFile = useCallback(
    async (file: File) => {
      // Validate type
      if (
        !UPLOAD.ALLOWED_TYPES.includes(
          file.type as (typeof UPLOAD.ALLOWED_TYPES)[number]
        )
      ) {
        toast.error("Desteklenmeyen dosya formatı. PNG, JPG, TIFF veya WebP yükleyin.");
        return;
      }

      // Validate size
      if (file.size > UPLOAD.MAX_FILE_SIZE) {
        toast.error("Dosya boyutu 50MB'dan büyük olamaz.");
        return;
      }

      const uploadId = `up-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const { addFile, updateProgress, removeFile } = useUploadStore.getState();
      addFile({ id: uploadId, fileName: file.name, progress: 0 });

      // Read image dimensions via blob URL
      const blobUrl = URL.createObjectURL(file);
      const img = new Image();

      img.onload = async () => {
        const widthPx = img.naturalWidth;
        const heightPx = img.naturalHeight;
        const widthCm = widthPx / ROLL_CONFIG.PX_PER_CM;
        const heightCm = heightPx / ROLL_CONFIG.PX_PER_CM;

        // Create a base64 thumbnail for localStorage persistence
        const thumbCanvas = document.createElement("canvas");
        const MAX_THUMB = 512;
        const scale = Math.min(MAX_THUMB / widthPx, MAX_THUMB / heightPx, 1);
        thumbCanvas.width = Math.round(widthPx * scale);
        thumbCanvas.height = Math.round(heightPx * scale);
        const ctx = thumbCanvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, thumbCanvas.width, thumbCanvas.height);
        }
        const persistedThumbnail = thumbCanvas.toDataURL("image/png");

        // Upload to S3 with progress tracking
        const s3Result = await uploadToS3(file, (percent) => {
          updateProgress(uploadId, percent);
        });

        removeFile(uploadId);

        if (!s3Result) {
          URL.revokeObjectURL(blobUrl);
          toast.error("Görsel yüklenemedi. Lütfen tekrar deneyin.");
          return;
        }

        const uploadedImage: UploadedImage = {
          id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          file,
          imageKey: s3Result.key,
          imageName: file.name,
          thumbnailUrl: blobUrl,
          originalUrl: s3Result.url,
          widthPx,
          heightPx,
          widthCm: Math.round(widthCm * 100) / 100,
          heightCm: Math.round(heightCm * 100) / 100,
          persistedThumbnail,
        };

        addUploadedImage(uploadedImage);
      };

      img.onerror = () => {
        removeFile(uploadId);
        URL.revokeObjectURL(blobUrl);
        toast.error("Dosya okunamadı. Lütfen geçerli bir görsel dosyası yükleyin.");
      };

      img.src = blobUrl;
    },
    [addUploadedImage]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const files = Array.from(e.dataTransfer.files);
      files.forEach(processFile);
    },
    [processFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      files.forEach(processFile);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [processFile]
  );

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="border-2 border-dashed border-slate-600/40 rounded-lg p-6 text-center hover:border-cyan-400/50 transition-colors cursor-pointer"
      onClick={() => fileInputRef.current?.click()}
    >
      <Upload className="mx-auto h-8 w-8 text-slate-500 mb-2" />
      <p className="text-sm text-slate-400">
        Tasarımlarınızı sürükleyip bırakın
      </p>
      <p className="text-xs text-slate-500 mt-1">
        PNG, JPG, TIFF, WebP (max 50MB)
      </p>
      <Button
        variant="outline"
        size="sm"
        className="mt-3 text-slate-200"
        onClick={(e) => {
          e.stopPropagation();
          fileInputRef.current?.click();
        }}
      >
        Dosya Seç
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/tiff,image/webp"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}
