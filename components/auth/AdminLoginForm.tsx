"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, LoaderCircle, LockKeyhole, UserRound } from "lucide-react";

export default function AdminLoginForm(){
  const [error,setError]=useState(""),[pending,setPending]=useState(false),[visible,setVisible]=useState(false);
  const busy=useRef(false);
  const router=useRouter();
  async function login(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(busy.current)return;busy.current=true;setPending(true);setError("");
    const data=new FormData(event.currentTarget);
    try{const response=await fetch("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:data.get("username"),password:data.get("password")})});const result=await response.json();if(!response.ok){setError(result.error||"Không thể đăng nhập.");return;}router.replace("/dashboard/admin/overview");router.refresh();}
    catch{setError("Chưa thể kết nối. Vui lòng thử lại.");}finally{busy.current=false;setPending(false);}
  }
  return <form className="auth-adminForm" onSubmit={login} aria-busy={pending}>
    <fieldset disabled={pending}><label htmlFor="admin-username">Tài khoản</label><div className="auth-input"><UserRound size={17}/><input id="admin-username" name="username" autoComplete="username" required maxLength={100} placeholder="Tên tài khoản quản trị"/></div><label htmlFor="admin-password">Mật khẩu</label><div className="auth-input"><LockKeyhole size={17}/><input id="admin-password" name="password" type={visible?"text":"password"} autoComplete="current-password" required maxLength={256} placeholder="Nhập mật khẩu"/><button type="button" aria-label={visible?"Ẩn mật khẩu":"Hiện mật khẩu"} aria-pressed={visible} onClick={()=>setVisible(value=>!value)}>{visible?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></fieldset>
    {error&&<p role="alert" className="auth-error">{error}</p>}<button className="auth-submit" type="submit" disabled={pending}>{pending?<><LoaderCircle size={16} className="auth-spinner"/>Đang đăng nhập…</>:<>Đăng nhập quản trị<ArrowRight size={17}/></>}</button>
  </form>;
}
