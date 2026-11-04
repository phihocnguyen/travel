import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { listPostsByAuthor } from "@/lib/posts/store";
import MyPosts from "@/components/dashboard/MyPosts";
export const instant=false;
export const metadata={title:"Bài viết của tôi · Vị Xoài Dẫn Lối"};
export default async function MyPostsPage(){const session=await getSession();if(!session)redirect("/login?next=/dashboard/posts");return <MyPosts posts={await listPostsByAuthor(session.sub)}/>;}
