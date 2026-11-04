"use client";
import Link from "next/link";
import { useEffect,useState } from "react";
import type { UserInsights } from "@/lib/users/admin";
import { Table,TableBody,TableCell,TableHead,TableHeader,TableRow } from "@/components/ui/table";
import { TablePagination,useTablePageSize } from "./TablePagination";

export default function UserInsightsTable({initial}:{initial:UserInsights}){
  const [data,setData]=useState(initial),[daily,setDaily]=useState(false),[page,setPage]=useState(0),[revision,setRevision]=useState(0),[error,setError]=useState("");
  const {ref,size}=useTablePageSize();
  useEffect(()=>{
    const controller=new AbortController();
    const load=async()=>{try{const response=await fetch("/api/admin/insights",{cache:"no-store",signal:controller.signal});if(!response.ok)throw new Error();setData(await response.json());setError("");}catch{if(!controller.signal.aborted)setError("Chưa cập nhật được dữ liệu. Đang hiển thị kết quả gần nhất.");}};
    void load();const timer=setInterval(()=>{if(document.visibilityState==="visible")void load();},30_000);
    return()=>{clearInterval(timer);controller.abort();};
  },[revision]);
  const metrics=[
    {label:"Người dùng đang online",value:data.online,href:"/dashboard/admin/users?status=online"},
    {label:"Người dùng mới hôm nay",value:data.newToday,href:"/dashboard/admin/users?period=today"},
    {label:"Người dùng mới trong 7 ngày",value:data.new7Days,href:"/dashboard/admin/users?period=7"},
    {label:"Người dùng mới trong 30 ngày",value:data.new30Days,href:"/dashboard/admin/users?period=30"},
    {label:"Tổng người dùng",value:data.total,href:"/dashboard/admin/users"},
    {label:"Người dùng hoạt động trong 7 ngày",value:data.active7Days,href:"/dashboard/admin/users"},
    {label:"Tài khoản đã khóa",value:data.disabled,href:"/dashboard/admin/users?status=disabled"},
    {label:"Người dùng đã tạo vé",value:data.withTicket,href:"/dashboard/admin/tickets"},
    {label:"Tỷ lệ người dùng tạo vé",value:data.total?Math.round(data.withTicket/data.total*1000)/10:0,unit:"%",href:"/dashboard/admin/tickets"},
  ];
  const total=daily?data.daily.length:metrics.length,pages=Math.max(1,Math.ceil(total/size)),current=Math.min(page,pages-1);
  return <div className="flex min-h-0 flex-1 flex-col gap-3"><div className="flex shrink-0 flex-wrap gap-2"><button type="button" aria-pressed={!daily} onClick={()=>{setDaily(false);setPage(0);}} className={`rounded-md border px-3 py-1.5 text-xs ${daily?"border-zinc-200":"border-zinc-400 bg-zinc-50"}`}>Chỉ số người dùng</button><button type="button" aria-pressed={daily} onClick={()=>{setDaily(true);setPage(0);}} className={`rounded-md border px-3 py-1.5 text-xs ${daily?"border-zinc-400 bg-zinc-50":"border-zinc-200"}`}>Người dùng mới theo ngày</button><button type="button" onClick={()=>setRevision(n=>n+1)} className="rounded-md border border-zinc-200 px-3 py-1.5 text-xs">Làm mới</button></div>
    <p className="shrink-0 text-[11px] text-zinc-500">{error||`Online: tài khoản có tín hiệu trong 2 phút gần nhất. Tự cập nhật mỗi 30 giây. Giờ Việt Nam · ${new Date(data.updatedAt).toLocaleTimeString("vi-VN",{timeZone:"Asia/Ho_Chi_Minh"})}.`}</p>
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white"><div ref={ref} className="min-h-0 flex-1 overflow-auto"><Table>
      <TableHeader><TableRow>{(daily?["Ngày","Người dùng mới"]:["Chỉ số","Số lượng / Tỷ lệ","Chi tiết"]).map(label=><TableHead key={label}>{label}</TableHead>)}</TableRow></TableHeader>
      <TableBody>{daily?data.daily.slice(current*size,(current+1)*size).map(day=><TableRow key={day.day}><TableCell>{day.day.split("-").reverse().join("/")}</TableCell><TableCell className="font-mono">{day.newUsers.toLocaleString("vi-VN")}</TableCell></TableRow>):metrics.slice(current*size,(current+1)*size).map(stat=><TableRow key={stat.label}><TableCell className="font-medium">{stat.label}</TableCell><TableCell className="font-mono">{stat.value.toLocaleString("vi-VN")}{stat.unit}</TableCell><TableCell><Link href={stat.href} className="whitespace-nowrap text-xs hover:underline">Xem chi tiết ↗</Link></TableCell></TableRow>)}</TableBody>
    </Table></div><TablePagination page={current} pages={pages} total={total} onChange={setPage}/></section>
  </div>;
}
