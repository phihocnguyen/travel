"use client";

import Image from 'next/image';
import { useState } from 'react';
import { Expand, Images } from 'lucide-react';
import type { LocalPhoto } from '@/lib/photos';
import PhotoLightbox from './PhotoLightbox';
import './photos.css';

export default function DestinationPhotos({ photos, caption }: { photos: LocalPhoto[]; caption?: string }) {
  const [active, setActive] = useState(0), [lightbox, setLightbox] = useState(false);
  if (!photos.length) return null;
  const photo = photos[active] ?? photos[0];
  return <section aria-label="Ảnh điểm đến" className="destination-photos">
    <button type="button" onClick={() => setLightbox(true)} className="destination-photo-main" aria-label={`Phóng to: ${photo.alt}`}><Image src={photo.src} alt={caption || photo.alt} fill sizes="(max-width: 640px) 90vw, 470px" quality={85} className="object-cover" /><span><Images size={12} />{active + 1} / {photos.length}</span><Expand size={17} className="destination-expand" /></button>
    <p className="destination-photo-caption">{caption || photo.alt}</p>
    {photos.length > 1 && <div className="destination-photo-thumbs">{photos.map((item, index) => <button key={item.id} type="button" aria-label={`Xem ảnh ${index + 1}: ${item.alt}`} aria-pressed={active === index} onClick={() => setActive(index)}><Image src={item.thumbnail} alt={item.alt} fill sizes="85px" className="object-cover" /></button>)}</div>}
    {lightbox && <PhotoLightbox photos={photos} index={active} onIndex={setActive} onClose={() => setLightbox(false)} />}
  </section>;
}
