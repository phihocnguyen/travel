import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, ArrowUpRight, Compass, Mic2, ShieldCheck, Ticket } from "lucide-react";
import BrandMark from "@/components/layout/BrandMark";
import "./auth.css";

export default function AuthShell({children,admin=false}:{children:ReactNode;admin?:boolean}) {
  return <main className={`auth-page${admin?" auth-admin":""}`}>
    <header className="auth-header"><Link href="/" className="auth-brand" aria-label="Vị Xoài Dẫn Lối · Trang chủ"><BrandMark/></Link><Link href="/" className="auth-home"><ArrowLeft size={15}/><span>Về trang chủ</span></Link></header>
    <div className="auth-layout"><section className="auth-story"><div className="auth-storyImage"/><div className="auth-storyShade"/><div className="auth-storyTop"><span><span/> {admin?"KHÔNG GIAN BAN TỔ CHỨC":"THEO VỊ XOÀI CÁT, MỞ LỐI CHU DU"}</span><span>CAO LÃNH, ĐỒNG THÁP</span></div><div className="auth-storyCopy"><span className="auth-storyKicker">{admin?"VỊ XOÀI DẪN LỐI · QUẢN TRỊ":"MỘT LẦN ĐĂNG NHẬP, MUÔN ĐIỀU ĐỂ KHÁM PHÁ"}</span><h1>{admin?<>Chăm chút cho<br/>từng <em>hành trình.</em></>:<>Giữ lại một chút<br/><em>vị miền Tây.</em></>}</h1><p>{admin?"Quản lý nội dung, duyệt những câu chuyện và đồng hành cùng cộng đồng Vị Xoài Dẫn Lối.":"Những lời hẹn, bản cover đầy cá tính và câu chuyện Cao Lãnh. Tất cả bắt đầu từ một tài khoản của bạn."}</p><div className="auth-storyTags">{admin?<span><ShieldCheck size={14}/> Dành cho tài khoản được cấp quyền</span>:<><span><Ticket size={14}/> Vé Hẹn Chu Du</span><span><Mic2 size={14}/> UGC Cover</span><span><Compass size={14}/> Khám phá Cao Lãnh</span></>}</div></div><div className="auth-storyBottom"><span>10.29° N · 105.76° E</span><Link href={admin?"/":"/ugc"}>{admin?"Xem website":"XOÀI CÓ GU, HÁT CÓ VIBE!"}<ArrowUpRight size={14}/></Link></div></section>
    <section className="auth-formPanel"><div className="auth-formInner">{children}</div><div className="auth-panelFooter"><ShieldCheck size={13}/><span>{admin?"Chỉ tài khoản được phân quyền mới truy cập được hệ thống.":"Đăng nhập an toàn. Không chia sẻ mật khẩu Google của bạn."}</span></div></section></div>
    <footer className="auth-footer"><span>© 2026 Vị Xoài Dẫn Lối</span><span>{admin?<Link href="/login">Đăng nhập thành viên</Link>:<Link href="/admin/login">Khu vực quản trị</Link>}</span></footer>
  </main>;
}
