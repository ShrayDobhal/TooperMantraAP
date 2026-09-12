/**
 * Bunny CDN Storage & Stream Client for Topper Mantra Admin Panel
 * Handles direct browser-to-CDN uploads for images, video thumbnails, and media assets.
 */

export const BUNNY_CONFIG = {
  storageZone: process.env.NEXT_PUBLIC_BUNNY_STORAGE_ZONE || 'topper-mantra-storage',
  storageKey: process.env.NEXT_PUBLIC_BUNNY_STORAGE_KEY || 'c3d0a28a-7069-4ac2-90ddc5683a27-5ff6-454c',
  storageHost: process.env.NEXT_PUBLIC_BUNNY_STORAGE_HOST || 'storage.bunnycdn.com',
  cdnPullZoneUrl: (process.env.NEXT_PUBLIC_BUNNY_CDN_URL || 'https://TopperMantra.b-cdn.net').replace(/\/$/, ''),
  streamLibraryId: process.env.NEXT_PUBLIC_BUNNY_STREAM_LIB_ID || '735098',
  streamApiKey: process.env.NEXT_PUBLIC_BUNNY_STREAM_API_KEY || '54cc8cdb-fb65-4fe4-8ed4081b4588-650d-4a81',
  streamCdnHost: process.env.NEXT_PUBLIC_BUNNY_STREAM_CDN_HOST || 'vz-2e46c256-4ab.b-cdn.net',
};

/**
 * Compresses an image file client-side using an offscreen HTML5 Canvas.
 * Produces a high-quality JPEG Blob optimized for fast mobile rendering.
 */
export function compressImageToBlob(
  file: File,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = () => {
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // Use high-quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to convert canvas to Blob'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('Failed to parse image for compression'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Creates a local Data URL for immediate zero-latency preview in UI
 */
export function createLocalPreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to create local preview'));
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads an image Blob or File directly to Bunny CDN Storage.
 * Returns the public HTTPS CDN delivery URL that can be stored in the database
 * and rendered seamlessly on both web and mobile apps.
 */
export async function uploadImageToBunnyStorage(
  fileOrBlob: File | Blob,
  folder = 'mentors',
  onProgress?: (percent: number) => void
): Promise<string> {
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const timestamp = Date.now();
  const filename = `${folder}/${folder}_${timestamp}_${randomSuffix}.jpg`;

  // Use primary Falkenstein storage endpoint first, with secondary fallback
  const hosts = ['storage.bunnycdn.com', BUNNY_CONFIG.storageHost, 'uk.storage.bunnycdn.com'];

  let lastError: Error | null = null;

  for (const host of hosts) {
    try {
      const uploadUrl = `https://${host}/${BUNNY_CONFIG.storageZone}/${filename}`;
      await performXhrPutUpload(uploadUrl, BUNNY_CONFIG.storageKey, fileOrBlob, onProgress);

      // Successfully uploaded! Return the public CDN delivery URL
      const publicUrl = `${BUNNY_CONFIG.cdnPullZoneUrl}/${filename}`;
      return publicUrl;
    } catch (err: any) {
      lastError = err;
      // If 401 or network issue on first host, try next host
      console.warn(`Bunny upload to ${host} failed:`, err.message);
    }
  }

  throw lastError || new Error('Failed to upload image to Bunny CDN Storage');
}

/**
 * Internal XHR PUT helper with progress reporting
 */
function performXhrPutUpload(
  url: string,
  accessKey: string,
  data: Blob | File,
  onProgress?: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url, true);
    xhr.setRequestHeader('AccessKey', accessKey);
    xhr.setRequestHeader('Content-Type', 'image/jpeg');

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status === 200 || xhr.status === 201) {
        resolve();
      } else if (xhr.status === 401) {
        reject(
          new Error(
            `Bunny Storage authentication failed (401). Please verify the Storage Password for "${BUNNY_CONFIG.storageZone}" in the Bunny dashboard.`
          )
        );
      } else {
        reject(new Error(`Bunny Storage upload failed with status ${xhr.status}: ${xhr.statusText}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error connecting to Bunny CDN Storage server.'));
    };

    xhr.ontimeout = () => {
      reject(new Error('Connection to Bunny CDN Storage timed out.'));
    };

    xhr.timeout = 45000;
    xhr.send(data);
  });
}
