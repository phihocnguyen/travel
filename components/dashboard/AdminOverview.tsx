"use client";
import Link from "next/link";
import { useState } from "react";
import { Table,TableBody,TableCell,TableHead,TableHeader,TableRow } from "@/components/ui/table";
import { TablePagination,useTablePageSize } from "./TablePagination";
import UserInsightsTable from "./UserInsightsTable";
import type { UserInsights } from "@/lib/users/admin";

type Ticket={id:string;code?:string;ownerName:string;printed:boolean;collected:boolean};
type Post={id:string;title:string;author:{name:string};status:string};
export default function AdminOverview({stats,tickets,posts,insights}:{stats:{label:string;value:number;href:string}[];tickets:Ticket[];posts:Post[];insights:UserInsights}){
  const [tab,setTab]=useState("users"),[page,setPage]=useState(0),{ref,size}=useTablePageSize();
  const pending=posts.filter(post=>post.status==="pending");
  const total=tab==="stats"?stats.length:tab==="tickets"?tickets.length:pending.length;
  const pages=Math.max(1,Math.ceil(total/size)),current=Math.min(page,pages-1);
  return <div className="flex h-full min-h-0 flex-col gap-4"><header className="shrink-0"><h1 className="text-xl font-semibold tracking-tight">Tổng quan</h1><p className="mt-1 text-xs text-zinc-500">Tình hình vé, in ấn và bài viết của chiến dịch.</p></header>
    <div role="group" aria-label="Nội dung tổng quan" className="flex shrink-0 gap-1 self-start rounded-md bg-zinc-100 p-1">{[["users","Người dùng"],["stats","Thống kê"],["tickets","Vé gần đây"],["posts","Bài chờ duyệt"]].map(([value,label])=><button type="button" key={value} aria-pressed={tab===value} onClick={()=>{setTab(value);setPage(0);}} className={`rounded px-3 py-1.5 text-xs ${tab===value?"bg-white font-medium shadow-sm":"text-zinc-500"}`}>{label}</button>)}</div>
    {tab==="users"&&<UserInsightsTable initial={insights}/>}<section className={`min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white ${tab==="users"?"hidden":"flex"}`}><div ref={ref} className="min-h-0 flex-1 overflow-auto"><Table>
      <TableHeader><TableRow>{(tab==="stats"?["Chỉ số","Số lượng","Chi tiết"]:tab==="tickets"?["Mã vé","Người tạo","Trạng thái","Thao tác"]:["Tiêu đề","Tác giả","Trạng thái","Thao tác"]).map(label=><TableHead key={label}>{label}</TableHead>)}</TableRow></TableHeader>
      <TableBody>
        {tab==="stats"&&stats.slice(current*size,(current+1)*size).map(stat=><TableRow key={stat.label}><TableCell className="font-medium">{stat.label}</TableCell><TableCell className="font-mono">{stat.value.toLocaleString("vi-VN")}</TableCell><TableCell><Link href={stat.href} className="text-xs hover:underline">Xem chi tiết ↗</Link></TableCell></TableRow>)}
        {tab==="tickets"&&tickets.slice(current*size,(current+1)*size).map(ticket=><TableRow key={ticket.id}><TableCell className="font-mono font-medium">{ticket.code}</TableCell><TableCell>{ticket.ownerName}</TableCell><TableCell className="text-xs text-zinc-500">{ticket.collected?"Đã trao":ticket.printed?"Đã in":"Chưa in"}</TableCell><TableCell><Link href="/dashboard/admin/tickets" className="text-xs hover:underline">Quản lý vé ↗</Link></TableCell></TableRow>)}
        {tab==="posts"&&pending.slice(current*size,(current+1)*size).map(post=><TableRow key={post.id}><TableCell className="max-w-64 truncate font-medium">{post.title}</TableCell><TableCell>{post.author.name}</TableCell><TableCell className="text-xs text-zinc-500">Chờ duyệt</TableCell><TableCell><Link href="/dashboard/admin" className="text-xs hover:underline">Duyệt bài ↗</Link></TableCell></TableRow>)}
        {total===0&&<TableRow><TableCell colSpan={4} className="h-36 text-center text-zinc-500">Chưa có dữ liệu.</TableCell></TableRow>}
      </TableBody>
    </Table></div><TablePagination page={current} pages={pages} total={total} onChange={setPage}/></section>
  </div>;
}
