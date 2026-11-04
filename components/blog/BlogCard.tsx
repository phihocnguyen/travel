import Link from "next/link";
import type { BlogPost } from "@/lib/posts/types";
import { postDescription,postDate,readingMinutes } from "@/lib/posts/presentation";
import BlogCover from "./BlogCover";

export default function BlogCard({post}:{post:BlogPost}){
  return <article className="group flex min-w-0 flex-col overflow-hidden rounded-md border border-zinc-200 bg-white transition-shadow duration-200 hover:shadow-md">
    <Link href={`/blog/${post.id}`} aria-label={`Đọc bài: ${post.title}`} className="block focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#263f30]">
      <BlogCover src={post.coverImageUrl} alt={post.title} className="aspect-[3/2]"/>
    </Link>
    <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
      <div className="flex items-center justify-between gap-3 text-[11px]"><span className="font-medium text-[#56724e]">{post.category}</span><span className="max-w-[55%] truncate text-zinc-400">{post.author.name}</span></div>
      <Link href={`/blog/${post.id}`} className="mt-2.5"><h2 className="line-clamp-2 text-[19px] font-semibold leading-[1.45] tracking-[-.025em] text-zinc-900 transition-colors hover:text-[#46633e]">{post.title}</h2></Link>
      <p className="mt-3 line-clamp-3 text-[13px] leading-[1.8] text-zinc-500">{postDescription(post)}</p>
    </div>
    <footer className="flex items-center justify-between gap-3 border-t border-zinc-100 px-5 py-3 text-[11px] text-zinc-500">
      <time className="flex items-center gap-1.5"><svg aria-hidden viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M8 3v4m8-4v4M4 11h16"/></svg>{postDate(post)}</time>
      <span className="flex items-center gap-1.5"><svg aria-hidden viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>{readingMinutes(post.content)} phút đọc</span>
    </footer>
  </article>;
}
