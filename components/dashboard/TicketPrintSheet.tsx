"use client";
import { useState } from "react";
import { TICKET_PAPER_WIDTH_MM, TICKET_PAPER_HEIGHT_MM } from "@/lib/tickets/print-settings";

export default function TicketPrintSheet({id,code}:{id:string;code:string}){
  const [loaded,setLoaded]=useState(false),[error,setError]=useState(false);
  return <main className="ticket-print-sheet min-h-dvh bg-white p-6 text-black print:min-h-0 print:p-0">
    <style>{`@media print {
      @page { size: A4 portrait; margin: 0; }
      html, body { margin: 0 !important; padding: 0 !important; }
      .ticket-print-sheet { width: ${TICKET_PAPER_WIDTH_MM}mm; margin: 0; padding: 0; min-height: 0; }
      .ticket-print-image { display: block; width: ${TICKET_PAPER_WIDTH_MM}mm; height: ${TICKET_PAPER_HEIGHT_MM}mm; margin: 0; max-height: none; max-width: none; object-fit: fill; transform: translateY(10mm); print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    }`}</style>
    <div className="mb-6 flex flex-wrap items-center gap-4 print:hidden"><h1 className="font-mono text-xl">{code}</h1><button disabled={!loaded||error} onClick={()=>window.print()} className="rounded-full border px-5 py-2 disabled:opacity-40">In vé màu</button><a href={`/api/admin/tickets/${id}/output`} download={`${code}.png`} className="rounded-full border px-5 py-2">Tải PNG màu</a><p className="text-xs text-black/60">In màu · A4 dọc · vé 21 × {(TICKET_PAPER_HEIGHT_MM / 10).toLocaleString("vi-VN", { maximumFractionDigits: 2 })} cm, đúng tỷ lệ ảnh. Chọn tỷ lệ 100%, lề Không, tắt đầu trang/chân trang và bật in không viền nếu máy hỗ trợ.</p></div>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={`/api/admin/tickets/${id}/output`} alt={`Vé ${code}`} onLoad={()=>setLoaded(true)} onError={()=>setError(true)} className="ticket-print-image mx-auto w-full max-w-[1200px] print:max-w-none"/>
    {error&&<p role="alert" className="mt-4 text-red-700">Không tải được file in. Hãy quay lại kiểm tra lệnh in.</p>}
  </main>;
}
