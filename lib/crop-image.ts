function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

async function renderCrop(
  imageSrc: string,
  position: { x: number; y: number },
  zoom: number,
  viewportSize: number,
  outputSize: number,
  shape: "circle" | "square"
): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  const scaleFactor = outputSize / viewportSize;
  const baseScale = Math.max(viewportSize / image.width, viewportSize / image.height);
  const scale = baseScale * zoom * scaleFactor;
  const w = image.width * scale;
  const h = image.height * scale;
  const x = (outputSize - w) / 2 + position.x * scaleFactor;
  const y = (outputSize - h) / 2 + position.y * scaleFactor;

  if (shape === "circle") {
    ctx.beginPath();
    ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
  }

  ctx.drawImage(image, x, y, w, h);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Crop failed"))),
      "image/jpeg",
      0.92
    );
  });
}

export async function getCroppedAvatarBlob(
  imageSrc: string,
  position: { x: number; y: number },
  zoom: number,
  viewportSize: number
): Promise<Blob> {
  return renderCrop(imageSrc, position, zoom, viewportSize, 512, "circle");
}

export async function getCroppedPlateBlob(
  imageSrc: string,
  position: { x: number; y: number },
  zoom: number,
  viewportSize: number
): Promise<Blob> {
  return renderCrop(imageSrc, position, zoom, viewportSize, 1080, "square");
}
