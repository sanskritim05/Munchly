"use client";

import { useCallback, useRef, useState } from "react";
import { getCroppedAvatarBlob, getCroppedPlateBlob } from "@/lib/crop-image";

const VIEWPORT = 280;

export function ImageCropModal({
  imageSrc,
  onConfirm,
  onCancel,
  shape = "square",
  filename = "photo.jpg",
}: {
  imageSrc: string;
  onConfirm: (file: File) => void;
  onCancel: () => void;
  shape?: "circle" | "square";
  filename?: string;
}) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ w: 0, h: 0 });
  const [saving, setSaving] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(
    null
  );

  const baseScale =
    imageSize.w > 0 ? Math.max(VIEWPORT / imageSize.w, VIEWPORT / imageSize.h) : 1;
  const scale = baseScale * zoom;
  const imgW = imageSize.w * scale;
  const imgH = imageSize.h * scale;
  const imgX = (VIEWPORT - imgW) / 2 + position.x;
  const imgY = (VIEWPORT - imgH) / 2 + position.y;

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        originX: position.x,
        originY: position.y,
      };
    },
    [position]
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    setPosition({
      x: dragRef.current.originX + (e.clientX - dragRef.current.startX),
      y: dragRef.current.originY + (e.clientY - dragRef.current.startY),
    });
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    dragRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  }, []);

  async function handleConfirm() {
    setSaving(true);
    try {
      const blob =
        shape === "circle"
          ? await getCroppedAvatarBlob(imageSrc, position, zoom, VIEWPORT)
          : await getCroppedPlateBlob(imageSrc, position, zoom, VIEWPORT);
      onConfirm(new File([blob], filename, { type: "image/jpeg" }));
    } finally {
      setSaving(false);
    }
  }

  const viewportClass =
    shape === "circle" ? "rounded-full" : "rounded-2xl";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-center text-lg font-bold">Adjust photo</h2>
        <p className="mt-1 text-center text-sm text-gray-400">Drag to move, slide to zoom</p>

        <div
          className={`relative mx-auto mt-5 touch-none overflow-hidden bg-black ${viewportClass}`}
          style={{ width: VIEWPORT, height: VIEWPORT }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc}
            alt="Crop preview"
            draggable={false}
            onLoad={(e) => {
              const img = e.currentTarget;
              setImageSize({ w: img.naturalWidth, h: img.naturalHeight });
            }}
            className={`pointer-events-none absolute max-w-none select-none ${
              imageSize.w === 0 ? "opacity-0" : ""
            }`}
            style={{ width: imgW, height: imgH, left: imgX, top: imgY }}
          />
          <div
            className={`pointer-events-none absolute inset-0 ring-2 ring-white/30 ring-inset ${viewportClass}`}
          />
        </div>

        <label className="mt-5 block text-xs text-gray-400">
          Zoom
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="mt-2 w-full accent-hot"
          />
        </label>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="flex-1 rounded-full border border-border py-3 font-bold disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={saving || imageSize.w === 0}
            className="flex-1 rounded-full bg-hot py-3 font-bold disabled:opacity-50"
          >
            {saving ? "Saving..." : "Use photo"}
          </button>
        </div>
      </div>
    </div>
  );
}
