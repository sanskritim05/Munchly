"use client";

import { ImageCropModal } from "@/components/ImageCropModal";

export function AvatarCropModal({
  imageSrc,
  onConfirm,
  onCancel,
}: {
  imageSrc: string;
  onConfirm: (file: File) => void;
  onCancel: () => void;
}) {
  return (
    <ImageCropModal
      imageSrc={imageSrc}
      onConfirm={onConfirm}
      onCancel={onCancel}
      shape="circle"
      filename="avatar.jpg"
    />
  );
}
