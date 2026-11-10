"use client";
import { PHOTO_FEATURES } from "@/lib/photos";
import { useState } from "react";
export default function BlogCover({src,alt,className="",priority=false}:{src:string|null;alt:string;className?:string;priority?:boolean}){
  const [failed,setFailed]=useState(false),illustration=!src||failed;
  return <div className={`relative overflow-hidden bg-[#e8e9df] ${className}`}>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={illustration?PHOTO_FEATURES.farmer.src:src} alt={illustration?"Người làm vườn trong bộ ảnh Cao Lãnh · ảnh minh họa":alt} loading={priority?"eager":"lazy"} decoding="async" fetchPriority={priority?"high":"auto"} onError={()=>setFailed(true)} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.025] motion-reduce:transform-none"/>
    {illustration&&<span className="absolute bottom-3 left-3 rounded-sm bg-white/90 px-2 py-1 text-[9px] text-[#64705e]">Ảnh minh họa Cao Lãnh</span>}
  </div>;
}
