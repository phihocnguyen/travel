"use client";
import { useState } from "react";

export default function TicketPrintSheet({id,code}:{id:string;code:string}){
  const [loaded,setLoaded]=useState(false),[error,setError]=useState(false);
  return <main className="min-h-dvh bg-white p-6 text-black print:min-h-0 print:p-0">
    <style>{`@media print { @page { size: A4 portrait; margin: 10mm; } .ticket-print-image { display: block; width: 190mm; height: auto; max-height: none; max-width: none; object-fit: contain; print-color-adjust: exact; -webkit-print-color-adjust: exact; } }`}</style>
    <div className="mb-6 flex flex-wrap items-center gap-4 print:hidden"><h1 className="font-mono text-xl">{code}</h1><button disabled={!loaded||error} onClick={()=>window.print()} className="rounded-full border px-5 py-2 disabled:opacity-40">In vé màu</button><a href={`/api/admin/tickets/${id}/output`} download={`${code}.png`} className="rounded-full border px-5 py-2">Tải PNG màu</a><p className="text-xs text-black/60">In màu · A4 dọc · vé rộng hết vùng in (190 mm). Chọn chế độ Màu trong hộp thoại máy in.</p></div>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={`/api/admin/tickets/${id}/output`} alt={`Vé ${code}`} onLoad={()=>setLoaded(true)} onError={()=>setError(true)} className="ticket-print-image mx-auto w-full max-w-[1200px] print:max-w-none"/>
    {error&&<p role="alert" className="mt-4 text-red-700">Không tải được file in. Hãy quay lại kiểm tra lệnh in.</p>}
  </main>;
}
