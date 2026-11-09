import {redirect} from 'next/navigation';
import {getSession} from '@/lib/auth/session';
import {listApprovedPosts,listPostsByAuthor} from '@/lib/posts/store';
import CommunityFeed from '@/components/dashboard/CommunityFeed';
export const instant=false;
export const metadata={title:'Bảng tin cộng đồng · Vị Xoài Dẫn Lối'};
export default async function CommunityPage(){const session=await getSession();if(!session)redirect('/login?next=/dashboard/posts');const [posts,mine]=await Promise.all([listApprovedPosts(),listPostsByAuthor(session.sub)]);return <CommunityFeed posts={posts} mine={mine} name={session.name}/>;}
