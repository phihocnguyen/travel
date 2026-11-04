import type { Metadata } from "next";
import Link from "next/link";
import { listApprovedPosts } from "@/lib/posts/store";
import { POST_CATEGORIES } from "@/lib/posts/types";
import { foldSearch,postDescription } from "@/lib/posts/presentation";
import BlogHeader from "@/components/blog/BlogHeader";
import BlogFooter from "@/components/blog/BlogFooter";
import BlogCard from "@/components/blog/BlogCard";
export const instant=false;
export const metadata:Metadata={title:"Bài viết · Vị Xoài Dẫn Lối",description:"Bài viết về điểm đến, ẩm thực, cẩm nang và kinh nghiệm du lịch Cao Lãnh, Đồng Tháp."};
const PAGE_SIZE=6;
function queryUrl(q:string,category:string,page=1){const params=new URLSearchParams();if(q)params.set("q",q);if(category)params.set("category",category);if(page>1)params.set("page",String(page));return `/blog${params.size?`?${params}`:""}`;}
export default async function BlogPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
  const params=await searchParams,value=(key:string)=>typeof params[key]==="string"?params[key] as string:"";
  const q=value("q").trim().slice(0,100),category=POST_CATEGORIES.find(item=>item===value("category"))??"";
  const posts=await listApprovedPosts();
  const filtered=posts.filter(post=>(!category||post.category===category)&&(!q||foldSearch(`${post.title} ${post.author.name} ${postDescription(post)}`).includes(foldSearch(q))));
  const pages=Math.max(1,Math.ceil(filtered.length/PAGE_SIZE)),page=Math.min(pages,Math.max(1,parseInt(value("page"),10)||1));
  const visible=filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
  return <div data-blog-page className="min-h-dvh bg-[#f7f8f7] font-sans text-zinc-900">
    <BlogHeader/>
    <main className="mx-auto max-w-[1180px] px-5 pb-16 pt-10 sm:px-8 sm:pt-14">
      <header className="mx-auto max-w-[620px] pb-8 text-center sm:pb-10"><p className="text-[10px] font-medium uppercase tracking-[.18em] text-zinc-500">Khám phá Cao Lãnh</p><h1 className="mt-3 text-[30px] font-semibold leading-[1.3] tracking-[-.04em] sm:text-[38px]">Bài viết và kinh nghiệm<br className="hidden sm:block"/> cho những chuyến đi.</h1><p className="mx-auto mt-4 max-w-lg text-sm leading-[1.8] text-zinc-500">Điểm đến, ẩm thực và những góc nhìn về vùng đất, con người Cao Lãnh.</p></header>
      <div className="mb-7 flex flex-col justify-between gap-5 border-y border-zinc-200 py-4 md:flex-row md:items-center">
        <nav aria-label="Danh mục bài viết" className="flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-zinc-500">{["",...POST_CATEGORIES].map(item=><Link key={item} href={queryUrl(q,item)} aria-current={category===item?"page":undefined} className={`border-b-2 pb-1 transition-colors hover:text-zinc-900 ${category===item?"border-[#365731] font-semibold text-[#365731]":"border-transparent"}`}>{item||"Tất cả bài viết"}</Link>)}</nav>
        <form action="/blog" method="get" role="search" className="flex h-10 w-full items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 md:w-60"><svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 shrink-0 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/></svg><input type="search" name="q" defaultValue={q} placeholder="Tìm bài viết…" aria-label="Tìm bài viết" className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-zinc-400"/>{category&&<input type="hidden" name="category" value={category}/>}<button type="submit" aria-label="Tìm kiếm" className="text-sm text-zinc-400 hover:text-zinc-900">↵</button></form>
      </div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 text-xs"><h2 className="font-medium text-zinc-600">{q?`Kết quả cho “${q}”`:category||"Bài viết mới nhất"}</h2><span className="text-zinc-400">{filtered.length} bài viết</span></div>
      <section aria-label="Danh sách bài viết">
        {visible.length?<div className="grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">{visible.map(post=><BlogCard key={post.id} post={post}/>)}</div>:<div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-md border border-dashed border-zinc-200 bg-white p-8 text-center"><h2 className="text-lg font-medium">{posts.length?"Không tìm thấy bài viết phù hợp.":"Chưa có bài viết."}</h2><p className="max-w-sm text-sm leading-relaxed text-zinc-500">{posts.length?"Thử từ khóa khác hoặc xem lại tất cả bài viết.":"Các bài viết mới sẽ được cập nhật tại đây."}</p>{posts.length>0&&<Link href="/blog" className="mt-2 text-xs font-medium text-[#365731] underline underline-offset-4">Xem tất cả bài viết</Link>}</div>}
        {pages>1&&<nav aria-label="Phân trang blog" className="mt-9 flex items-center justify-between gap-3 text-xs"><span className="text-zinc-500">Trang {page} / {pages}</span><div className="flex gap-2">{page>1&&<Link href={queryUrl(q,category,page-1)} className="rounded-md border border-zinc-200 bg-white px-4 py-2 hover:bg-zinc-50">← Trang trước</Link>}{page<pages&&<Link href={queryUrl(q,category,page+1)} className="rounded-md border border-zinc-200 bg-white px-4 py-2 hover:bg-zinc-50">Trang sau →</Link>}</div></nav>}
      </section>
    </main>
    <BlogFooter/>
  </div>;
}
