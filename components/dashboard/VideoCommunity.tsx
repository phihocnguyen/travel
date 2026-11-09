"use client";

import { useRef, useState, type FormEvent } from 'react';
import { Clapperboard, Globe2, ThumbsUp, Upload, Video } from 'lucide-react';
import type { CommunityVideo } from '@/lib/videos/types';
import { MAX_VIDEO_BYTES, MAX_VIDEO_MB, VIDEO_STATUS_LABELS, SAMPLE_VIDEO_POSTER } from '@/lib/videos/types';
import CommunityVideoPlayer from './CommunityVideoPlayer';

export default function VideoCommunity({ initialVideos }: { initialVideos: CommunityVideo[] }) {
  const [videos, setVideos] = useState(initialVideos), [scope, setScope] = useState('approved'), [sort, setSort] = useState('new');
  const [upload, setUpload] = useState(false), [busy, setBusy] = useState(false), [loading, setLoading] = useState(false);
  const [working, setWorking] = useState<string[]>([]), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const generation = useRef(0), form = useRef<HTMLFormElement>(null);

  async function refresh(next = scope) {
    const current = ++generation.current; setScope(next); setLoading(true); setError('');
    try {
      const response = await fetch(`/api/videos?scope=${next}`), data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (current === generation.current) setVideos(data.videos);
    } catch { if (current === generation.current) setError('Không thể tải danh sách video.'); }
    finally { if (current === generation.current) setLoading(false); }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget), file = data.get('video');
    if (!(file instanceof File) || !file.size || file.size > MAX_VIDEO_BYTES) { setError(`Chọn video MP4 hoặc WebM, tối đa ${MAX_VIDEO_MB} MB.`); return; }
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/videos', { method: 'POST', body: data }), result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setUpload(false); form.current?.reset(); setNotice('Video đã gửi. Admin sẽ duyệt trước khi hiển thị trên bảng tin.'); await refresh('mine');
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Không thể tải video lên.'); }
    finally { setBusy(false); }
  }

  async function vote(video: CommunityVideo) {
    setWorking(items => [...items, video.id]); setError('');
    try {
      const response = await fetch(`/api/videos/${video.id}/vote`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ voted: !video.voted }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error);
      setVideos(items => items.map(item => item.id === video.id ? { ...item, voted: data.voted, votes: data.votes } : item));
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Chưa thể bình chọn. Bạn hãy thử lại.'); }
    finally { setWorking(items => items.filter(id => id !== video.id)); }
  }

  const sorted = [...videos].sort((a, b) => sort === 'votes' ? b.votes - a.votes : Date.parse(b.createdAt) - Date.parse(a.createdAt));
  return <div className="flex h-full min-h-0 flex-col gap-4">
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] uppercase tracking-[0.2em] text-[#748565]">Góc nhìn cộng đồng</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">Thước phim chu du</h1><p className="mt-1 text-xs text-[#879184]">Chia sẻ khoảnh khắc. Bình chọn câu chuyện bạn yêu thích.</p></div><button type="button" onClick={() => { setUpload(!upload); setError(''); }} className="flex items-center gap-2 rounded-full bg-[var(--dashboard-primary,#345444)] px-5 py-3 text-sm font-medium text-white transition hover:brightness-110"><Upload size={16} />{upload ? 'Đóng' : 'Đăng video'}</button></header>
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-3"><div className="flex gap-1 rounded-full bg-[#eff2e9] p-1">{[['approved', 'Khám phá'], ['mine', 'Video của tôi']].map(([id, label]) => <button key={id} type="button" onClick={() => refresh(id)} aria-pressed={scope === id} className={`rounded-full px-4 py-2 text-xs transition ${scope === id ? 'bg-white font-semibold text-[#3d5a46] shadow-sm' : 'text-[#88917e]'}`}>{label}</button>)}</div><select aria-label="Sắp xếp video" value={sort} onChange={event => setSort(event.target.value)} className="rounded-full border border-[#e5eadd] bg-white px-4 py-2 text-xs text-[#74806c]"><option value="new">Mới nhất</option><option value="votes">Nhiều vote nhất</option></select></div>
    {error && <p role="alert" className="shrink-0 rounded-2xl bg-[#fbefed] px-4 py-3 text-sm text-[#a35f56]">{error}</p>}{notice && <p role="status" className="shrink-0 rounded-2xl bg-[#edf4e9] px-4 py-3 text-sm text-[#4f7051]">{notice}</p>}
    <div className="min-h-0 flex-1 overflow-y-auto rounded-[28px] bg-[#f4f6ef] p-3 sm:p-5" aria-busy={loading}>
      {upload && <form ref={form} onSubmit={submit} className="mx-auto mb-5 max-w-[620px] space-y-4 rounded-3xl border border-[#e5eadd] bg-white p-5"><h2 className="flex items-center gap-2 font-semibold"><Clapperboard size={18} />Chia sẻ một thước phim</h2><label className="block text-xs font-medium">Tiêu đề<input name="title" required maxLength={120} className="mt-2 w-full rounded-2xl border border-[#e5eadd] px-4 py-3 text-sm" placeholder="Câu chuyện của video này là…" /></label><label className="block text-xs font-medium">Mô tả<textarea name="description" maxLength={2000} rows={3} className="mt-2 w-full rounded-2xl border border-[#e5eadd] px-4 py-3 text-sm" /></label><label className="block rounded-2xl border border-dashed border-[#d9e2c8] bg-[#f5f7ed] p-4 text-xs text-[#7a896b]">Video MP4 / WebM · tối đa {MAX_VIDEO_MB} MB<input name="video" type="file" accept="video/mp4,video/webm" required className="mt-3 block w-full text-xs" /></label><p className="text-xs text-[#879184]">Video sẽ được admin duyệt trước khi xuất hiện trong cộng đồng.</p><button disabled={busy} className="rounded-full bg-[var(--dashboard-primary,#345444)] px-5 py-3 text-xs font-semibold text-white disabled:opacity-50">{busy ? 'Đang tải video lên…' : 'Gửi video chờ duyệt'}</button></form>}
      {loading ? <p role="status" className="p-10 text-center text-sm text-[#879184]">Đang tải video…</p> : !sorted.length ? <div className="flex flex-col items-center gap-3 py-20 text-center"><Video size={32} className="text-[#91a17b]" /><h2 className="font-semibold">{scope === 'mine' ? 'Bạn chưa đăng video nào' : 'Chưa có video trong mục này'}</h2><p className="max-w-xs text-xs leading-relaxed text-[#879184]">Chia sẻ một khoảnh khắc và cùng kể câu chuyện của bạn nhé.</p></div> : <div className="mx-auto max-w-[620px] space-y-4">{sorted.map(video => <article key={video.id} className="overflow-hidden rounded-[24px] border border-[#e4e9dc] bg-white shadow-[0_4px_18px_-12px_#62754b25]">
        <header className="flex items-center gap-3 p-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e9eed8] text-sm font-semibold text-[#788b55]">{video.authorName.slice(0, 1)}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-[#36503f]">{video.authorName}</p><p className="mt-1 flex items-center gap-1.5 text-[10px] text-[#69795f]">{new Date(video.createdAt).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })} · <Globe2 size={10} />{scope === 'mine' ? 'Video của bạn' : 'Cộng đồng'}</p></div>{video.isSample && <span className="rounded-full bg-[#f7f3dc] px-2.5 py-1 text-[9px] text-[#796c3e]">Video mẫu</span>}{scope === 'mine' && <span className={`rounded-full px-3 py-1 text-[10px] ${video.status === 'approved' ? 'bg-[#eaf2e0] text-[#58703a]' : video.status === 'pending' ? 'bg-[#f8f2d9] text-[#7c6b31]' : 'bg-[#f8ece8] text-[#87584c]'}`}>{VIDEO_STATUS_LABELS[video.status]}</span>}</header>
        <div className="px-4 pb-4"><h2 className="text-sm font-semibold leading-relaxed text-[#42583f]">{video.title}</h2><p className="mt-1.5 whitespace-pre-line break-words text-[13px] leading-relaxed text-[#6b7861]">{video.description}</p></div>
        <CommunityVideoPlayer title={video.title} src={`/api/videos/${video.id}/stream`} poster={video.isSample ? SAMPLE_VIDEO_POSTER : undefined} />
        <div className="px-4"><div className="flex items-center gap-2 border-b border-[#eff2e9] py-3 text-[11px] text-[#68795e]"><span className="rounded-full bg-[#edf2df] p-1 text-[#85975b]"><ThumbsUp size={10} /></span>{video.votes} lượt bình chọn</div><button type="button" onClick={() => vote(video)} disabled={video.status !== 'approved' || working.includes(video.id)} aria-pressed={video.voted} className={`my-2 flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold transition disabled:opacity-40 ${video.voted ? 'bg-[#edf3df] text-[#55703c]' : 'text-[#68795e] hover:bg-[#f5f7ef]'}`}><ThumbsUp size={15} />{video.voted ? 'Đã vote' : 'Bình chọn'}</button></div>
        {video.reviewNote && scope === 'mine' && <p className="mx-4 mb-4 rounded-2xl bg-[#f7f7f1] p-3 text-xs leading-relaxed text-[#87917c]">Phản hồi: {video.reviewNote}</p>}
      </article>)}</div>}
    </div>
  </div>;
}
