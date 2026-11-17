'use client';
import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Film, Pause, Play, RotateCcw, X } from 'lucide-react';
import {
  createTusUpload,
  TusController,
  uploadsApi,
  VideoStatus,
  VideoUploadInit,
  waitForVideoReady,
} from '@/api/uploads';
import { cn } from '@/lib/format';
import { Badge, Button, ProgressBar } from '@/components/ui';

export interface UploadedVideo {
  videoGuid: string;
  libraryId: string;
  hlsUrl: string;
  embedUrl: string;
  thumbnailUrl: string;
  fileName: string;
  status: VideoStatus['status'];
  durationSeconds: number;
}

type Phase = 'idle' | 'creating' | 'uploading' | 'paused' | 'processing' | 'ready' | 'failed';

const MAX_VIDEO_BYTES = 8 * 1024 * 1024 * 1024; // 8 GB

/**
 * Resumable video upload: the backend creates the Bunny video and signs a TUS
 * upload; the file goes straight from the browser to Bunny, then we poll until
 * encoding is done. `onUploaded` fires as soon as the bytes are on Bunny, and
 * `onReady` once encoding finishes.
 */
export function VideoUploader({
  title,
  onUploaded,
  onReady,
  onBusyChange,
  disabled,
  className,
}: {
  /** Used as the Bunny video title. */
  title: string;
  onUploaded: (v: UploadedVideo) => void;
  onReady?: (v: UploadedVideo) => void;
  onBusyChange?: (busy: boolean) => void;
  disabled?: boolean;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const ctrl = useRef<TusController | null>(null);
  const initRef = useRef<VideoUploadInit | null>(null);
  const abortPoll = useRef<AbortController | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState(0);
  const [bytes, setBytes] = useState<{ sent: number; total: number }>({ sent: 0, total: 0 });
  const [encode, setEncode] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    onBusyChange?.(phase === 'creating' || phase === 'uploading' || phase === 'paused');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (phase === 'uploading' || phase === 'paused') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [phase]);

  useEffect(() => () => abortPoll.current?.abort(), []);

  const toResult = (init: VideoUploadInit, f: File, s?: VideoStatus): UploadedVideo => ({
    videoGuid: init.videoGuid,
    libraryId: init.libraryId,
    hlsUrl: init.hlsUrl,
    embedUrl: init.embedUrl,
    thumbnailUrl: s?.thumbnailUrl || init.thumbnailUrl,
    fileName: f.name,
    status: s?.status || 'PROCESSING',
    durationSeconds: s?.durationSeconds || 0,
  });

  const start = async (f: File) => {
    setError(null);
    if (!f.type.startsWith('video/')) {
      setError('Please choose a video file (MP4, MOV, MKV…).');
      return;
    }
    if (f.size > MAX_VIDEO_BYTES) {
      setError('Videos must be 8 GB or smaller.');
      return;
    }
    setFile(f);
    setPhase('creating');
    setProgress(0);
    try {
      const init = await uploadsApi.createVideo(title || f.name.replace(/\.[^.]+$/, ''));
      initRef.current = init;
      ctrl.current = createTusUpload(f, init, {
        onProgress: (pct, sent, total) => {
          setProgress(pct);
          setBytes({ sent, total });
        },
        onError: (err) => {
          setError(err.message || 'Upload failed.');
          setPhase('failed');
        },
        onSuccess: async () => {
          setProgress(100);
          setPhase('processing');
          onUploaded(toResult(init, f));
          const ac = new AbortController();
          abortPoll.current = ac;
          try {
            const final = await waitForVideoReady(init.videoGuid, (s) => setEncode(s.encodeProgress || 0), { signal: ac.signal });
            if (final.status === 'READY') {
              setPhase('ready');
              onReady?.(toResult(init, f, final));
            } else if (final.status === 'FAILED') {
              setPhase('failed');
              setError('Bunny could not encode this video. Try re-exporting it as MP4 (H.264).');
            }
          } catch (e: any) {
            if (e?.message !== 'Cancelled') setError(`Upload finished, but checking encoding status failed: ${e?.message}`);
          }
        },
      });
      setPhase('uploading');
      ctrl.current.start();
    } catch (e: any) {
      setError(e?.message || 'Could not start the upload.');
      setPhase('failed');
    }
  };

  const reset = async () => {
    abortPoll.current?.abort();
    if (ctrl.current && (phase === 'uploading' || phase === 'paused')) await ctrl.current.abort().catch(() => undefined);
    ctrl.current = null;
    initRef.current = null;
    setFile(null);
    setPhase('idle');
    setProgress(0);
    setEncode(0);
    setError(null);
  };

  const mb = (n: number) => `${(n / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <div className={cn('space-y-2', className)}>
      {phase === 'idle' ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f && !disabled) start(f);
          }}
          onClick={() => !disabled && inputRef.current?.click()}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center hover:border-brand-500 hover:bg-brand-50/40',
            disabled && 'cursor-not-allowed opacity-60',
          )}
        >
          <Film className="h-6 w-6 text-slate-400" />
          <p className="text-sm font-medium text-slate-700">Click or drop a video</p>
          <p className="text-xs text-slate-500">MP4, MOV or MKV up to 8 GB. Uploads resume automatically if the connection drops.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-800">{file?.name}</p>
              <p className="text-xs text-slate-500">
                {phase === 'creating' && 'Preparing upload…'}
                {phase === 'uploading' && `Uploading ${progress}% · ${mb(bytes.sent)} of ${mb(bytes.total)}`}
                {phase === 'paused' && `Paused at ${progress}%`}
                {phase === 'processing' && `Uploaded. Bunny is encoding${encode ? ` (${encode}%)` : ''}… you can save now.`}
                {phase === 'ready' && 'Ready to stream'}
                {phase === 'failed' && 'Upload stopped'}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {phase === 'ready' && (
                <Badge tone="success">
                  <CheckCircle2 className="h-3 w-3" /> Ready
                </Badge>
              )}
              {phase === 'processing' && <Badge tone="info">Encoding</Badge>}
              {phase === 'uploading' && (
                <Button size="sm" variant="ghost" icon={<Pause className="h-3.5 w-3.5" />} onClick={() => { ctrl.current?.pause(); setPhase('paused'); }}>
                  Pause
                </Button>
              )}
              {phase === 'paused' && (
                <Button size="sm" variant="ghost" icon={<Play className="h-3.5 w-3.5" />} onClick={() => { ctrl.current?.resume(); setPhase('uploading'); }}>
                  Resume
                </Button>
              )}
              {phase === 'failed' && file && ctrl.current && (
                <Button size="sm" variant="ghost" icon={<RotateCcw className="h-3.5 w-3.5" />} onClick={() => { setError(null); ctrl.current?.resume(); setPhase('uploading'); }}>
                  Retry
                </Button>
              )}
              {phase !== 'processing' && phase !== 'ready' && (
                <Button size="sm" variant="ghost" icon={<X className="h-3.5 w-3.5" />} onClick={reset} aria-label="Cancel upload" />
              )}
            </div>
          </div>
          {(phase === 'uploading' || phase === 'paused' || phase === 'creating') && <ProgressBar value={progress} className="mt-3" />}
          {phase === 'processing' && <ProgressBar value={encode} className="mt-3" tone="success" />}
        </div>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (f) start(f);
        }}
      />
    </div>
  );
}
