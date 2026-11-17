'use client';
import React from 'react';
import { ExternalLink } from 'lucide-react';
import type { VideoItem } from '@/api/videos';
import { Alert, Modal } from '@/components/ui';

type Playable = Pick<VideoItem, 'id' | 'title' | 'status'> & {
  bunnyVideoId?: string | null;
  bunnyLibraryId?: string | null;
  youtubeId?: string | null;
  videoUrl?: string | null;
  embedUrl?: string | null;
};

/** Works out how to play a video in the browser: Bunny player, YouTube player, or a plain file. */
export function playbackFor(v: Playable): { kind: 'iframe' | 'file' | 'link' | 'none'; src: string } {
  const bunnyLib = v.bunnyLibraryId || v.embedUrl?.match(/mediadelivery\.net\/embed\/(\d+)\//)?.[1] || null;
  if (v.bunnyVideoId && bunnyLib) {
    return { kind: 'iframe', src: `https://iframe.mediadelivery.net/embed/${bunnyLib}/${v.bunnyVideoId}?autoplay=true&preload=true&responsive=true` };
  }
  const yt = v.youtubeId || v.videoUrl?.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/)?.[1];
  if (yt) return { kind: 'iframe', src: `https://www.youtube-nocookie.com/embed/${yt}?autoplay=1&rel=0` };
  if (v.videoUrl && /\.(mp4|webm|mov)(\?|$)/i.test(v.videoUrl)) return { kind: 'file', src: v.videoUrl };
  if (v.videoUrl) return { kind: 'link', src: v.videoUrl };
  return { kind: 'none', src: '' };
}

export function VideoPreviewModal({ video, onClose }: { video: Playable | null; onClose: () => void }) {
  if (!video) return null;
  const p = playbackFor(video);
  const processing = video.status && video.status !== 'READY';
  return (
    <Modal open={!!video} onClose={onClose} title={video.title} size="xl">
      <div className="space-y-3">
        {processing && (
          <Alert tone="warning">
            This video is still {String(video.status).toLowerCase()} on the video host. It plays once encoding finishes (usually a few minutes).
          </Alert>
        )}
        {p.kind === 'iframe' && (
          <div className="relative w-full overflow-hidden rounded-lg bg-black" style={{ aspectRatio: '16 / 9' }}>
            <iframe
              key={p.src}
              src={p.src}
              title={video.title}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
            />
          </div>
        )}
        {p.kind === 'file' && (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video src={p.src} controls autoPlay className="w-full rounded-lg bg-black" style={{ aspectRatio: '16 / 9' }} />
        )}
        {p.kind === 'link' && (
          <a href={p.src} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline">
            Open the video link <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
        {p.kind === 'none' && <Alert tone="error">This video has no file or link attached. Edit it and upload a file or add a YouTube link.</Alert>}
      </div>
    </Modal>
  );
}
