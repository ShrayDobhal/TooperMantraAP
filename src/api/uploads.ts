import * as tus from 'tus-js-client';
import { api, unwrap } from '@/lib/api';

/** Folders accepted by POST /admin/uploads/file. */
export type UploadFolder = 'thumbnails' | 'images' | 'documents' | 'mentors' | 'banners';

export interface UploadedFile {
  url: string;
  path: string;
  size: number;
  contentType: string;
}

export interface VideoUploadInit {
  videoGuid: string;
  libraryId: string;
  tus: {
    endpoint: string;
    headers: {
      AuthorizationSignature: string;
      AuthorizationExpire: number | string;
      VideoId: string;
      LibraryId: string;
    };
  };
  embedUrl: string;
  hlsUrl: string;
  thumbnailUrl: string;
}

export type VideoProcessingStatus = 'QUEUED' | 'PROCESSING' | 'ENCODING' | 'READY' | 'FAILED';

export interface VideoStatus {
  status: VideoProcessingStatus;
  encodeProgress: number;
  durationSeconds: number;
  thumbnailUrl: string | null;
}

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const DOCUMENT_TYPES = ['application/pdf'];
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_DOCUMENT_BYTES = 50 * 1024 * 1024;

/** Validates a file against the backend's limits before uploading. Returns an error message or null. */
export function validateUploadFile(file: File | Blob, kind: 'image' | 'document' | 'image-or-document'): string | null {
  const type = file.type;
  const isImage = IMAGE_TYPES.includes(type);
  const isDoc = DOCUMENT_TYPES.includes(type);
  if (kind === 'image' && !isImage) return 'Please choose a JPG, PNG, WEBP or GIF image.';
  if (kind === 'document' && !isDoc) return 'Please choose a PDF file.';
  if (kind === 'image-or-document' && !isImage && !isDoc) return 'Please choose an image or a PDF.';
  if (isImage && file.size > MAX_IMAGE_BYTES) return 'Images must be 10 MB or smaller.';
  if (isDoc && file.size > MAX_DOCUMENT_BYTES) return 'PDFs must be 50 MB or smaller.';
  return null;
}

export const uploadsApi = {
  /** Uploads an image or PDF through the backend to Bunny Storage. */
  uploadFile(
    file: File | Blob,
    folder: UploadFolder,
    onProgress?: (percent: number) => void,
    filename?: string,
  ): Promise<UploadedFile> {
    const form = new FormData();
    const name = filename || (file instanceof File ? file.name : `upload-${Date.now()}.jpg`);
    form.append('file', file, name);
    return unwrap<UploadedFile>(
      api.post(`/admin/uploads/file?folder=${folder}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 0,
        onUploadProgress: (e) => {
          if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
        },
      }),
    );
  },

  createVideo(title: string) {
    return unwrap<VideoUploadInit>(api.post('/admin/uploads/video', { title: title.trim() || 'Untitled video' }));
  },

  videoStatus(guid: string) {
    return unwrap<VideoStatus>(api.get(`/admin/uploads/video/${encodeURIComponent(guid)}/status`));
  },
};

export interface TusController {
  start(): void;
  pause(): void;
  resume(): void;
  abort(): Promise<void>;
}

/**
 * Resumable video upload straight to Bunny Stream with the signed TUS headers
 * returned by the backend. The Bunny API key never reaches the browser.
 */
export function createTusUpload(
  file: File,
  init: VideoUploadInit,
  handlers: {
    onProgress?: (percent: number, bytesUploaded: number, bytesTotal: number) => void;
    onSuccess?: () => void;
    onError?: (err: Error) => void;
  },
): TusController {
  const upload = new tus.Upload(file, {
    endpoint: init.tus.endpoint,
    retryDelays: [0, 3000, 5000, 10000, 20000, 60000],
    chunkSize: 50 * 1024 * 1024,
    headers: {
      AuthorizationSignature: String(init.tus.headers.AuthorizationSignature),
      AuthorizationExpire: String(init.tus.headers.AuthorizationExpire),
      VideoId: String(init.tus.headers.VideoId),
      LibraryId: String(init.tus.headers.LibraryId),
    },
    metadata: {
      filetype: file.type || 'video/mp4',
      title: file.name,
    },
    // Lets an interrupted upload continue from where it stopped after a page reload.
    storeFingerprintForResuming: true,
    removeFingerprintOnSuccess: true,
    onProgress: (sent, total) => handlers.onProgress?.(total ? Math.round((sent / total) * 100) : 0, sent, total),
    onSuccess: () => handlers.onSuccess?.(),
    onError: (err) => handlers.onError?.(err instanceof Error ? err : new Error(String(err))),
  });

  return {
    start() {
      upload.findPreviousUploads().then((previous) => {
        if (previous.length) upload.resumeFromPreviousUpload(previous[0]);
        upload.start();
      });
    },
    pause() {
      upload.abort(false);
    },
    resume() {
      upload.start();
    },
    abort() {
      return upload.abort(true);
    },
  };
}

/** Polls the backend until Bunny finishes encoding (or fails / times out). */
export async function waitForVideoReady(
  guid: string,
  onUpdate?: (s: VideoStatus) => void,
  opts: { intervalMs?: number; timeoutMs?: number; signal?: AbortSignal } = {},
): Promise<VideoStatus> {
  const interval = opts.intervalMs ?? 5000;
  const deadline = Date.now() + (opts.timeoutMs ?? 30 * 60 * 1000);
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (opts.signal?.aborted) throw new Error('Cancelled');
    const s = await uploadsApi.videoStatus(guid);
    onUpdate?.(s);
    if (s.status === 'READY' || s.status === 'FAILED') return s;
    if (Date.now() > deadline) return s;
    await new Promise((r) => setTimeout(r, interval));
  }
}

/** Convenience wrapper: uploads an image/PDF through the backend and returns its CDN URL. */
export async function uploadToCdn(
  file: File | Blob,
  folder: UploadFolder,
  onProgress?: (percent: number) => void,
  filename?: string,
): Promise<string> {
  const name = filename || (file instanceof File ? file.name : file.type === 'application/pdf' ? `document-${Date.now()}.pdf` : `image-${Date.now()}.jpg`);
  const res = await uploadsApi.uploadFile(file, folder, onProgress, name);
  return res.url;
}
