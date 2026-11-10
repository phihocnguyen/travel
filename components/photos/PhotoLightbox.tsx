"use client";

import Image from 'next/image';
import { useEffect, useId, useRef } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { LocalPhoto } from '@/lib/photos';
import { lockPageScroll } from '@/lib/ui/scroll-lock';
import './photos.css';

export default function PhotoLightbox({ photos, index, onIndex, onClose }: { photos: LocalPhoto[]; index: number; onIndex: (index: number) => void; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null), title = useId(), photo = photos[index];
  useEffect(() => {
    const element = dialog.current, previous = document.activeElement, unlock = lockPageScroll();
    element?.showModal();
    return () => { element?.close(); unlock(); if (previous instanceof HTMLElement) previous.focus(); };
  }, []);
  function step(direction: number) { onIndex((index + direction + photos.length) % photos.length); }
  return <dialog ref={dialog} data-photo-lightbox aria-labelledby={title} onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }} onKeyDown={event => { event.stopPropagation(); if (event.key === 'ArrowLeft') { event.preventDefault(); step(-1); } if (event.key === 'ArrowRight') { event.preventDefault(); step(1); } }} className="photo-lightbox">
    <header><span>{String(index + 1).padStart(2, '0')} / {photos.length} ảnh</span><button type="button" onClick={onClose} aria-label="Đóng ảnh"><X size={21} /></button></header>
    <div className="photo-lightbox-frame"><Image key={photo.id} src={photo.src} alt={photo.alt} fill unoptimized style={{ objectFit: 'scale-down' }} />{photos.length > 1 && <><button type="button" className="photo-prev" aria-label="Ảnh trước" onClick={() => step(-1)}><ChevronLeft size={24} /></button><button type="button" className="photo-next" aria-label="Ảnh tiếp theo" onClick={() => step(1)}><ChevronRight size={24} /></button></>}</div>
    <footer><h2 id={title}>{photo.alt}</h2><p>{photo.groupLabel}</p><a href={photo.src} target="_blank" rel="noreferrer">Mở ảnh đầy đủ ↗</a></footer>
  </dialog>;
}
