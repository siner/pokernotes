export interface ResizeOptions {
  maxDimension?: number;
  quality?: number;
  type?: string;
}

export function scaleDown(width: number, height: number, max: number) {
  if (width <= max && height <= max) return { width, height };
  const ratio = width > height ? max / width : max / height;
  return { width: Math.round(width * ratio), height: Math.round(height * ratio) };
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

export async function resizeImage(file: File, options: ResizeOptions = {}): Promise<Blob> {
  const { maxDimension = 800, quality = 0.85, type = 'image/jpeg' } = options;

  const img = await loadImage(file);
  const { width, height } = scaleDown(img.naturalWidth, img.naturalHeight, maxDimension);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas_unsupported');
  ctx.drawImage(img, 0, 0, width, height);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('toBlob_failed'))),
      type,
      quality
    );
  });
}
