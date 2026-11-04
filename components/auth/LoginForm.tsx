"use client";
import { useState, type FormEvent } from "react";
type Props={next:string;initialError:string|null};
export function LoginForm({next,initialError}:Props){
  const [error,setError]=useState<string|null>(null),[pending,setPending]=useState(false);
  async function login(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setPending(true);setError(null);
    const data=new FormData(event.currentTarget);
    try{
      const response=await fetch("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:data.get("username"),password:data.get("password")})});
      const result=await response.json();
      if(!response.ok){setError(result.error);return;}
      window.location.assign(result.redirect);
    }catch{setError("Chưa thể kết nối. Vui lòng thử lại.");}finally{setPending(false);}
  }
  return <div className="mt-6">
    <details className="mb-6 border-b border-cream/20 pb-6">
      <summary className="cursor-pointer text-sm font-semibold">Đăng nhập quản trị viên</summary>
      <form onSubmit={login} className="mt-4 space-y-3">
        <label className="block text-xs">Tài khoản<input name="username" autoComplete="username" required maxLength={100} className="mt-1 block w-full rounded-lg border border-cream/30 bg-white px-3 py-2 text-sm text-forest"/></label>
        <label className="block text-xs">Mật khẩu<input name="password" type="password" autoComplete="current-password" required maxLength={256} className="mt-1 block w-full rounded-lg border border-cream/30 bg-white px-3 py-2 text-sm text-forest"/></label>
        {error&&<p role="alert" className="text-xs text-cream">{error}</p>}
        <button disabled={pending} type="submit" className="w-full rounded-full bg-mango px-5 py-3 text-sm font-semibold text-forest disabled:opacity-50">{pending?"Đang đăng nhập…":"Đăng nhập quản trị"}</button>
      </form>
    </details>
    {initialError&&<p role="alert" className="mb-4 rounded-xl bg-earth/30 px-4 py-3 text-[11px] leading-relaxed text-cream">{initialError}</p>}
    <a href={"/api/auth/google?next="+encodeURIComponent(next)} className="flex items-center justify-center gap-3 rounded-full bg-cream px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.16em] text-forest transition-colors hover:bg-mint">
        <svg className="h-4 w-4" viewBox="0 0 18 18" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M17.64 9.2c0-.64-.05-1.26-.16-1.86H9v3.53h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.65Z"
          />
          <path
            fill="#34A853"
            d="M9 18c2.43 0 4.47-.8 5.96-2.15l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
          />
          <path
            fill="#FBBC05"
            d="M3.97 10.75a5.4 5.4 0 0 1 0-3.5V4.92H.96a9 9 0 0 0 0 8.16l3.01-2.33Z"
          />
          <path
            fill="#EA4335"
            d="M9 3.55c1.32 0 2.5.45 3.44 1.35l2.58-2.59A9 9 0 0 0 .96 4.92l3.01 2.33C4.68 5.13 6.66 3.55 9 3.55Z"
          />
        </svg>
      <span>Tiếp tục với Google</span>
    </a>
    <p className="mt-5 text-[11px] leading-relaxed text-cream/60">Chỉ cần một tài khoản Google để đăng nhập hoặc đăng ký. Vé và bài viết của bạn sẽ được lưu trong tài khoản.</p>
  </div>;
}
