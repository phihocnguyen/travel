"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { CheckCircle2, Clapperboard, Globe2, LoaderCircle, Search, ShieldCheck, TrendingUp, Upload, Video, X } from 'lucide-react';
import type { CommunityVideo } from '@/lib/videos/types';
import { MAX_VIDEO_BYTES, MAX_VIDEO_MB, VIDEO_STATUS_LABELS, SAMPLE_VIDEO_POSTER } from '@/lib/videos/types';
import { UserAvatar } from '@/components/auth/UserAvatar';
import CommunityInteractions from './CommunityInteractions';
import CommunityComposerModal from './CommunityComposerModal';
import CommunityVideoPlayer from './CommunityVideoPlayer';
import CommunityLayout from './CommunityLayout';
import { CommunityHeading, CommunityLoading, CommunityPostHeader, CommunityText } from './CommunityPost';
import { CommunityExplore, CommunityHighlights, CommunityMembers } from './CommunitySidebar';

export default function VideoCommunity({ initialVideos, name = 'Bạn', initialCompose = false }: { initialVideos: CommunityVideo[]; name?: string; initialCompose?: boolean }) {
  const [videos, setVideos] = useState(initialVideos), [scope, setScope] = useState('approved'), [sort, setSort] = useState('new');
  const [query, setQuery] = useState(''), [upload, setUpload] = useState(initialCompose), [busy, setBusy] = useState(false), [loading, setLoading] = useState(false);
  const [error, setError] = useState(''), [notice, setNotice] = useState(''), [file, setFile] = useState<File | null>(null), [preview, setPreview] = useState(''), [dragging, setDragging] = useState(false);
  const generation = useRef(0), form = useRef<HTMLFormElement>(null), composer = useRef<HTMLElement>(null), fileInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const target = window.location.hash;
    if (target.startsWith('#video-')) document.getElementById(target.slice(1))?.scrollIntoView({ block: 'start' });
  }, []);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  function selectFile(value?: File) {
    if (!value) return;
    if (!['video/mp4', 'video/webm'].includes(value.type) || !value.size || value.size > MAX_VIDEO_BYTES) { setError(`Chọn video MP4 hoặc WebM, tối đa ${MAX_VIDEO_MB} MB.`); return; }
    setError(''); setFile(value); setPreview(URL.createObjectURL(value));
  }
  async function refresh(next = scope) {
    const current = ++generation.current; setLoading(true); setError('');
    try {
      const response = await fetch(`/api/videos?scope=${next}`), data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (current === generation.current) { setVideos(data.videos); setScope(next); if (next !== scope) setQuery(''); }
    } catch (failure) { if (current === generation.current) setError(failure instanceof Error ? failure.message : 'Không thể tải danh sách video.'); }
    finally { if (current === generation.current) setLoading(false); }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (!file) { setError('Bạn hãy chọn một video để chia sẻ nhé.'); return; }
    const data = new FormData(event.currentTarget); data.set('video', file);
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/videos', { method: 'POST', body: data }), result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setUpload(false); setFile(null); setPreview(''); form.current?.reset();
      setNotice('Đã gửi video! Khoảnh khắc của bạn sẽ xuất hiện sau khi được duyệt.'); await refresh('mine');
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Không thể tải video lên.'); }
    finally { setBusy(false); }
  }
  const updateVideo = useCallback((id: string, votes: number, voted: boolean) => {
    setVideos(items => items.map(video => video.id === id ? { ...video, votes, voted } : video));
  }, []);
  const sorted = videos.filter(video => `${video.title} ${video.description} ${video.authorName}`.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi'))).sort((a, b) => sort === 'votes' ? b.votes - a.votes : Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const members = [...new Map(videos.map(video => [video.authorSub, { id: video.authorSub, name: video.authorName }])).values()];
  const sidebar = <>
    <CommunityMembers members={members} count={videos.length} label="video" />
    <CommunityHighlights title="Đang được yêu thích" items={[...videos].filter(video => video.status === 'approved').sort((a, b) => b.votes - a.votes).slice(0, 3).map(video => ({ id: video.id, title: video.title, detail: `${video.authorName} · ${video.votes} lượt thích`, onSelect: () => { setQuery(video.title); } }))} />
    <CommunityExplore current="videos" />
  </>;
  return <div className="social-page">
    <CommunityHeading current="videos" />
    <CommunityLayout sidebar={sidebar}>
      <section ref={composer} aria-label="Đăng video" className="social-card social-composer">
        <div className="social-composer-top"><UserAvatar name={name} className="social-avatar" /><button type="button" onClick={() => { setUpload(!upload); setError(''); }} aria-expanded={upload} aria-controls="video-composer" className="social-composer-prompt">{name === 'Bạn' ? 'Bạn có khoảnh khắc nào muốn chia sẻ?' : `${name.trim()} ơi, chia sẻ một khoảnh khắc nhé…`}</button></div>
        <div className="social-composer-bottom"><button type="button" onClick={() => setUpload(!upload)} aria-expanded={upload} aria-controls="video-composer" className="social-composer-action"><Clapperboard size={19} />Video của bạn</button><span className="social-helper"><Globe2 size={11} />Chia sẻ cùng cộng đồng</span></div>
        {upload && <CommunityComposerModal title="Tạo bài đăng video" busy={busy} onClose={() => setUpload(false)}><form id="video-composer" ref={form} onSubmit={submit} className="social-form">
          <fieldset disabled={busy} className="space-y-4">
            <label className="social-field">Tiêu đề<input name="title" required maxLength={120} className="social-input" placeholder="Đặt tên cho khoảnh khắc của bạn…" /></label>
            <label className="social-field">Bạn muốn kể điều gì?<textarea name="description" maxLength={2000} rows={3} className="social-input" placeholder="Một câu chuyện nhỏ, một địa điểm hay, một điều đáng nhớ…" /></label>
            {file && preview ? <div><div className="social-preview"><video controls playsInline src={preview} aria-label="Xem trước video của bạn" /><button type="button" aria-label="Bỏ video đã chọn" onClick={() => { setFile(null); setPreview(''); if (fileInput.current) fileInput.current.value = ''; }} className="social-remove"><X size={14} /></button></div><p className="mt-2 break-all text-[10px] text-[#87927d]">{file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB</p></div> : <label className="social-dropzone" data-dragging={dragging} onDragOver={event => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={event => { event.preventDefault(); setDragging(false); selectFile(event.dataTransfer.files[0]); }}><Upload /><strong>Chọn video hoặc kéo thả vào đây</strong><span>MP4, WebM · tối đa {MAX_VIDEO_MB} MB</span><input ref={fileInput} type="file" accept="video/mp4,video/webm" aria-label="Chọn video để đăng" onChange={event => selectFile(event.target.files?.[0])} /></label>}
          </fieldset>
          <div className="flex flex-wrap items-center justify-between gap-3"><span className="social-helper"><ShieldCheck size={13} />Bài đăng sẽ được duyệt trước khi hiển thị.</span><button type="submit" disabled={busy || !file} className="social-primary">{busy ? <LoaderCircle size={14} className="motion-safe:animate-spin" /> : <Upload size={14} />}{busy ? 'Đang gửi…' : 'Đăng video'}</button></div>
          {error && <p role="alert" className="social-notice" data-error="true">{error}</p>}
        </form></CommunityComposerModal>}
      </section>
      {error && !upload && <p role="alert" className="social-notice" data-error="true">{error}</p>}
      {notice && <p role="status" className="social-notice"><CheckCircle2 size={17} className="mt-0.5 shrink-0" />{notice}</p>}
      <div className="social-toolbar"><div className="social-tabs">{[['approved', 'Dành cho bạn'], ['mine', 'Video của tôi']].map(([id, label]) => <button key={id} type="button" onClick={() => refresh(id)} aria-pressed={scope === id}>{label}{scope === id && <span>{videos.length}</span>}</button>)}</div><select aria-label="Sắp xếp video" value={sort} onChange={event => setSort(event.target.value)} className="social-select"><option value="new">Mới nhất</option><option value="votes">Được yêu thích</option></select></div>
      <label className="social-search"><Search size={15} className="shrink-0" /><input aria-label="Tìm video trong cộng đồng" value={query} onChange={event => setQuery(event.target.value)} placeholder="Tìm khoảnh khắc, câu chuyện, người chia sẻ…" />{query && <button type="button" aria-label="Xóa tìm kiếm" onClick={() => setQuery('')}><X size={13} /></button>}</label>
      <div aria-busy={loading} className="space-y-5">
        {loading ? <CommunityLoading video /> : !sorted.length ? <div className="social-card social-empty"><Video /><h2>{query ? 'Chưa tìm thấy khoảnh khắc này' : scope === 'mine' ? 'Câu chuyện của bạn bắt đầu từ đây' : 'Cùng mở đầu một câu chuyện nhé'}</h2><p>{query ? 'Thử tìm bằng tên người chia sẻ hoặc một từ khóa khác nhé.' : 'Một góc đẹp, một nụ cười hay một chuyến đi. Khoảnh khắc của bạn luôn có điều để kể.'}</p><button type="button" onClick={() => { if (query) setQuery(''); else { setUpload(true); composer.current?.scrollIntoView({ block: 'start' }); } }} className="social-primary">{query ? 'Xem tất cả video' : 'Chia sẻ video đầu tiên'}</button></div> : sorted.map((video, index) => <article key={video.id} id={`video-${video.id}`} className="social-card social-post" style={{ animationDelay: `${Math.min(index, 4) * 55}ms` }}>
          <CommunityPostHeader name={video.authorName} date={video.createdAt} badge={<span className="social-badge">{scope === 'mine' ? VIDEO_STATUS_LABELS[video.status] : video.isSample ? 'Video mẫu' : <><Clapperboard size={11} />Video</>}</span>} />
          <div className="social-post-copy"><h2>{video.title}</h2><CommunityText content={video.description} /></div>
          <CommunityVideoPlayer title={video.title} src={`/api/videos/${video.id}/stream`} poster={video.isSample ? SAMPLE_VIDEO_POSTER : undefined} />
          <CommunityInteractions kind="videos" id={video.id} disabled={video.status !== 'approved'} initialLikes={video.votes} initialLiked={video.voted} viewerName={name} onChange={updateVideo} />
          {video.reviewNote && scope === 'mine' && <p className="mx-4 mb-4 rounded-xl bg-[#faf5e9] p-3 text-xs leading-relaxed text-[#8b7955]">Phản hồi: {video.reviewNote}</p>}
        </article>)}
      </div>
      {!loading && sorted.length > 0 && <p className="flex items-center justify-center gap-2 py-4 text-[10px] text-[#9aa68f]"><TrendingUp size={13} />Mỗi góc nhìn đều làm hành trình thú vị hơn.</p>}
    </CommunityLayout>
  </div>;
}
