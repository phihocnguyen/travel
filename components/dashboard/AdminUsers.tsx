"use client";
import { useEffect,useState } from "react";
import Link from "next/link";
import type { AdminUser,UserList } from "@/lib/users/admin";
import { Table,TableBody,TableCell,TableHead,TableHeader,TableRow } from "@/components/ui/table";
import { TablePagination } from "./TablePagination";
import DetailDialog from "./DetailDialog";

function date(value:string|null){return value?new Date(value).toLocaleString("vi-VN",{timeZone:"Asia/Ho_Chi_Minh",dateStyle:"short",timeStyle:"short"}):"Chưa ghi nhận";}
export default function AdminUsers({initial,initialQuery,initialStatus,initialPeriod}:{initial:UserList;initialQuery:string;initialStatus:string;initialPeriod:string}){
  const [data,setData]=useState(initial),[q,setQ]=useState(initialQuery),[status,setStatus]=useState(initialStatus),[period,setPeriod]=useState(initialPeriod),[page,setPage]=useState(initial.page),[revision,setRevision]=useState(0);
  const [busy,setBusy]=useState(false),[error,setError]=useState(""),[pending,setPending]=useState<AdminUser|null>(null),[saving,setSaving]=useState(false);
  useEffect(()=>{
    const controller=new AbortController();
    const load=async()=>{
      setBusy(true);
      try{const response=await fetch(`/api/admin/users?${new URLSearchParams({q,status,period,page:String(page),size:"10"})}`,{signal:controller.signal,cache:"no-store"});if(!response.ok)throw new Error("Không tải được danh sách người dùng.");setData(await response.json());setError("");}
      catch(e){if(!controller.signal.aborted)setError(e instanceof Error?e.message:"Không tải được dữ liệu.");}
      finally{if(!controller.signal.aborted)setBusy(false);}
    };
    const timer=setTimeout(()=>void load(),250),refresh=setInterval(()=>{if(document.visibilityState==="visible")void load();},30_000);
    return()=>{clearTimeout(timer);clearInterval(refresh);controller.abort();};
  },[q,status,period,page,revision]);
  const changeStatus=async()=>{
    if(!pending||saving)return;setSaving(true);
    try{const response=await fetch(`/api/admin/users/${pending.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:pending.status==="active"?"disabled":"active"})});const body=await response.json();if(!response.ok)throw new Error(body.error);setPending(null);setRevision(n=>n+1);}
    catch(e){setError(e instanceof Error?e.message:"Không cập nhật được tài khoản.");}finally{setSaving(false);}
  };
  return <div className="flex h-full min-h-0 flex-col gap-4">
    <header className="shrink-0"><h1 className="text-xl font-semibold tracking-tight">Quản lý người dùng</h1><p className="mt-1 text-xs text-zinc-500">Tài khoản đăng nhập, hoạt động gần nhất và nội dung đã tạo. Online: có tín hiệu trong 2 phút gần nhất.</p></header>
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      <input type="search" aria-label="Tìm người dùng" placeholder="Tìm tên hoặc email…" value={q} onChange={e=>{setQ(e.target.value);setPage(1);}} className="h-9 min-w-40 flex-1 rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-300 sm:max-w-xs"/>
      <select aria-label="Trạng thái người dùng" value={status} onChange={e=>{setStatus(e.target.value);setPage(1);}} className="h-9 rounded-md border border-zinc-200 bg-white px-2 text-xs"><option value="">Tất cả trạng thái</option><option value="online">Đang online</option><option value="active">Đang hoạt động</option><option value="disabled">Đã khóa</option></select>
      <select aria-label="Ngày tham gia" value={period} onChange={e=>{setPeriod(e.target.value);setPage(1);}} className="h-9 rounded-md border border-zinc-200 bg-white px-2 text-xs"><option value="">Tất cả ngày tham gia</option><option value="today">Mới hôm nay</option><option value="7">7 ngày qua</option><option value="30">30 ngày qua</option></select>
      <button type="button" onClick={()=>setRevision(n=>n+1)} className="h-9 rounded-md border border-zinc-200 px-3 text-xs">Làm mới</button>
    </div>
    {error&&<p role="alert" className="shrink-0 text-xs text-red-700">{error}</p>}
    <section aria-busy={busy} className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white"><div className="min-h-0 flex-1 overflow-auto"><Table>
      <TableHeader><TableRow>{["Người dùng","Trạng thái","Tham gia","Đăng nhập gần nhất","Hoạt động gần nhất","Số lần đăng nhập","Vé / Bài viết","Thao tác"].map(label=><TableHead key={label}>{label}</TableHead>)}</TableRow></TableHeader>
      <TableBody>{data.users.map(user=><TableRow key={user.id}>
        <TableCell><p className="whitespace-nowrap font-medium">{user.name}{user.protected&&<span className="ml-2 text-[10px] text-zinc-500">Quản trị</span>}</p><p className="mt-0.5 text-xs text-zinc-500">{user.email??"Chưa có email"}</p></TableCell>
        <TableCell><span className={`inline-flex items-center gap-1.5 whitespace-nowrap text-xs ${user.status==="disabled"?"text-zinc-400":user.online?"text-emerald-700":"text-zinc-600"}`}><span className={`h-1.5 w-1.5 rounded-full ${user.online?"bg-emerald-500":"bg-zinc-300"}`}/>{user.status==="disabled"?"Đã khóa":user.online?"Đang online":"Offline"}</span></TableCell>
        <TableCell className="whitespace-nowrap text-xs">{date(user.createdAt)}</TableCell>
        <TableCell className="whitespace-nowrap text-xs">{date(user.lastLoginAt)}{user.provider&&<p className="mt-0.5 text-zinc-400">{user.provider==="google"?"Google":"Email"}</p>}</TableCell>
        <TableCell className="whitespace-nowrap text-xs">{date(user.lastSeenAt)}</TableCell><TableCell className="font-mono text-xs">{user.loginCount}</TableCell>
        <TableCell className="whitespace-nowrap text-xs">{user.ticketCode?<Link href="/dashboard/admin/tickets" className="underline underline-offset-4">{user.ticketCode}</Link>:"Chưa có vé"}<p className="mt-1 text-zinc-500">{user.posts} bài viết</p></TableCell>
        <TableCell><button type="button" disabled={user.protected} onClick={()=>{setError("");setPending(user);}} className="whitespace-nowrap rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs hover:bg-zinc-50 disabled:opacity-30">{user.status==="active"?"Khóa":"Mở khóa"}</button></TableCell>
      </TableRow>)}{data.total===0&&<TableRow><TableCell colSpan={8} className="h-36 text-center text-zinc-500">Không tìm thấy người dùng.</TableCell></TableRow>}</TableBody>
    </Table></div><TablePagination page={data.page-1} pages={Math.max(1,Math.ceil(data.total/data.pageSize))} total={data.total} onChange={p=>setPage(p+1)}/></section>
    {pending&&<DetailDialog title={pending.status==="active"?"Khóa tài khoản?":"Mở khóa tài khoản?"} onClose={()=>{if(!saving)setPending(null);}}>
      <p className="text-sm text-zinc-500">{pending.name} ({pending.email}). {pending.status==="active"?"Người dùng sẽ bị kết thúc các phiên đăng nhập. Vé và bài viết được giữ lại.":"Người dùng có thể đăng nhập lại."}</p>
      {error&&<p role="alert" className="text-xs text-red-700">{error}</p>}
      <div className="flex justify-end gap-2"><button disabled={saving} onClick={()=>setPending(null)} className="rounded-md border px-3 py-2 text-xs">Hủy</button><button disabled={saving} onClick={()=>void changeStatus()} className="rounded-md bg-zinc-900 px-3 py-2 text-xs text-white disabled:opacity-50">{saving?"Đang lưu…":"Xác nhận"}</button></div>
    </DetailDialog>}
  </div>;
}
