import Link from "next/link";
export default function BlogFooter(){
  return <footer className="border-t border-[#263f30]/10 bg-[#f7f8f4]"><div className="mx-auto flex max-w-[1240px] flex-col justify-between gap-4 px-5 py-7 text-xs text-[#66715f] sm:flex-row sm:items-center sm:px-8"><div><p className="font-medium text-[#263f30]">Vị Xoài Dẫn Lối</p><p className="mt-1 text-[11px]">Cao Lãnh · Đồng Tháp</p></div><nav aria-label="Liên kết cuối trang" className="flex flex-wrap gap-5"><Link href="/" className="hover:underline">Trang chủ</Link><Link href="/map" className="hover:underline">Khám phá bản đồ</Link><Link href="/blog" className="hover:underline">Bài viết</Link></nav></div></footer>;
}
