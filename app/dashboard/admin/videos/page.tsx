import {redirect} from 'next/navigation';
import {getSession,isAdmin} from '@/lib/auth/session';
import {listVideos} from '@/lib/videos/store';
import AdminVideosTable from '@/components/dashboard/AdminVideosTable';
export const instant=false;
export const metadata={title:'Quản lý video · Vị Xoài Dẫn Lối'};
export default async function ReviewVideosPage(){const session=await getSession();if(!session)redirect('/login');if(!isAdmin(session))redirect('/dashboard');return <AdminVideosTable initialVideos={await listVideos(session.sub,'moderation',true)}/>;}
