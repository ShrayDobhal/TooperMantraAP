'use client';
import React, { useRef, useState } from 'react';
import { FileText, ImagePlus, RefreshCw, Trash2, UploadCloud } from 'lucide-react';
import { uploadsApi, validateUploadFile, UploadFolder } from '@/api/uploads';
import { compressImageToBlob, jpgName } from '@/lib/images';
import { cn } from '@/lib/format';
import { Button, ProgressBar } from '@/components/ui';

export interface FileUploaderProps {
  label?: string;
  folder: UploadFolder;
  kind?: 'image' | 'document' | 'image-or-document';
  /** Current file URL (controlled). */
  value?: string | null;
  onChange: (url: string | null, meta?: { name: string; size: number; contentType: string }) => void;
  /** Resize images to fit within this box before upload (default 1600×1600). */
  maxImageSize?: { width: number; height: number };
  hint?: string;
  /** Tailwind aspect class for the image preview, e.g. 'aspect-video' or 'aspect-square'. */
  previewAspect?: string;
  disabled?: boolean;
  className?: string;
  onUploadingChange?: (uploading: boolean) => void;
}

/**
 * One uploader for every image, thumbnail and PDF in the panel. Files go to the
 * backend (POST /admin/uploads/file), which validates them and stores them on Bunny.
 */
export function FileUploader({
  label,
  folder,
  kind = 'image',
  value,
  onChange,
  maxImageSize = { width: 1600, height: 1600 },
  hint,
  previewAspect = 'aspect-video',
  disabled,
  className,
  onUploadingChange,
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastFile, setLastFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const accept =
    kind === 'image' ? 'image/jpeg,image/png,image/webp,image/gif' : kind === 'document' ? 'application/pdf' : 'image/*,application/pdf';

  const upload = async (file: File) => {
    setError(null);
    const invalid = validateUploadFile(file, kind);
    if (invalid) {
      setError(invalid);
      return;
    }
    setLastFile(file);
    setProgress(0);
    onUploadingChange?.(true);
    try {
      let body: Blob = file;
      let name = file.name;
      if (file.type.startsWith('image/') && file.type !== 'image/gif') {
        body = await compressImageToBlob(file, maxImageSize.width, maxImageSize.height, 0.86);
        name = jpgName(file.name);
      }
      const res = await uploadsApi.uploadFile(body, folder, setProgress, name);
      setFileName(file.name);
      onChange(res.url, { name: file.name, size: res.size, contentType: res.contentType });
    } catch (e: any) {
      setError(e?.message || 'Upload failed. Please try again.');
    } finally {
      setProgress(null);
      onUploadingChange?.(false);
    }
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (f) upload(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    const f = e.dataTransfer.files?.[0];
    if (f) upload(f);
  };

  const isPdf = value ? /\.pdf($|\?)/i.test(value) : false;
  const uploading = progress !== null;

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && <span className="block text-xs font-medium text-slate-700">{label}</span>}
      {value && !uploading ? (
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 p-2">
          {isPdf || kind === 'document' ? (
            <div className="flex h-14 w-14 items-center justify-center rounded-md bg-slate-100 text-slate-500">
              <FileText className="h-6 w-6" />
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className={cn('h-14 rounded-md border border-slate-100 object-cover', previewAspect === 'aspect-square' ? 'w-14' : 'w-24')} />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-slate-800">{fileName || value.split('/').pop()}</p>
            <a href={value} target="_blank" rel="noreferrer" className="text-xs text-brand-600 hover:underline">
              Open
            </a>
          </div>
          <Button size="sm" variant="ghost" disabled={disabled} onClick={() => inputRef.current?.click()} icon={<RefreshCw className="h-3.5 w-3.5" />}>
            Replace
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={disabled}
            onClick={() => {
              setFileName(null);
              onChange(null);
            }}
            icon={<Trash2 className="h-3.5 w-3.5" />}
            aria-label="Remove"
          />
        </div>
      ) : (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          onClick={() => !disabled && !uploading && inputRef.current?.click()}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 px-4 py-5 text-center transition-colors hover:border-brand-500 hover:bg-brand-50/40',
            (disabled || uploading) && 'cursor-not-allowed opacity-70',
          )}
        >
          {kind === 'document' ? <UploadCloud className="h-5 w-5 text-slate-400" /> : <ImagePlus className="h-5 w-5 text-slate-400" />}
          <p className="text-xs font-medium text-slate-700">{uploading ? `Uploading… ${progress}%` : 'Click or drop a file'}</p>
          <p className="text-[11px] text-slate-500">
            {hint || (kind === 'document' ? 'PDF up to 50 MB' : kind === 'image' ? 'JPG, PNG, WEBP or GIF up to 10 MB' : 'Image (10 MB) or PDF (50 MB)')}
          </p>
          {uploading && <ProgressBar value={progress ?? 0} className="mt-2 max-w-[220px]" />}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 text-xs text-red-600">
          <span>{error}</span>
          {lastFile && (
            <button className="font-medium underline" onClick={() => upload(lastFile)}>
              Retry
            </button>
          )}
        </div>
      )}
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={onPick} />
    </div>
  );
}
