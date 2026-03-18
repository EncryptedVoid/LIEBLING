"use client";

import { useState, useCallback, useRef } from "react";
import Cropper from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { RotateCw } from "lucide-react";

export interface Point {
  x: number;
  y: number;
}

export interface Area {
  width: number;
  height: number;
  x: number;
  y: number;
}

type ImageCropperDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string | null;
  onCropComplete: (croppedFile: File, previewUrl: string) => void;
  aspectRatio?: number;
};

// Utility to create the cropped image
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.src = url;
  });

function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180;
}

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0
): Promise<{ file: File; url: string }> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  // calculate bounding box of the rotated image
  const boundingBoxWidth =
    Math.abs(Math.cos(getRadianAngle(rotation)) * image.width) +
    Math.abs(Math.sin(getRadianAngle(rotation)) * image.height);
  const boundingBoxHeight =
    Math.abs(Math.sin(getRadianAngle(rotation)) * image.width) +
    Math.abs(Math.cos(getRadianAngle(rotation)) * image.height);

  // set canvas size to match the bounding box
  canvas.width = boundingBoxWidth;
  canvas.height = boundingBoxHeight;

  // translate canvas context to a central location to allow rotating and flipping around the center
  ctx.translate(boundingBoxWidth / 2, boundingBoxHeight / 2);
  ctx.rotate(getRadianAngle(rotation));
  ctx.translate(-image.width / 2, -image.height / 2);

  // draw rotated image
  ctx.drawImage(image, 0, 0);

  // extracted cropped image
  const data = ctx.getImageData(
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height
  );

  // set canvas width to final desired crop size - this will clear existing context
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // paste generated rotate image at the top left corner
  ctx.putImageData(data, 0, 0);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) throw new Error("Canvas is empty");
      const url = URL.createObjectURL(blob);
      const file = new File([blob], "cropped.jpeg", { type: "image/jpeg" });
      resolve({ file, url });
    }, "image/jpeg");
  });
}

export function ImageCropperDialog({
  open,
  onOpenChange,
  imageSrc,
  onCropComplete,
  aspectRatio = 16 / 9,
}: ImageCropperDialogProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCropCompleteHandler = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setProcessing(true);
    try {
      const { file, url } = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      onCropComplete(file, url);
      onOpenChange(false);
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Crop Image</DialogTitle>
        </DialogHeader>

        {imageSrc ? (
          <div className="space-y-6">
            <div className="relative h-64 w-full sm:h-80 bg-black rounded-lg overflow-hidden">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={aspectRatio}
                onCropChange={setCrop}
                onCropComplete={onCropCompleteHandler}
                onZoomChange={setZoom}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium w-12">Zoom</span>
                <Slider
                  min={1}
                  max={3}
                  step={0.1}
                  value={[zoom]}
                  onValueChange={(v: number[]) => setZoom(v[0])}
                  className="flex-1"
                />
              </div>

              <div className="flex items-center gap-4">
                <span className="text-sm font-medium w-12">Rotate</span>
                <Slider
                  min={0}
                  max={360}
                  step={1}
                  value={[rotation]}
                  onValueChange={(v: number[]) => setRotation(v[0])}
                  className="flex-1"
                />
                <Button variant="outline" size="icon" onClick={() => setRotation((r) => (r + 90) % 360)}>
                  <RotateCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={processing}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={processing}>
                {processing ? "Saving..." : "Apply"}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="py-12 text-center text-muted-foreground">No image provided</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
