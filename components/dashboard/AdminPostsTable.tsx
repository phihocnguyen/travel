"use client";
import { useState } from "react";
import type { BlogPost } from "@/lib/posts/types";
import { POST_STATUS_LABELS } from "@/lib/posts/types";
import { Table,TableHeader,TableBody,TableRow,TableHead,TableCell } from "@/components/ui/table";
import { TablePagination,useTablePageSize } from "./TablePagination";
import DetailDialog from "./DetailDialog";
import { ReviewActions } from "./ReviewActions";
import BlogBody from "@/components/blog/BlogBody";

export default function AdminPostsTable({posts}:{posts:BlogPost[]}){
  const [query,setQuery]=useState(""),[filter,setFilter]=useState("pending"),[selected,setSelected]=useState<BlogPost|null>(null),[page,setPage]=useState(0);
  const {ref,size}=useTablePageSize();
  const filtered=posts.filter(post=>(filter==="all"||post.status===filter)&&`${post.title} ${post.author.name} ${post.author.email}`.toLocaleLowerCase("vi").includes(query.toLocaleLowerCase("vi")));
  const pages=Math.max(1,Math.ceil(filtered.length/size)),current=Math.min(page,pages-1);
  return <div className="flex h-full min-h-0 flex-col gap-3">
    <header className="shrink-0"><h1 className="text-xl font-semibold tracking-tight">Quản lý bài viết</h1><p className="mt-1 text-xs text-black/50">{posts.length} bài viết · {posts.filter(post=>post.status==="pending").length} chờ duyệt</p></header>
    <div className="flex shrink-0 flex-wrap gap-2"><input aria-label="Tìm bài viết" value={query} onChange={event=>{setQuery(event.target.value);setPage(0);}} placeholder="Tìm tiêu đề, tác giả…" className="min-w-0 flex-1 rounded-md border border-black/15 bg-white px-3 py-2 text-sm"/><select aria-label="Trạng thái bài viết" value={filter} onChange={event=>{setFilter(event.target.value);setPage(0);}} className="rounded-md border border-black/15 bg-white px-3 py-2 text-xs"><option value="all">Tất cả</option>{Object.entries(POST_STATUS_LABELS).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></div>
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-black/10 bg-white"><div ref={ref} className="min-h-0 flex-1 overflow-auto"><Table><TableHeader><TableRow><TableHead>Tiêu đề</TableHead><TableHead>Tác giả</TableHead><TableHead>Danh mục</TableHead><TableHead>Trạng thái</TableHead><TableHead>Cập nhật</TableHead><TableHead className="text-right">Thao tác</TableHead></TableRow></TableHeader><TableBody>
      {filtered.slice(current*size,(current+1)*size).map(post=><TableRow key={post.id}><TableCell className="max-w-64 truncate font-medium">{post.title}</TableCell><TableCell className="max-w-44 truncate text-xs">{post.author.name}</TableCell><TableCell className="whitespace-nowrap text-xs">{post.category}</TableCell><TableCell className="whitespace-nowrap text-xs">{POST_STATUS_LABELS[post.status]}</TableCell><TableCell className="whitespace-nowrap text-xs text-black/50">{new Date(post.updatedAt).toLocaleDateString("vi-VN")}</TableCell><TableCell className="text-right"><button type="button" className="whitespace-nowrap rounded-md border border-black/15 px-3 py-1.5 text-xs" onClick={()=>setSelected(post)}>Xem & duyệt ↗</button></TableCell></TableRow>)}
      {!filtered.length&&<TableRow><TableCell colSpan={6} className="h-36 text-center text-black/45">Không có bài viết phù hợp.</TableCell></TableRow>}
    </TableBody></Table></div><TablePagination page={current} pages={pages} total={filtered.length} onChange={setPage}/></section>
    {selected&&<DetailDialog title={selected.title} onClose={()=>setSelected(null)}><Table><TableBody>{[["Tác giả",`${selected.author.name} · ${selected.author.email}`],["Danh mục",selected.category],["Trạng thái",POST_STATUS_LABELS[selected.status]],["Mô tả",selected.excerpt],["Ghi chú duyệt",selected.reviewNote??"—"]].map(([label,value])=><TableRow key={label}><TableCell className="w-32 text-black/50">{label}</TableCell><TableCell>{value}</TableCell></TableRow>)}</TableBody></Table><div className="max-h-80 overflow-y-auto rounded-lg border border-black/10 bg-white p-4"><BlogBody content={selected.content} format={selected.contentFormat}/></div><ReviewActions postId={selected.id} onComplete={()=>setSelected(null)}/></DetailDialog>}
  </div>;
}
