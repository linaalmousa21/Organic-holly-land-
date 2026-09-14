const MAX_DIMENSION = 1600;
const TARGET_BYTES = 1.5 * 1024 * 1024;
const MIN_QUALITY = 0.62;

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("تعذر ضغط الصورة في المتصفح"));
    }, type, quality);
  });
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("تعذر قراءة الصورة"));
    };
    image.src = url;
  });
}

/** Resizes without cropping and adaptively compresses a product image in the browser. */
export async function compressImageForUpload(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) throw new Error("الملف المختار ليس صورة");
  const image = await loadImage(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("المتصفح لا يدعم معالجة الصور");
  context.drawImage(image, 0, 0, width, height);

  let outputType = "image/webp";
  let quality = 0.84;
  let blob: Blob;
  try {
    blob = await canvasToBlob(canvas, outputType, quality);
  } catch {
    outputType = "image/jpeg";
    blob = await canvasToBlob(canvas, outputType, quality);
  }
  while (blob.size > TARGET_BYTES && quality > MIN_QUALITY) {
    quality = Math.max(MIN_QUALITY, quality - 0.08);
    blob = await canvasToBlob(canvas, outputType, quality);
  }

  const extension = blob.type === "image/webp" ? "webp" : "jpg";
  const baseName = file.name.replace(/\.[^.]+$/, "") || "product-image";
  return new File([blob], `${baseName}.${extension}`, { type: blob.type, lastModified: Date.now() });
}
