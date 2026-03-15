"use client";

import { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { getUploadUrlAction } from "@/app/closet/actions";
import { toast } from "sonner";

interface PhotoUploadProps {
  onUpload: (url: string) => void;
  currentPhotoUrl?: string;
}

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function PhotoUpload({ onUpload, currentPhotoUrl }: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentPhotoUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Only JPG, PNG, and WebP images are supported.");
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("Image must be under 5MB.");
      return;
    }

    setUploading(true);
    try {
      const result = await getUploadUrlAction(file.name);
      if (!result.success) throw new Error(result.error);

      const { uploadUrl, publicUrl } = result.data as { uploadUrl: string; publicUrl: string };

      const res = await fetch(uploadUrl, { method: "PUT", body: file });
      if (!res.ok) throw new Error("Upload failed");

      setPreview(publicUrl);
      onUpload(publicUrl);
    } catch (e) {
      toast.error((e as Error).message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div
      className="relative flex flex-col items-center justify-center w-[150px] h-[150px] border-2 border-dashed border-muted-foreground/40 rounded-lg cursor-pointer hover:border-muted-foreground/70 transition-colors overflow-hidden"
      onClick={() => !uploading && inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      {uploading ? (
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      ) : preview ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Shoe photo" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <Upload className="h-6 w-6 text-white" />
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-2 text-muted-foreground px-3 text-center">
          <Upload className="h-8 w-8" />
          <span className="text-xs">Click or drag to upload</span>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
