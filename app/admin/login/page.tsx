import type { Metadata } from "next";
import { Suspense } from "react";
import { ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import AdminLoginForm from "@/components/auth/AdminLoginForm";
import { getSession, isAdmin } from "@/lib/auth/session";

export const metadata:Metadata={title:"Đăng nhập quản trị · Vị Xoài Dẫn Lối",robots:{index:false,follow:false}};
async function AdminCard(){
  const session=await getSession();
  if(isAdmin(session))redirect("/dashboard/admin/overview");
  return <><span className="auth-label"><ShieldCheck size={14}/> KHU VỰC QUẢN TRỊ</span><h2>Chào mừng<br/><span>người giữ hành trình.</span></h2><p className="auth-description">Đăng nhập bằng tài khoản được cấp để quản lý nội dung, duyệt bài và vận hành chiến dịch.</p><AdminLoginForm/><p className="auth-formHint">Nếu quên mật khẩu hoặc chưa có tài khoản, vui lòng liên hệ người quản lý hệ thống.</p></>;
}
export default function AdminLoginPage(){return <AuthShell admin><Suspense fallback={<div className="auth-skeleton" role="status" aria-label="Đang tải đăng nhập quản trị"><span/><span/><span/></div>}><AdminCard/></Suspense></AuthShell>;}
