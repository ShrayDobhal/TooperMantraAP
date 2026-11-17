/** Client-side image helpers used before uploading. */

/** Resizes an image to fit within maxWidth×maxHeight and re-encodes as JPEG. */
export function compressImageToBlob(file: File, maxWidth = 1600, maxHeight = 1600, quality = 0.85): Promise<Blob> {
  // GIFs lose animation when drawn to canvas; upload them as-is.
  if (file.type === 'image/gif') return Promise.resolve(file);
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      img.onload = () => {
        let { width, height } = img;
        const scale = Math.min(1, maxWidth / width, maxHeight / height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas is not available in this browser.'));
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not process the image.'))), 'image/jpeg', quality);
      };
      img.onerror = () => reject(new Error('This file could not be read as an image.'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('Could not read the file.'));
    reader.readAsDataURL(file);
  });
}

/** Data URL for an instant local preview. */
export function createLocalPreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Could not preview the file.'));
    reader.readAsDataURL(file);
  });
}

/** Ensures the uploaded file name ends in .jpg after compression. */
export function jpgName(original: string): string {
  const base = original.replace(/\.[^.]+$/, '') || 'image';
  return `${base.replace(/[^a-zA-Z0-9-_]+/g, '-').slice(0, 60)}.jpg`;
}
