"use client";

import { useCallback, useState } from "react";
import { Upload, Camera, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UploadedImage {
  file: File;
  preview: string;
  converting?: boolean;
  convertedKey?: string;
  convertedUrl?: string;
}

interface PhotoUploadProps {
  onImagesReady: (images: { key: string; url: string }[]) => void;
  maxImages?: number;
}

export function PhotoUpload({ onImagesReady, maxImages = 5 }: PhotoUploadProps) {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const isHeic = (file: File) =>
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    /\.heic$/i.test(file.name) ||
    /\.heif$/i.test(file.name);

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      const newImages: UploadedImage[] = [];
      const fileArray = Array.from(files);

      for (const file of fileArray) {
        if (images.length + newImages.length >= maxImages) break;
        if (!file.type.startsWith("image/") && !isHeic(file)) continue;

        if (isHeic(file)) {
          newImages.push({ file, preview: "", converting: true });
        } else {
          newImages.push({ file, preview: URL.createObjectURL(file) });
        }
      }

      setImages((prev) => [...prev, ...newImages]);

      // Convert HEIC files in background for instant preview
      for (const img of newImages) {
        if (!img.converting) continue;
        try {
          const form = new FormData();
          form.append("file", img.file);
          const res = await fetch("/api/upload/convert", {
            method: "POST",
            body: form,
          });
          if (!res.ok) throw new Error("Conversion failed");
          const { key, publicUrl } = await res.json();
          setImages((prev) =>
            prev.map((existing) =>
              existing.file === img.file
                ? { ...existing, preview: publicUrl, converting: false, convertedKey: key, convertedUrl: publicUrl }
                : existing
            )
          );
        } catch {
          // Remove failed HEIC image
          setImages((prev) => prev.filter((existing) => existing.file !== img.file));
        }
      }
    },
    [images.length, maxImages]
  );

  const removeImage = (index: number) => {
    setImages((prev) => {
      const next = [...prev];
      URL.revokeObjectURL(next[index].preview);
      next.splice(index, 1);
      return next;
    });
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const convertHeic = async (file: File): Promise<{ key: string; url: string }> => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/upload/convert", {
      method: "POST",
      body: form,
    });
    if (!res.ok) throw new Error("HEIC conversion failed");
    const { key, publicUrl } = await res.json();
    return { key, url: publicUrl };
  };

  const handleUpload = async () => {
    setUploading(true);
    try {
      const uploaded: { key: string; url: string }[] = [];

      // Try S3 upload first, fall back to base64
      const s3Configured = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: images[0].file.name,
          contentType: images[0].file.type,
        }),
      }).then((r) => r.ok).catch(() => false);

      for (const img of images) {
        if (isHeic(img.file)) {
          if (img.convertedKey && img.convertedUrl) {
            // Already converted during preview
            uploaded.push({ key: img.convertedKey, url: img.convertedUrl });
          } else {
            uploaded.push(await convertHeic(img.file));
          }
        } else if (s3Configured) {
          const res = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              filename: img.file.name,
              contentType: img.file.type,
            }),
          });
          const { presignedUrl, key, publicUrl } = await res.json();
          await fetch(presignedUrl, {
            method: "PUT",
            body: img.file,
            headers: { "Content-Type": img.file.type },
          });
          uploaded.push({ key, url: publicUrl });
        } else {
          // No S3 — convert to base64 data URL
          const dataUrl = await fileToBase64(img.file);
          uploaded.push({ key: `local-${uploaded.length}`, url: dataUrl });
        }
      }

      onImagesReady(uploaded);
    } catch (error) {
      console.error("Upload error:", error);
      // Last resort fallback to base64 (HEIC won't work here but other formats will)
      const fallback: { key: string; url: string }[] = [];
      for (let i = 0; i < images.length; i++) {
        if (isHeic(images[i].file)) continue;
        const dataUrl = await fileToBase64(images[i].file);
        fallback.push({ key: `local-${i}`, url: dataUrl });
      }
      onImagesReady(fallback);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragOver
            ? "border-amber-500 bg-amber-50"
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          addFiles(e.dataTransfer.files);
        }}
      >
        <div className="space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <Upload className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">Drop jewelry photos here</p>
            <p className="text-sm text-muted-foreground mt-1">
              or click to browse. Up to {maxImages} images (JPG, PNG, WebP, HEIC)
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "image/*";
                input.multiple = true;
                input.onchange = (e) => {
                  const target = e.target as HTMLInputElement;
                  if (target.files) addFiles(target.files);
                };
                input.click();
              }}
            >
              <Upload className="h-4 w-4 mr-2" />
              Browse Files
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "image/*";
                input.capture = "environment";
                input.onchange = (e) => {
                  const target = e.target as HTMLInputElement;
                  if (target.files) addFiles(target.files);
                };
                input.click();
              }}
            >
              <Camera className="h-4 w-4 mr-2" />
              Take Photo
            </Button>
          </div>
        </div>
      </div>

      {/* Preview grid */}
      {images.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {images.map((img, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden border">
                {img.converting ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={img.preview}
                    alt={`Jewelry photo ${i + 1}`}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
                <button
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white hover:bg-black/70"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>

          <Button
            onClick={handleUpload}
            disabled={uploading || images.some((img) => img.converting)}
            className="w-full"
            size="lg"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>Start Appraisal ({images.length} photo{images.length !== 1 ? "s" : ""})</>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
