"use client";

import { useRef, useState } from "react";
import { Play } from "lucide-react";

export default function CommunityVideoPlayer({ src, title, poster, className = "" }: { src: string; title: string; poster?: string; className?: string }) {
  const player = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState(!poster), [error, setError] = useState(false);
  function start() {
    if (!player.current) return;
    setActive(true); setError(false);
    // Assign inside the click handler: large samples stay unloaded until watched.
    player.current.src = src;
    void player.current.play().catch(() => { /* Native controls remain available. */ });
  }
  return <div className={`relative aspect-video overflow-hidden bg-[#21372c] ${className}`}>
    <video ref={player} data-community-video controls={active} playsInline preload={poster ? "none" : "metadata"}
      src={poster ? undefined : src} poster={poster} aria-label={title} className="h-full w-full object-contain"
      onError={() => setError(true)} onPlaying={() => setError(false)}
      onPlay={event => { document.querySelectorAll<HTMLVideoElement>("video[data-community-video]").forEach(video => { if (video !== event.currentTarget) video.pause(); }); }} />
    {!active && <button type="button" aria-label={`Phát video ${title}`} onClick={start} className="group absolute inset-0 flex items-center justify-center bg-black/5 transition hover:bg-black/10"><span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/70 bg-white/90 text-[#496449] shadow-lg transition group-hover:scale-105"><Play size={23} fill="currentColor" className="ml-1" /></span></button>}
    {error && <p role="alert" className="absolute inset-x-4 top-4 rounded-xl bg-white/95 px-3 py-2 text-center text-xs text-[#805d50]">Chưa thể phát video. Bạn hãy tải lại trang và thử lại.</p>}
  </div>;
}
