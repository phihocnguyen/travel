"use client";
import { useEffect, useId, useRef, type ReactNode } from "react";
export default function DetailDialog({title,onClose,children}:{title:string;onClose:()=>void;children:ReactNode}){
  const ref=useRef<HTMLDialogElement>(null),id=useId();
  useEffect(()=>{const element=ref.current,previous=document.activeElement;element?.showModal();return()=>{element?.close();if(previous instanceof HTMLElement)previous.focus();};},[]);
  return <dialog ref={ref} aria-labelledby={id} onCancel={(event)=>{event.preventDefault();onClose();}} onClick={(event)=>{if(event.target===event.currentTarget)onClose();}} className="fixed inset-0 m-auto max-h-[90dvh] w-[min(900px,calc(100vw-24px))] overflow-hidden rounded-xl border border-black/15 bg-white p-0 text-zinc-900 shadow-xl backdrop:bg-black/40">
    <header className="flex items-center justify-between gap-3 border-b border-black/10 px-5 py-3"><h2 id={id} className="text-lg font-semibold">{title}</h2><button type="button" onClick={onClose} aria-label="Đóng chi tiết" className="rounded-md border border-black/15 px-2.5 py-1">×</button></header>
    <div className="max-h-[calc(90dvh-64px)] space-y-4 overflow-y-auto p-5">{children}</div>
  </dialog>;
}
