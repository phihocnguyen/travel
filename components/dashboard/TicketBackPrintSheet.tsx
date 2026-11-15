"use client";

import { useState } from "react";
import {
  TICKET_PAPER_WIDTH_MM,
  TICKET_PAPER_HEIGHT_MM,
  TICKET_BACK_GAP_MM,
  TICKET_BACKS_PER_A4,
} from "@/lib/tickets/print-settings";

export default function TicketBackPrintSheet() {
  const [loaded, setLoaded] = useState(0);
  const [error, setError] = useState(false);

  return <main className="ticket-back-print min-h-dvh bg-white p-6 text-black">
    <style>{`
      .ticket-back-page { display: grid; gap: ${TICKET_BACK_GAP_MM}mm; width: min(100%, ${TICKET_PAPER_WIDTH_MM}mm); margin: 0 auto; }
      .ticket-back-image { display: block; width: 100%; aspect-ratio: ${TICKET_PAPER_WIDTH_MM} / ${TICKET_PAPER_HEIGHT_MM}; object-fit: fill; }
      @media print {
        @page { size: A4 portrait; margin: 0; }
        html, body { margin: 0 !important; padding: 0 !important; }
        .ticket-back-print { width: ${TICKET_PAPER_WIDTH_MM}mm; margin: 0; padding: 0; min-height: 0; }
        .ticket-back-controls, .ticket-back-error { display: none !important; }
        .ticket-back-page { width: ${TICKET_PAPER_WIDTH_MM}mm; margin: 0; padding: 0; break-inside: avoid; }
        .ticket-back-image {
          width: ${TICKET_PAPER_WIDTH_MM}mm;
          height: ${TICKET_PAPER_HEIGHT_MM}mm;
          max-width: none;
          max-height: none;
          margin: 0;
          break-inside: avoid;
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }
      }
    `}</style>
    <div className="ticket-back-controls mb-6 flex flex-wrap items-center gap-4">
      <h1 className="text-xl font-semibold">In mặt sau vé</h1>
      <button type="button" disabled={loaded < TICKET_BACKS_PER_A4 || error} onClick={() => window.print()} className="rounded-full border px-5 py-2 disabled:opacity-40">
        In {TICKET_BACKS_PER_A4} mặt sau / A4
      </button>
      <a href="/dashboard/admin/tickets" className="text-sm underline">Quản lý vé</a>
      <p className="w-full text-sm text-black/60">
        {TICKET_BACKS_PER_A4} mặt sau từ sát mép trên và hai bên giấy, mỗi vé rộng 21 cm × cao {(TICKET_PAPER_HEIGHT_MM / 10).toLocaleString("vi-VN", { maximumFractionDigits: 2 })} cm, khớp khổ mặt trước.
        {" "}Ảnh co giãn đầy khung. Khoảng cách giữa các vé {TICKET_BACK_GAP_MM / 10} cm để cắt; không chừa khoảng cách sau vé cuối.
      </p>
      <p className="w-full text-xs text-black/60">Chọn A4 dọc, tỷ lệ 100%, lề Không, tắt đầu trang/chân trang và bật in không viền nếu máy hỗ trợ. Khi in mặt trước lên giấy đã cắt, giữ tỷ lệ 100%.</p>
    </div>
    <div className="ticket-back-page" aria-label={`${TICKET_BACKS_PER_A4} mặt sau vé trên một tờ A4`}>
      {Array.from({ length: TICKET_BACKS_PER_A4 }, (_, index) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={index} src="/matsau.jpg" alt={`Mặt sau vé ${index + 1}`} onLoad={() => setLoaded(count => count + 1)} onError={() => setError(true)} className="ticket-back-image" />
      ))}
    </div>
    {error && <p role="alert" className="ticket-back-error mt-4 text-red-700">Không tải được ảnh mặt sau. Hãy tải lại trang trước khi in.</p>}
  </main>;
}
