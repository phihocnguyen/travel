"use client";
import { useEffect, useRef, useState } from "react";

export function useTablePageSize(rowHeight=57){
  const ref=useRef<HTMLDivElement>(null);
  const [size,setSize]=useState(6);
  useEffect(()=>{const element=ref.current;if(!element)return;const observer=new ResizeObserver(([entry])=>setSize(Math.max(1,Math.min(20,Math.floor((entry.contentRect.height-40)/rowHeight)))));observer.observe(element);return()=>observer.disconnect();},[rowHeight]);
  return {ref,size};
}
export function TablePagination({page,pages,total,onChange}:{page:number;pages:number;total:number;onChange:(page:number)=>void}){
  return <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-black/10 px-4 py-3 text-xs text-black/55"><span>{total} kết quả · Trang {page+1}/{Math.max(1,pages)}</span><div className="flex gap-2"><button type="button" disabled={page===0} onClick={()=>onChange(page-1)} className="rounded-md border border-black/15 bg-white px-3 py-1.5 disabled:opacity-30">Trước</button><button type="button" disabled={page>=pages-1} onClick={()=>onChange(page+1)} className="rounded-md border border-black/15 bg-white px-3 py-1.5 disabled:opacity-30">Sau</button></div></footer>;
}
