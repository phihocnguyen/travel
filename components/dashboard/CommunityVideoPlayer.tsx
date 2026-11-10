"use client";

import { useEffect, useRef, useState } from 'react';
import { Clapperboard, Play, RotateCcw } from 'lucide-react';
import './community.css';

export default function CommunityVideoPlayer({ src, title, poster, className = '' }: { src: string; title: string; poster?: string; className?: string }) {
  const player = useRef<HTMLVideoElement>(null), container = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false), [error, setError] = useState(false), [portrait, setPortrait] = useState(false);
  useEffect(() => {
    if (!container.current) return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { if (!poster && player.current && !player.current.getAttribute('src')) player.current.src = src; }
      else player.current?.pause();
    }, { rootMargin: '100px' });
    observer.observe(container.current);
    return () => observer.disconnect();
  }, [poster, src]);
  function start() {
    const video = player.current;
    if (!video) return;
    setActive(true); setError(false);
    // Poster-backed videos download only after an explicit play action.
    if (!video.getAttribute('src')) video.src = src;
    void video.play().catch(() => { /* Native controls remain available. */ });
  }
  return <div ref={container} className={`social-video ${className}`} data-portrait={portrait || undefined}>
    <video ref={player} data-community-video controls={active} playsInline preload={poster ? 'none' : 'metadata'} poster={poster} aria-label={title}
      onLoadedMetadata={event => setPortrait(event.currentTarget.videoHeight > event.currentTarget.videoWidth)}
      onError={() => setError(true)} onPlaying={() => setError(false)}
      onPlay={event => { setActive(true); document.querySelectorAll<HTMLVideoElement>('video[data-community-video]').forEach(video => { if (video !== event.currentTarget) video.pause(); }); }} />
    {!active && !error && <button type="button" aria-label={`Phát video ${title}`} onClick={start} className="social-play"><span className="social-play-circle"><Play size={25} fill="currentColor" className="ml-1" /></span><span className="social-play-caption">MỘT KHOẢNH KHẮC ĐƯỢC SẺ CHIA</span></button>}
    {!active && <span className="social-video-label"><Clapperboard size={11} />VIDEO CỘNG ĐỒNG</span>}
    {error && <div role="alert" className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#20372be8] px-5 text-center text-white"><p className="text-xs leading-relaxed">Chưa thể phát video. Bạn hãy thử lại nhé.</p><button type="button" onClick={() => { player.current?.load(); start(); }} className="flex items-center gap-2 rounded-lg bg-white/15 px-4 py-2 text-xs"><RotateCcw size={13} />Thử lại</button></div>}
  </div>;
}
