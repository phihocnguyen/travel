import type { Metadata } from "next";
import { Suspense } from "react";
import { ArrowUpRight, Sparkles } from "lucide-react";
import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { AUTH_ERRORS, firstParam, type AuthSearchParams } from "@/components/auth/authMessages";
import { safeNextPath } from "@/lib/auth/oauth";

export const metadata:Metadata={title:"Đăng nhập · Vị Xoài Dẫn Lối",description:"Đăng nhập để tạo Vé Hẹn Chu Du, gửi bản cover và chia sẻ câu chuyện Cao Lãnh cùng Vị Xoài Dẫn Lối."};
async function MemberLogin({searchParams}:{searchParams:AuthSearchParams}){
  const params=await searchParams;
  const next=safeNextPath(firstParam(params.next));
  const error=firstParam(params.error);
  return <><span className="auth-label"><Sparkles size={14}/> CHÀO BẠN ĐẾN VỚI VỊ XOÀI</span><h2>Hẹn bạn ở<br/><span>miền đất ngọt lành.</span></h2><p className="auth-description">Đăng nhập để tiếp tục hành trình. Nếu đây là lần đầu ghé, tài khoản sẽ được tạo tự động cho bạn.</p><LoginForm next={next} initialError={error?AUTH_ERRORS[error]??"Chưa thể hoàn tất đăng nhập. Bạn thử lại nhé.":null}/><div className="auth-miniFeature"><span>CHƯA BIẾT BẮT ĐẦU TỪ ĐÂU?</span><Link href="/ugc">Khám phá UGC Cover Challenge <ArrowUpRight size={15}/></Link></div></>;
}
export default function LoginPage({searchParams}:{searchParams:AuthSearchParams}){
  return <AuthShell><Suspense fallback={<div className="auth-skeleton" role="status" aria-label="Đang tải đăng nhập"><span/><span/><span/></div>}><MemberLogin searchParams={searchParams}/></Suspense></AuthShell>;
}
