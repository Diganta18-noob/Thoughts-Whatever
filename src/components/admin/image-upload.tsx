"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, Loader2, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  folder?: string;
  maxSizeMB?: number;
  aspectRatio?: number;
}

/** Client-side canvas compression helper */
async function compressImage(file: File, maxWidth = 1600, quality = 0.85): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".webp"), {
              type: "image/webp",
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          "image/webp",
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

export function ImageUpload({
  value,
  onChange,
  label = "Upload Image",
  folder = "covers",
  maxSizeMB = 10,
  aspectRatio,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(value || null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback(
    (file: File): string | null => {
      if (!file.type.startsWith("image/")) {
        return "File must be an image (JPEG, PNG, WebP, etc.)";
      }

      const maxSize = maxSizeMB * 1024 * 1024;
      if (file.size > maxSize) {
        return `File size must be less than ${maxSizeMB}MB`;
      }

      return null;
    },
    [maxSizeMB]
  );

  const uploadFile = useCallback(
    async (file: File) => {
      setUploading(true);
      setError("");

      try {
        // Compress image client-side before uploading
        const compressedFile = await compressImage(file);

        const formData = new FormData();
        formData.append("file", compressedFile);
        formData.append("folder", folder);

        const response = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });

        const contentType = response.headers.get("content-type") || "";
        let data: { ok?: boolean; url?: string; error?: string };

        if (contentType.includes("application/json")) {
          data = await response.json();
        } else {
          if (response.status === 401 || response.status === 403) {
            throw new Error("Session expired. Please refresh the page and sign in again.");
          }
          throw new Error(`Upload server error (${response.status}). Please try again.`);
        }

        if (!response.ok || !data.ok || !data.url) {
          throw new Error(data.error || "Upload failed");
        }

        setPreview(data.url);
        onChange(data.url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
        setPreview(null);
      } finally {
        setUploading(false);
      }
    },
    [folder, onChange]
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    await uploadFile(file);
  };

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);

      const file = e.dataTransfer.files?.[0];
      if (!file) return;

      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      await uploadFile(file);
    },
    [uploadFile, validateFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleRemove = () => {
    setPreview(null);
    onChange("");
    setError("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div>
      <label className="label block mb-2" lang="en">
        {label}
      </label>

      {preview ? (
        <div className="relative group">
          <div
            className="relative overflow-hidden rounded-sm border border-rule max-h-64"
            style={aspectRatio ? { aspectRatio: String(aspectRatio) } : undefined}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Preview"
              className="h-full w-full object-cover"
            />
          </div>

          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 rounded-full bg-red-500 p-1.5 text-white opacity-90 transition hover:opacity-100"
            title="Remove image"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="absolute top-2 left-2 rounded-full bg-green-500 p-1.5">
            <Check className="h-4 w-4 text-white" />
          </div>

          <input
            type="text"
            value={preview}
            readOnly
            className="mt-2 w-full rounded-sm border border-rule bg-surface-raised px-3 py-2 font-mono text-xs text-content-faint"
          />
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "relative cursor-pointer rounded-sm border-2 border-dashed p-8 text-center transition",
            dragActive
              ? "border-accent bg-accent/5"
              : "border-rule hover:border-accent/50 hover:bg-accent/5",
            uploading && "pointer-events-none opacity-50"
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
              <p className="text-sm text-content-soft">Optimizing & Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Upload className="h-8 w-8 text-content-faint" />
              <div>
                <p className="text-sm text-content">
                  <span className="text-accent">Click to upload</span> or drag and drop
                </p>
                <p className="mt-1 text-xs text-content-faint">
                  PNG, JPG, WebP up to {maxSizeMB}MB
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-2 flex items-center gap-2 text-xs text-red-500">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!preview && !uploading && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs text-content-faint hover:text-content">
            Or enter URL manually
          </summary>
          <input
            type="text"
            value={value || ""}
            onChange={(e) => {
              onChange(e.target.value);
              setPreview(e.target.value);
            }}
            placeholder="https://..."
            className="mt-2 w-full rounded-sm border border-rule bg-surface px-3 py-2 font-mono text-xs text-content"
          />
        </details>
      )}
    </div>
  );
}
