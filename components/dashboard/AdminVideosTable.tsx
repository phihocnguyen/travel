"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X } from 'lucide-react';
import { type CommunityVideo, VIDEO_STATUS_LABELS, SAMPLE_VIDEO_POSTER } from '@/lib/videos/types';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { TablePagination, useTablePageSize } from './TablePagination';
import DetailDialog from './DetailDialog';
import CommunityVideoPlayer from './CommunityVideoPlayer';

export default function AdminVideosTable({ initialVideos }: { initialVideos: CommunityVideo[] }) {
  const router = useRouter();
  const [videos, setVideos] = useState(initialVideos);
  const [query, setQuery] = useState(''), [filter, setFilter] = useState('pending'), [page, setPage] = useState(0);
  const [selected, setSelected] = useState<CommunityVideo | null>(null), [note, setNote] = useState('');
  const [pending, setPending] = useState<'approved' | 'rejected' | null>(null), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const { ref, size } = useTablePageSize();
  const filtered = videos.filter(video => (filter === 'all' || video.status === filter) && `${video.title} ${video.authorName}`.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi')));
  const pages = Math.max(1, Math.ceil(filtered.length / size)), current = Math.min(page, pages - 1);

  function open(video: CommunityVideo) { setSelected(video); setNote(''); setError(''); }
  async function review(status: 'approved' | 'rejected') {
    if (!selected || pending) return;
    const id = selected.id;
    setPending(status); setError(''); setNotice('');
    try {
      const response = await fetch(`/api/videos/${id}/review`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status, note: note.trim() }) });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error ?? 'Không thể duyệt video.');
      setVideos(items => items.map(video => video.id === id ? { ...video, status, reviewNote: note.trim() || null } : video));
      setSelected(null); setNotice(status === 'approved' ? 'Đã phê duyệt. Video được hiển thị trong cộng đồng.' : 'Đã từ chối video.');
      router.refresh();
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Không thể kết nối máy chủ.'); }
    finally { setPending(null); }
  }

  return <div className="flex h-full min-h-0 flex-col gap-3">
    <header className="shrink-0"><h1 className="text-xl font-semibold tracking-tight">Quản lý video</h1><p className="mt-1 text-xs text-black/50">{videos.length} video · {videos.filter(video => video.status === 'pending').length} chờ duyệt</p></header>
    {notice && <p role="status" className="shrink-0 rounded-xl bg-[#edf4e9] px-4 py-3 text-xs text-[#3e624c]">{notice}</p>}
    {!selected && error && <p role="alert" className="text-xs text-red-700">{error}</p>}
    <div className="flex shrink-0 flex-wrap gap-2"><input aria-label="Tìm video" value={query} onChange={event => { setQuery(event.target.value); setPage(0); }} placeholder="Tìm tiêu đề, người đăng…" className="min-w-0 flex-1 rounded-md border border-black/15 bg-white px-3 py-2 text-sm" /><select aria-label="Trạng thái video" value={filter} onChange={event => { setFilter(event.target.value); setPage(0); }} className="rounded-md border border-black/15 bg-white px-3 py-2 text-xs"><option value="all">Tất cả</option>{Object.entries(VIDEO_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-black/10 bg-white"><div ref={ref} className="min-h-0 flex-1 overflow-auto"><Table><TableHeader><TableRow><TableHead>Video</TableHead><TableHead>Người đăng</TableHead><TableHead>Trạng thái</TableHead><TableHead>Vote</TableHead><TableHead>Ngày đăng</TableHead><TableHead className="text-right">Thao tác</TableHead></TableRow></TableHeader><TableBody>
      {filtered.slice(current * size, (current + 1) * size).map(video => <TableRow key={video.id}><TableCell className="max-w-72"><p className="truncate font-medium">{video.title}</p>{video.isSample && <span className="mt-1 inline-block rounded-full bg-[#f5f2df] px-2 py-0.5 text-[9px] text-[#796c3e]">Video mẫu</span>}</TableCell><TableCell className="max-w-44 truncate text-xs">{video.authorName}</TableCell><TableCell className="whitespace-nowrap text-xs">{VIDEO_STATUS_LABELS[video.status]}</TableCell><TableCell className="text-xs">{video.votes}</TableCell><TableCell className="whitespace-nowrap text-xs text-black/50">{new Date(video.createdAt).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</TableCell><TableCell className="text-right"><button type="button" aria-label={`Xem và duyệt ${video.title}`} className="whitespace-nowrap rounded-md border border-black/15 px-3 py-1.5 text-xs" onClick={() => open(video)}>Xem & duyệt ↗</button></TableCell></TableRow>)}
      {!filtered.length && <TableRow><TableCell colSpan={6} className="h-36 text-center text-black/45">Không có video phù hợp.</TableCell></TableRow>}
    </TableBody></Table></div><TablePagination page={current} pages={pages} total={filtered.length} onChange={setPage} /></section>
    {selected && <DetailDialog title={selected.title} onClose={() => setSelected(null)}>
      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500"><span>{selected.authorName}</span><span>·</span><span>{VIDEO_STATUS_LABELS[selected.status]}</span>{selected.isSample && <span className="rounded-full bg-[#f5f2df] px-2 py-1 text-[9px] text-[#796c3e]">Video mẫu</span>}</div>
      <p className="whitespace-pre-line break-words text-sm leading-relaxed text-zinc-600">{selected.description}</p>
      {selected.reviewNote && <p className="rounded-xl bg-[#f6f5ec] px-3 py-2 text-xs leading-relaxed text-[#66734f]">Ghi chú trước: {selected.reviewNote}</p>}
      <CommunityVideoPlayer key={selected.id} title={selected.title} src={`/api/videos/${selected.id}/stream`} poster={selected.isSample ? SAMPLE_VIDEO_POSTER : undefined} className="max-h-[48dvh] rounded-xl" />
      <label className="block text-xs font-medium text-zinc-600">Ghi chú cho người đăng <span className="font-normal text-zinc-400">(không bắt buộc)</span><textarea value={note} onChange={event => setNote(event.target.value)} disabled={pending !== null} rows={2} maxLength={2000} className="mt-2 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-[#88a28a]" placeholder="Nhập lý do nếu video cần chỉnh sửa…" /></label>
      {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
      <div className="flex flex-wrap gap-2"><button type="button" disabled={pending !== null} onClick={() => review('approved')} className="flex items-center gap-2 rounded-lg bg-[#345444] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#426650] disabled:opacity-50"><Check size={15} />{pending === 'approved' ? 'Đang phê duyệt…' : 'Phê duyệt'}</button><button type="button" disabled={pending !== null} onClick={() => review('rejected')} className="flex items-center gap-2 rounded-lg border border-[#e7ceca] bg-[#fbf4f2] px-4 py-2.5 text-sm font-medium text-[#9d615b] transition hover:bg-[#f5e8e4] disabled:opacity-50"><X size={15} />{pending === 'rejected' ? 'Đang xử lý…' : 'Từ chối'}</button></div>
    </DetailDialog>}
  </div>;
}
