"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { AppIcon } from "@/components/AppIcon";
import { AvatarCropModal } from "@/components/AvatarCropModal";

export function AvatarPicker({
  preview,
  onChange,
  size = 96,
  allowRemove = false,
  disabled = false,
}: {
  preview: string | null;
  onChange: (file: File | null, previewUrl: string | null) => void;
  size?: number;
  allowRemove?: boolean;
  disabled?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropSrc(URL.createObjectURL(file));
    if (fileRef.current) fileRef.current.value = "";
  }

  function onCropConfirm(file: File) {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    onChange(file, URL.createObjectURL(file));
  }

  function onCropCancel() {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  }

  function removePhoto() {
    onChange(null, null);
  }

  return (
    <>
      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => fileRef.current?.click()}
          className="relative flex items-center justify-center overflow-hidden rounded-full border border-dashed border-border bg-black disabled:opacity-50"
          style={{ width: size, height: size }}
          aria-label={preview ? "Change profile photo" : "Add profile photo"}
        >
          {preview ? (
            <Image
              src={preview}
              alt="Profile preview"
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <AppIcon kind="profile" size={Math.round(size * 0.65)} />
          )}
        </button>
        <p className="text-xs text-gray-500">
          {preview ? "Tap to change photo" : "Optional. Tap to add photo"}
        </p>
        {allowRemove && preview ? (
          <button
            type="button"
            onClick={removePhoto}
            className="text-xs text-gray-400 hover:text-hot"
          >
            Remove photo
          </button>
        ) : null}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChange}
      />
      {cropSrc ? (
        <AvatarCropModal
          imageSrc={cropSrc}
          onConfirm={onCropConfirm}
          onCancel={onCropCancel}
        />
      ) : null}
    </>
  );
}
