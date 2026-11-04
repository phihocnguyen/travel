"use client";
import { useRef, useState } from "react";
import TicketPreview from "./TicketPreview";
import { downloadTicket, ticketPng } from "@/lib/tickets/export";
import type { TicketDesign } from "@/lib/tickets/types";

export default function TicketDownload({ ticket }: {ticket: TicketDesign}) {
  const preview = useRef<HTMLDivElement>(null);
  const [busy,setBusy] = useState(false), [error,setError] = useState("");
  return <div className="flex h-full min-h-0 flex-col gap-3">
    <div className="flex min-h-0 flex-1 items-center justify-center [container-type:size]"><TicketPreview design={ticket} rootRef={preview} className="aspect-[103/58] w-[min(100cqw,calc(95cqh*103/58))] rounded-md" /></div>
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-3"><button type="button" disabled={busy} className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs font-medium disabled:opacity-50" onClick={async()=>{
      setBusy(true);setError("");try { if(preview.current) downloadTicket(await ticketPng(preview.current),ticket.code??"ve-cua-toi"); } catch {setError("Không thể tải ảnh vé. Hãy thử lại.");} finally {setBusy(false);}
    }}>{busy?"Đang xuất ảnh…":"Tải vé PNG"}</button><span className="font-mono text-sm font-semibold">{ticket.code}</span></div>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
  </div>;
}
