import Link from "next/link";
import HeaderAccount from "@/components/auth/HeaderAccount";

export default function SiteHeader({overlay=false,dark=false,active="home"}:{overlay?:boolean;dark?:boolean;active?:"home"|"blog"}){
  const text=dark?"text-white":"text-[#263f30]";
  const outline=dark?"border-white/40 hover:bg-white/10":"border-[#263f30]/20 hover:bg-[#263f30]/5";
  return <header data-site-header className={`${overlay?"absolute inset-x-0 top-0 z-[100]":"sticky top-0 z-30 border-b border-[#263f30]/10 bg-white/95 backdrop-blur-md"} ${text}`}>
    <div className="mx-auto flex h-[72px] max-w-[1240px] items-center justify-between gap-3 px-4 sm:px-8">
      <Link href="/" aria-label="Vị Xoài Dẫn Lối · Trang chủ" className="flex shrink-0 items-center gap-2.5">
        <span aria-hidden className="h-9 w-9 shrink-0 rounded-md bg-[#f8f5df] sm:h-11 sm:w-11" style={{backgroundImage:"url(/76cb5fbe-2b41-4e96-a4ee-00344fc4e9f2.jpg)",backgroundSize:"contain",backgroundPosition:"center",backgroundRepeat:"no-repeat"}}/>
        <span className="hidden sm:block"><span className="block font-sans text-sm font-semibold leading-tight tracking-tight">Vị Xoài Dẫn Lối</span><span className={`mt-1 block text-[10px] ${dark?"text-white/70":"text-[#7b8576]"}`}>Cao Lãnh · Đồng Tháp</span></span>
      </Link>
      <nav aria-label="Điều hướng chính" className="flex shrink-0 items-center gap-2 sm:gap-3">
        <Link href="/map" data-cursor-magnet className={`inline-flex h-9 items-center justify-center rounded-md border px-3 text-[11px] font-medium transition-colors sm:h-10 sm:px-4 sm:text-xs ${outline}`}>Khám phá bản đồ</Link>
        <Link href="/blog" data-cursor-magnet aria-current={active==="blog"?"page":undefined} className={`inline-flex h-9 items-center justify-center rounded-md border px-3 text-[11px] font-medium transition-colors sm:h-10 sm:px-4 sm:text-xs ${outline} ${active==="blog"?(dark?"bg-white/15":"bg-[#263f30]/5 font-semibold"):""}`}>Bài viết</Link>
        <HeaderAccount dark={dark} />
      </nav>
    </div>
  </header>;
}
