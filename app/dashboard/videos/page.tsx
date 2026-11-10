import {redirect} from 'next/navigation';
import {getSession} from '@/lib/auth/session';
import {listVideos} from '@/lib/videos/store';
import VideoCommunity from '@/components/dashboard/VideoCommunity';
export const instant=false;
export const metadata={title:'Video cộng đồng · Vị Xoài Dẫn Lối'};
export default async function VideosPage({searchParams}:{searchParams:Promise<{compose?:string}>}){const session=await getSession();if(!session)redirect('/login?next=/dashboard/videos');return <VideoCommunity initialVideos={await listVideos(session.sub)} name={session.name} initialCompose={(await searchParams).compose==='1'}/>;}
