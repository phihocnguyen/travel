import Link from "next/link";
import HeaderAccount from "@/components/auth/HeaderAccount";
import { ArrowLeft } from "lucide-react";
import BrandMark from "./BrandMark";

export default function SiteHeader({overlay=false,dark=false,active="home"}:{overlay?:boolean;dark?:boolean;active?:"home"|"blog"|"ugc"}){
  const text=dark?"text-white":"text-[#263f30]";
  const outline=dark?"border-white/40 hover:bg-white/10":"border-[#263f30]/20 hover:bg-[#263f30]/5";
  return <header data-site-header className={`${overlay?"absolute inset-x-0 top-0 z-[100]":"sticky top-0 z-30 border-b border-[#263f30]/10 bg-white/95 backdrop-blur-md"} ${text}`}>
    <div className="mx-auto flex h-[72px] max-w-[1240px] items-center justify-between gap-3 px-4 sm:px-8">
      <Link href="/" aria-label="Vị Xoài Dẫn Lối · Trang chủ" className="flex shrink-0 items-center gap-2.5">
        <BrandMark dark={dark} hideWordmarkOnMobile/>
      </Link>
      <nav aria-label="Điều hướng chính" className="flex shrink-0 items-center gap-2 sm:gap-3">
        <Link href="/" aria-label="Về trang chủ" data-cursor-magnet className={`inline-flex h-9 items-center justify-center gap-2 rounded-md border px-2.5 text-[11px] font-medium transition-colors sm:h-10 sm:px-4 sm:text-xs ${outline}`}><ArrowLeft size={15}/><span className="hidden sm:inline">Trang chủ</span></Link>
        <Link href="/map" data-cursor-magnet className={`inline-flex h-9 items-center justify-center rounded-md border px-3 text-[11px] font-medium transition-colors sm:h-10 sm:px-4 sm:text-xs ${outline}`}><span className="sm:hidden">Bản đồ</span><span className="hidden sm:inline">Khám phá bản đồ</span></Link>
        <Link href="/ugc" data-cursor-magnet aria-current={active==="ugc"?"page":undefined} className={`inline-flex h-9 items-center justify-center rounded-md border px-3 text-[11px] font-medium transition-colors sm:h-10 sm:px-4 sm:text-xs ${outline} ${active==="ugc"?(dark?"bg-white/15":"bg-[#263f30]/5 font-semibold"):""}`}>UGC Cover</Link>
        <HeaderAccount dark={dark} />
      </nav>
    </div>
  </header>;
}
