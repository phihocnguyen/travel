"use client";
import { useRef, useState } from "react";
import TicketPreview from "./TicketPreview";
import { ticketPng } from "@/lib/tickets/export";
import type { listAdminTickets } from "@/lib/tickets/store";
import { Table,TableHeader,TableBody,TableRow,TableHead,TableCell } from "@/components/ui/table";
import { TablePagination,useTablePageSize } from "./TablePagination";
import DetailDialog from "./DetailDialog";

type AdminTicket=Awaited<ReturnType<typeof listAdminTickets>>[number];
function status(ticket:AdminTicket){return ticket.collected?"Đã trao":ticket.printed?"Đã in":ticket.printStatus==="processing"?"Đang in":"Chưa in";}
export default function AdminTickets({initialTickets}:{initialTickets:AdminTicket[]}){
  const [tickets,setTickets]=useState(initialTickets),[code,setCode]=useState("");
  const [selected,setSelected]=useState(""),[page,setPage]=useState(0),[filter,setFilter]=useState("all");
  const [busy,setBusy]=useState(false),[message,setMessage]=useState("");
  const preview=useRef<HTMLDivElement>(null),{ref,size}=useTablePageSize();
  const ticket=tickets.find(item=>item.id===selected);
  const filtered=tickets.filter(item=>filter==="all"||status(item)===filter);
  const pages=Math.max(1,Math.ceil(filtered.length/size)),current=Math.min(page,pages-1);
  async function refresh(search=code){
    const response=await fetch(`/api/admin/tickets?code=${encodeURIComponent(search.trim().toUpperCase())}`,{cache:"no-store"});
    const data=await response.json();if(!response.ok)throw new Error(data.error);
    setTickets(data.tickets);setPage(0);
  }
  async function action(value:string){
    if(!ticket)return;setBusy(true);setMessage("");
    try{
      const image=(value==="start"||value==="render")&&preview.current?await ticketPng(preview.current):undefined;
      const response=await fetch(`/api/admin/tickets/${ticket.id}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:value,image,expectedUpdatedAt:ticket.updatedAt})});
      const data=await response.json();if(!response.ok)throw new Error(data.error);
      setMessage(value==="start"||value==="render"?"File in màu 1417 × 827 px, 300 DPI đã sẵn sàng.":value==="collect"?"Đã xác nhận trao vé.":value==="printed"?"Đã xác nhận in thành công.":"Đã hủy lệnh in. User có thể sửa vé.");
      await refresh();
    }catch(error){setMessage(error instanceof Error?error.message:"Không thể xử lý vé.");}finally{setBusy(false);}
  }
  const button="rounded-md border border-black/15 bg-white px-3 py-2 text-xs font-medium transition-colors hover:bg-black/5 disabled:opacity-40";
  return <div className="flex h-full min-h-0 flex-col gap-3">
    <header className="shrink-0"><h1 className="text-xl font-semibold tracking-tight">Quản lý vé</h1><p className="mt-1 text-xs text-black/50">Tra cứu ID, kiểm tra thiết kế và quản lý in / trao vé.</p></header>
    <form className="flex shrink-0 flex-wrap gap-2" onSubmit={async(event)=>{event.preventDefault();setBusy(true);setMessage("");try{await refresh();}catch(error){setMessage(error instanceof Error?error.message:"Không thể tra cứu.");}finally{setBusy(false);}}}>
      <input aria-label="Mã vé" value={code} onChange={event=>setCode(event.target.value.toUpperCase())} placeholder="VXDL000" maxLength={7} pattern="VXDL[0-9]{3}" className="w-36 rounded-md border border-black/15 bg-white px-3 py-2 font-mono text-sm uppercase"/>
      <button disabled={busy} className={button}>Kiểm tra ID</button>
      <button type="button" disabled={busy} className={button} onClick={async()=>{setCode("");setBusy(true);try{await refresh("");}catch{setMessage("Không tải được danh sách.");}finally{setBusy(false);}}}>Tải lại danh sách</button>
      <select aria-label="Lọc trạng thái vé" value={filter} onChange={event=>{setFilter(event.target.value);setPage(0);}} className="ml-auto rounded-md border border-black/15 bg-white px-3 py-2 text-xs"><option value="all">Tất cả trạng thái</option>{["Chưa in","Đang in","Đã in","Đã trao"].map(value=><option key={value}>{value}</option>)}</select>
    </form>
    {message&&!ticket&&<p role="status" className="shrink-0 rounded-md border border-black/10 bg-white p-2 text-xs">{message}</p>}
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-black/10 bg-white">
      <div ref={ref} className="min-h-0 flex-1 overflow-auto"><Table><TableHeader><TableRow><TableHead>Mã vé</TableHead><TableHead>Người tạo</TableHead><TableHead>Email</TableHead><TableHead>Cập nhật</TableHead><TableHead>Trạng thái</TableHead><TableHead className="text-right">Thao tác</TableHead></TableRow></TableHeader>
        <TableBody>{filtered.slice(current*size,(current+1)*size).map(item=><TableRow key={item.id}>
          <TableCell className="font-mono font-semibold">{item.code}</TableCell><TableCell className="max-w-40 truncate">{item.ownerName}</TableCell><TableCell className="max-w-52 truncate text-xs text-black/55">{item.ownerEmail??"—"}</TableCell><TableCell className="whitespace-nowrap text-xs text-black/55">{new Date(item.updatedAt).toLocaleDateString("vi-VN")}</TableCell><TableCell><span className="whitespace-nowrap rounded-md border border-black/10 px-2 py-1 text-[11px]">{status(item)}</span></TableCell><TableCell className="text-right"><button type="button" className={button} aria-label={`Xem vé ${item.code}`} onClick={()=>{setSelected(item.id);setMessage("");}}>Xem vé ↗</button></TableCell>
        </TableRow>)}{!filtered.length&&<TableRow><TableCell colSpan={6} className="h-36 text-center text-black/45">Không tìm thấy vé.</TableCell></TableRow>}</TableBody>
      </Table></div><TablePagination page={current} pages={pages} total={filtered.length} onChange={setPage}/>
    </section>
    {ticket&&<DetailDialog title={ticket.code!} onClose={()=>{if(!busy)setSelected("");}}>
      <div><TicketPreview key={ticket.updatedAt} design={ticket} rootRef={preview} className="mx-auto aspect-[1417/827] w-full max-w-xl rounded-lg"/></div>
      <Table><TableBody>{[["Người tạo",ticket.ownerName],["Email",ticket.ownerEmail??"—"],["Mã vé",ticket.code],["Trạng thái",status(ticket)],["Lời nhắn",ticket.message],["File in","In màu · 1417 × 827 px · 300 DPI"]].map(([label,value])=><TableRow key={label}><TableCell className="w-32 text-xs text-black/50">{label}</TableCell><TableCell className="whitespace-pre-line text-xs">{value}</TableCell></TableRow>)}</TableBody></Table>
      {message&&<p role="status" className="text-sm">{message}</p>}
      <div className="flex flex-wrap gap-2">
        {!ticket.printed&&ticket.printStatus!=="processing"&&<button type="button" className={button} disabled={busy} onClick={()=>action("start")}>{busy?"Đang xử lý…":"Chuẩn bị file in"}</button>}
        {(ticket.printStatus==="processing"||ticket.printed)&&<a className={button} href={`/print/tickets/${ticket.id}`} target="_blank" rel="noreferrer">Mở trang in / tải PNG ↗</a>}
        {(ticket.printStatus==="processing"||ticket.printed)&&<button type="button" className={button} disabled={busy} onClick={()=>action("render")}>Tạo lại file in màu</button>}
        {ticket.printStatus==="processing"&&<><button type="button" className={button} disabled={busy} onClick={()=>action("printed")}>Xác nhận đã in</button><button type="button" className={button} disabled={busy} onClick={()=>action("cancel")}>Hủy lệnh in</button></>}
        {ticket.printed&&!ticket.collected&&<button type="button" className={button} disabled={busy} onClick={()=>{if(window.confirm(`Xác nhận đã trao vé ${ticket.code}?`))void action("collect");}}>Xác nhận đã trao</button>}
        {ticket.collected&&<span className="px-3 py-2 text-sm font-semibold">Đã trao · không trao lại</span>}
      </div>
    </DetailDialog>}
  </div>;
}
