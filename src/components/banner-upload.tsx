"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageCropper } from "@/components/image-cropper";
import { toast } from "sonner";

type BannerUploadProps = {
  currentUrl: string | null;
  entityType: "collection" | "event";
  entityId: string;
  onUploaded: (url: string | null) => void;
  className?: string;
};

export function BannerUpload({
  currentUrl,
  entityType,
  entityId,
  onUploaded,
  className,
}: BannerUploadProps) {
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
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB.");
      return;
    }

    // Show cropper immediately
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in.");

      const ext = croppedFile.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/${entityType}/${entityId}/banner.${ext}`;

      // Upload (upsert to overwrite previous)
      const { error: uploadErr } = await supabase.storage
        .from("banners")
        .upload(path, croppedFile, { upsert: true, contentType: "image/jpeg" });
      if (uploadErr) throw uploadErr;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage.from("banners").getPublicUrl(path);

      // Bust cache by appending timestamp
      const finalUrl = `${publicUrl}?t=${Date.now()}`;

      // Update the entity
      const table = entityType === "collection" ? "collections" : "events";
      const { error: updateErr } = await supabase
        .from(table)
        .update({ banner_url: finalUrl })
        .eq("id", entityId);
      if (updateErr) throw updateErr;

      onUploaded(finalUrl);
      toast.success("Banner updated!");
    } catch (err: any) {
      toast.error(err.message || "Upload failed.");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    setUploading(true);
    try {
      const table = entityType === "collection" ? "collections" : "events";
      const { error } = await supabase
        .from(table)
        .update({ banner_url: null })
        .eq("id", entityId);
      if (error) throw error;

      setPreview(null);
      onUploaded(null);
      toast.success("Banner removed.");
    } catch (err: any) {
      toast.error(err.message || "Couldn't remove banner.");
    } finally {
      setUploading(false);
    }
  }

  const displayUrl = preview ?? currentUrl;

  return (
    <div className={className}>
      {displayUrl ? (
        <div className="relative group rounded-lg overflow-hidden">
          <img
            src={displayUrl}
            alt="Banner"
            className="w-full h-32 object-cover"
          />
          {/* Overlay with actions */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Change"}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRemove}
              disabled={uploading}
              className="text-destructive hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Loader2 className="h-6 w-6 mkt-text animate-spin" />
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-full h-24 rounded-lg border-2 border-dashed border-muted-foreground/20 hover:border-primary/40 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground"
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <ImagePlus className="h-5 w-5" />
              <span className="text-xs">Add banner image</span>
            </>
          )}
        </button>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />

      {cropImageSrc && (
        <ImageCropper
          imageSrc={cropImageSrc}
          aspect={21 / 9}
          isOpen={!!cropImageSrc}
          onClose={() => setCropImageSrc(null)}
          onCropComplete={handleCropComplete}
          title="Crop Banner"
        />
      )}
    </div>
  );
}