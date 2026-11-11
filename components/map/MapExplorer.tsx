"use client";

import { useState } from 'react';
import { MapPin, Search, X, Layers, Scan } from 'lucide-react';
import { ATTRACTIONS, CATEGORY_LABELS } from '@/lib/map/attractions';
import { useMapUI } from './MapUIContext';

export default function MapExplorer() {
  const { explored, selectedAttractionId, setSelectedAttractionId, resetOverview } = useMapUI();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLowerCase();
  const places = ATTRACTIONS.filter(place => normalize(`${place.name} ${place.area} ${place.type}`).includes(normalize(query)));
  if (!explored || selectedAttractionId !== null) return null;
  return <aside aria-label="Tra cứu bản đồ" className="absolute bottom-24 left-4 z-40 w-[min(320px,calc(100vw-32px))] text-[#f5f1db] sm:left-6">
    {open && <div className="mb-3 overflow-hidden rounded-2xl border border-white/20 bg-[#173c30]/95 shadow-2xl backdrop-blur-xl">
      <header className="flex items-center justify-between border-b border-white/10 p-4"><div><h2 className="text-sm font-bold">Khám phá Cao Lãnh</h2><p className="mt-1 text-[11px] text-white/60">{ATTRACTIONS.length} điểm đến · Đồng Tháp</p></div><button aria-label="Đóng tra cứu" onClick={() => setOpen(false)} className="rounded-lg p-2 hover:bg-white/10"><X size={17} /></button></header>
      <label className="m-3 flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3"><Search size={15} /><input autoFocus value={query} onChange={event => setQuery(event.target.value)} aria-label="Tìm địa điểm" placeholder="Tìm vườn xoài, di tích, địa danh…" className="min-w-0 flex-1 bg-transparent py-3 text-xs outline-none" /></label>
      <div className="max-h-[min(42dvh,340px)] overflow-y-auto overscroll-contain px-2 pb-2">{places.map(place => <button key={place.id} onClick={() => setSelectedAttractionId(place.id)} className="flex w-full gap-3 rounded-xl p-3 text-left transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e8cd7c]"><MapPin size={16} className="mt-1 shrink-0 text-[#e8cd7c]" /><span><strong className="block text-xs leading-relaxed">{place.name}</strong><span className="mt-1 block text-[10px] text-[#ccd9bf]">{CATEGORY_LABELS[place.category]}</span><span className="mt-1 block text-[10px] text-white/50">{place.lat.toFixed(4)}° N · {place.lon.toFixed(4)}° E</span></span></button>)}{!places.length && <p className="p-4 text-xs text-white/70">Chưa tìm thấy địa điểm phù hợp.</p>}</div>
    </div>}
    <button type="button" onClick={resetOverview} className="mb-2 flex items-center gap-2 rounded-full border border-white/25 bg-[#173c30]/90 px-4 py-3 text-xs shadow-lg backdrop-blur-xl"><Scan size={16} />Về toàn cảnh</button>
    <button onClick={() => setOpen(!open)} aria-expanded={open} className="flex items-center gap-2 rounded-full border border-white/25 bg-[#173c30]/90 px-4 py-3 text-xs font-semibold shadow-lg backdrop-blur-xl"><Layers size={16} />Địa điểm & thông tin<span className="rounded-full bg-[#e8cd7c] px-2 py-0.5 text-[10px] text-[#173c30]">{ATTRACTIONS.length}</span></button>
  </aside>;
}
