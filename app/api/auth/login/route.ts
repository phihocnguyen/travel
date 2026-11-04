export async function POST(){
  return Response.json({error:"Đăng nhập bằng mật khẩu đã tắt. Vui lòng sử dụng Google.",loginUrl:"/api/auth/google"},{status:405});
}
