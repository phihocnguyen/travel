"use client";
import Link from 'next/link';
import { BarChart,ChartPanel,RingChart } from './AdminCharts';
import UserInsightsTable from './UserInsightsTable';
import type { UserInsights } from '@/lib/users/admin';
type Post={id:string;title:string;author:{name:string};status:string};
export default function AdminOverview({stats,posts,insights}:{stats:{label:string;value:number;href:string}[];posts:Post[];insights:UserInsights}) {
  return <div className="flex h-full min-h-0 flex-col gap-4"><header className="shrink-0"><h1 className="text-xl font-semibold tracking-tight">Tổng quan quản trị</h1><p className="mt-1 text-xs text-zinc-500">Tình hình người dùng, vé và nội dung của chiến dịch.</p></header><div className="min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-3xl bg-[#f4f6ef] p-3 sm:p-5"><div className="mx-auto max-w-[1440px] space-y-4"><div className="grid gap-4 lg:grid-cols-2"><ChartPanel title="Tình hình vé chiến dịch" description="So sánh số vé đã tạo, đã in và đã trao; các giai đoạn có thể bao gồm nhau."><BarChart items={stats.slice(0,3)}/></ChartPanel><ChartPanel title="Trạng thái bài viết"><RingChart items={[{label:'Đã duyệt',value:posts.filter(post=>post.status==='approved').length},{label:'Chờ duyệt',value:posts.filter(post=>post.status==='pending').length},{label:'Từ chối',value:posts.filter(post=>post.status==='rejected').length}]}/><Link href="/dashboard/admin" className="mt-4 block text-center text-xs text-[#456653] hover:underline">Quản lý bài viết ↗</Link></ChartPanel></div><UserInsightsTable initial={insights}/></div></div></div>;
}
