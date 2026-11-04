import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPost,listApprovedPosts } from "@/lib/posts/store";
import { postPlainText } from "@/lib/posts/content";
import { articleHeadings,postDate,readingMinutes } from "@/lib/posts/presentation";
import BlogHeader from "@/components/blog/BlogHeader";
import BlogFooter from "@/components/blog/BlogFooter";
import BlogCover from "@/components/blog/BlogCover";
import BlogBody from "@/components/blog/BlogBody";
import BlogShare from "@/components/blog/BlogShare";
import BlogCard from "@/components/blog/BlogCard";
export const instant=false;
type PageProps={params:Promise<{id:string}>};
export async function generateMetadata({params}:PageProps):Promise<Metadata>{
  const {id}=await params,post=await getPost(id);if(!post||post.status!=="approved")return {title:"Không tìm thấy bài viết"};
  const description=post.excerpt||postPlainText(post.content).slice(0,160);
  return {title:`${post.title} · Vị Xoài Dẫn Lối`,description,openGraph:{type:"article",title:post.title,description,authors:[post.author.name],publishedTime:post.reviewedAt??post.createdAt,modifiedTime:post.updatedAt,images:post.coverImageUrl?[{url:post.coverImageUrl}]:undefined}};
}
export default async function BlogPostPage({params}:PageProps){
  const {id}=await params,post=await getPost(id);if(!post||post.status!=="approved")notFound();
  const {html,headings}=articleHeadings(post.content);
  const related=(await listApprovedPosts()).filter(item=>item.id!==post.id).sort((a,b)=>Number(b.category===post.category)-Number(a.category===post.category)).slice(0,3);
  const contents=<ol className="space-y-3">{headings.map(heading=><li key={heading.id} className={heading.level===3?"pl-3":""}><a href={`#${heading.id}`} className="block border-l border-[#263b2d]/15 pl-3 text-xs leading-[1.7] text-[#66715f] transition-colors hover:border-[#263b2d] hover:text-[#263b2d]">{heading.title}</a></li>)}</ol>;
  return <div data-blog-page className="min-h-dvh bg-white font-sans text-[#263b2d]">
    <BlogHeader/>
    <main className="mx-auto max-w-[1240px] px-5 pb-16 sm:px-8">
      <nav aria-label="Đường dẫn bài viết" className="flex flex-wrap items-center gap-2 py-6 text-xs text-[#66715f]"><Link href="/blog" className="hover:text-[#263b2d]">Bài viết</Link><span aria-hidden>/</span><Link href={`/blog?category=${encodeURIComponent(post.category)}`} className="text-[#5e7056] hover:underline">{post.category}</Link></nav>
      <article>
        <header className="mx-auto max-w-[900px] pb-8 pt-3 sm:pb-10 sm:pt-6">
          <p className="text-center text-xs font-medium uppercase tracking-[.2em] text-[#7f8b6b]">{post.category}</p>
          <h1 className="mt-4 text-center font-display text-[clamp(2rem,4vw,3.1rem)] font-medium leading-[1.16] tracking-[-.04em]">{post.title}</h1>
          {post.excerpt&&<p className="mx-auto mt-5 max-w-[670px] text-center text-[14px] leading-[1.9] text-[#89907f]">{post.excerpt}</p>}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-[#66715f]"><span className="flex items-center gap-2 text-[#52634f]"><span aria-hidden className="grid h-6 w-6 place-items-center rounded-full bg-[#e9ecdf] text-[9px]">{post.author.name.charAt(0).toUpperCase()}</span>{post.author.name}</span><span className="hidden h-3 w-px bg-[#263b2d]/15 sm:block"/><time dateTime={post.reviewedAt??post.createdAt}>{postDate(post)}</time><span aria-hidden>·</span><span>{readingMinutes(post.content)} phút đọc</span></div>
        </header>
        {post.coverImageUrl&&<figure className="mb-10 sm:mb-14"><BlogCover src={post.coverImageUrl} alt={post.title} priority className="aspect-[4/3] max-h-[480px] rounded-sm sm:aspect-[21/10]"/></figure>}
        <div className="grid gap-8 lg:grid-cols-[180px_minmax(0,720px)_1fr] lg:gap-10">
          <aside aria-label="Mục lục bài viết" className="hidden lg:block"><div className="sticky top-24">{headings.length>0?<><p className="mb-5 text-[9px] font-semibold uppercase tracking-[.2em] text-[#627257]">Nội dung bài viết</p>{contents}</>:<Link href="/blog" className="text-xs text-[#89907f] hover:text-[#263b2d]">← Tất cả bài viết</Link>}<div className="mt-7 border-t border-[#263b2d]/10 pt-5"><p className="text-xs leading-[1.8] text-[#9aa18f]">Một góc nhìn được gửi đến từ cộng đồng chu du.</p></div></div></aside>
          <div className="min-w-0">
            {headings.length>0&&<details className="mb-7 border-y border-[#263b2d]/15 py-4 lg:hidden"><summary className="cursor-pointer text-xs font-medium">Mục lục bài viết</summary><div className="pt-4">{contents}</div></details>}
            <div id="blog-article-body" className="blog-article"><BlogBody content={html} format="html"/></div>
            <footer className="mt-12 border-t border-[#263b2d]/15 pt-6"><div className="flex flex-wrap items-center justify-between gap-4"><Link href={`/blog?category=${encodeURIComponent(post.category)}`} className="border-b border-[#263b2d]/20 pb-1 text-xs text-[#78856b]">Đọc thêm về {post.category.toLocaleLowerCase("vi")}</Link><BlogShare title={post.title}/></div><div className="mt-8 flex items-center gap-4 bg-[#f0f1e9] p-5"><span aria-hidden className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#263b2d]/15 font-display text-lg">{post.author.name.charAt(0).toUpperCase()}</span><div><p className="text-[9px] uppercase tracking-[.15em] text-[#99a08e]">Tác giả</p><p className="mt-1 text-sm font-medium">{post.author.name}</p><p className="mt-1 text-xs leading-relaxed text-[#89907f]">Chia sẻ những điều đáng nhớ qua mỗi hành trình.</p></div></div></footer>
          </div>
          <div aria-hidden className="hidden lg:block"/>
        </div>
      </article>
      {related.length>0&&<section className="mt-16 border-t border-[#263b2d]/15 pt-9 sm:mt-24"><div className="mb-7 flex items-center justify-between"><h2 className="font-display text-2xl tracking-tight">Bài viết liên quan</h2><Link href="/blog" className="text-xs text-[#89907f] hover:text-[#263b2d]">Xem tất cả ↗</Link></div><div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">{related.map(item=><BlogCard key={item.id} post={item}/>)}</div></section>}
    </main>
    <BlogFooter/>
  </div>;
}
