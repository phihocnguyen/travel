import { getSession, isAdmin } from '@/lib/auth/session';
import { listVideos, uploadVideo, VideoValidationError } from '@/lib/videos/store';
import { MAX_VIDEO_BYTES } from '@/lib/videos/types';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const scope = new URL(request.url).searchParams.get('scope') ?? 'approved';
  if (!['approved', 'mine', 'moderation'].includes(scope)) return Response.json({ error: 'Danh sách không hợp lệ.' }, { status: 400 });
  if (scope === 'moderation' && !isAdmin(session)) return Response.json({ error: 'Forbidden' }, { status: 403 });
  try { return Response.json({ videos: await listVideos(session.sub, scope, isAdmin(session)) }); }
  catch { return Response.json({ error: 'Chưa thể tải video. Bạn hãy thử lại sau ít phút.' }, { status: 503 }); }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (Number(request.headers.get('content-length')) > MAX_VIDEO_BYTES + 128 * 1024) return Response.json({ error: 'Video vượt quá 4 MB.' }, { status: 413 });
  try {
    const id = await uploadVideo(session, await request.formData());
    return Response.json({ id }, { status: 201 });
  } catch (error) {
    if (error instanceof VideoValidationError) return Response.json({ error: error.message }, { status: 400 });
    console.error('Video upload failed');
    return Response.json({ error: 'Không thể tải video lên. Vui lòng thử lại.' }, { status: 503 });
  }
}
