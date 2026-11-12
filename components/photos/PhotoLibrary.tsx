"use client";

import Image from 'next/image';
import { useState } from 'react';
import { ArrowDown, ArrowUpRight, Camera, Expand } from 'lucide-react';
import { LOCAL_PHOTOS } from '@/lib/photos';
import PhotoLightbox from './PhotoLightbox';
import './photos.css';

const hiddenGroups = new Set(['chua-la-sen', 'chi-bo']);
const visiblePhotos = LOCAL_PHOTOS.filter(photo => !hiddenGroups.has(photo.group));
const groups = [...new Map(visiblePhotos.map(photo => [photo.group, photo.groupLabel])).entries()];
export default function PhotoLibrary() {
  const [group, setGroup] = useState('all'), [visible, setVisible] = useState(12), [selected, setSelected] = useState<number | null>(null);
  const photos = visiblePhotos.filter(photo => group === 'all' || photo.group === group);
  return <section id="photos" data-photo-library className="photo-library">
    <div className="photo-library-heading"><div><p className="photo-library-eyebrow"><Camera size={15} />CAO LÃNH QUA NHỮNG KHUNG HÌNH</p><h2>Thật gần<br /><em>Thật nhiều yêu thương</em></h2></div><div><p>Ghé một góc vườn, dạo một phiên chợ,<br className="hidden sm:block" /> lưu lại một chút bình yên của miền đất này.</p><span>{visiblePhotos.length} khung hình · {groups.length} góc khám phá</span></div></div>
    <div className="photo-library-filters" aria-label="Chọn bộ ảnh">{[['all', 'Tất cả'], ...groups].map(([id, label]) => <button key={id} type="button" aria-pressed={group === id} onClick={() => { setGroup(id); setVisible(12); }}>{label}</button>)}</div>
    <div className="photo-library-grid">{photos.slice(0, visible).map((photo, index) => <button key={photo.id} type="button" data-library-photo aria-label={`Xem ảnh: ${photo.alt}`} onClick={() => setSelected(index)} className="photo-library-card"><div className="photo-library-image"><Image src={photo.src} alt={photo.alt} fill sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw" quality={85} className="object-cover" /><span className="photo-library-expand"><Expand size={16} /></span></div><span className="photo-library-label">{photo.groupLabel}<ArrowUpRight size={15} /></span><span className="photo-library-caption">{photo.alt}</span></button>)}</div>
    {visible < photos.length && <div className="photo-library-more"><button type="button" onClick={() => setVisible(count => count + 12)}>Xem thêm khung hình <span>{photos.length - visible}</span><ArrowDown size={15} /></button></div>}
    {selected !== null && <PhotoLightbox photos={photos} index={selected} onIndex={setSelected} onClose={() => setSelected(null)} />}
  </section>;
}
