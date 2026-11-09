import {redirect} from 'next/navigation';
import {getSession,isAdmin} from '@/lib/auth/session';
import {listVideos} from '@/lib/videos/store';
import VideoCommunity from '@/components/dashboard/VideoCommunity';
export const instant=false;
export const metadata={title:'Duyệt video · Vị Xoài Dẫn Lối'};
export default async function ReviewVideosPage(){const session=await getSession();if(!session)redirect('/login');if(!isAdmin(session))redirect('/dashboard');return <VideoCommunity admin initialVideos={await listVideos(session.sub,'moderation',true)}/>;}
