"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Camera } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ImageCropper } from "@/components/image-cropper";
import { toast } from "sonner";

type AvatarUploadProps = {
  currentUrl: string | null;
  displayName: string;
  onUploaded: (url: string) => void;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "h-16 w-16",
  md: "h-24 w-24",
  lg: "h-32 w-32",
};

export function AvatarUpload({
  currentUrl,
  displayName,
  onUploaded,
  size = "md",
}: AvatarUploadProps) {
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2 MB.");
      return;
    }

    // Show cropper
    const objectUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setCropImageSrc(objectUrl);
  }

  async function handleCropComplete(croppedBlob: Blob) {
    setCropImageSrc(null);
    if (!selectedFile) return;

    const croppedFile = new File([croppedBlob], selectedFile.name, { type: "image/jpeg" });
    const previewUrl = URL.createObjectURL(croppedBlob);
    setPreview(previewUrl);

    setUploading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in.");

      const ext = croppedFile.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/avatar.${ext}`;

      // Upload (upsert to overwrite previous)
      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(path, croppedFile, { upsert: true, contentType: "image/jpeg" });
      if (uploadErr) throw uploadErr;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);

      // Bust cache by appending timestamp
      const finalUrl = `${publicUrl}?t=${Date.now()}`;

      // Update user profile
      const { error: updateErr } = await supabase
        .from("users")
        .update({ avatar_url: finalUrl })
        .eq("id", user.id);
      if (updateErr) throw updateErr;

      onUploaded(finalUrl);
      toast.success("Avatar updated!");
    } catch (err: any) {
      toast.error(err.message || "Upload failed.");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  }

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative group">
        <Avatar className={`${sizeClasses[size]} border-2 border-primary/20`}>
          <AvatarImage src={preview ?? currentUrl ?? undefined} />
          <AvatarFallback className="text-lg bg-primary/10 text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>

        {/* Overlay button */}
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 group-hover:bg-black/40 transition-colors cursor-pointer"
        >
          <Camera className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />

      <Button
        variant="outline"
        size="sm"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? "Uploading..." : currentUrl ? "Change photo" : "Add photo"}
      </Button>

      {cropImageSrc && (
        <ImageCropper
          imageSrc={cropImageSrc}
          aspect={1}
          isOpen={!!cropImageSrc}
          onClose={() => setCropImageSrc(null)}
          onCropComplete={handleCropComplete}
          title="Crop Avatar"
        />
      )}
    </div>
  );
}