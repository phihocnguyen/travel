import { getSession } from '@/lib/auth/session';
import { ensureDatabaseUser } from '@/lib/auth/user';
import { getDatabase } from '@/lib/db';

type Context = { params: Promise<{ kind: string; id: string }> };
async function handle(request: Request, context: Context) {
  const { kind, id } = await context.params;
  if (!['posts', 'videos'].includes(kind) || !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)) return Response.json({ error: 'Nội dung không hợp lệ.' }, { status: 404 });
  const session = await getSession();
  if (request.method !== 'GET' && !session) return Response.json({ error: 'Vui lòng đăng nhập để tương tác.' }, { status: 401 });
  const db = getDatabase(), table = kind === 'posts' ? 'blog_posts' : 'community_videos';
  const column = kind === 'posts' ? 'post_id' : 'video_id';
  const likes = kind === 'posts' ? 'community_post_likes' : 'community_video_votes';
  try {
    const target = await db.query(`SELECT id FROM ${table} WHERE id=$1 AND status='approved'`, [id]);
    if (!target.rowCount) return Response.json({ error: 'Nội dung chưa được duyệt hoặc không còn tồn tại.' }, { status: 404 });
    if (request.method !== 'GET') {
      const body = await request.json().catch(() => null);
      if (request.method === 'POST' && (typeof body?.content !== 'string' || !body.content.trim() || body.content.trim().length > 2000)) return Response.json({ error: 'Bình luận cần từ 1 đến 2.000 ký tự.' }, { status: 400 });
      if (request.method === 'PUT' && typeof body?.liked !== 'boolean') return Response.json({ error: 'Lựa chọn không hợp lệ.' }, { status: 400 });
      const user = await ensureDatabaseUser(session!);
      if (request.method === 'POST') {
        const parentId = body.parentId ?? null;
        if (parentId !== null) {
          if (typeof parentId !== 'string' || !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(parentId)) return Response.json({ error: 'Bình luận trả lời không hợp lệ.' }, { status: 400 });
          const parent = await db.query(`SELECT id FROM community_comments WHERE id=$1 AND ${column}=$2 AND parent_id IS NULL`, [parentId,id]);
          if (!parent.rowCount) return Response.json({ error: 'Chỉ có thể trả lời bình luận gốc trong bài viết này.' }, { status: 400 });
        }
        await db.query(`INSERT INTO community_comments(${column},author_id,content,parent_id) VALUES ($1,$2,$3,$4)`, [id,user,body.content.trim(),parentId]);
      }
      else if (body.liked) await db.query(`INSERT INTO ${likes}(${column},user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [id,user]);
      else await db.query(`DELETE FROM ${likes} WHERE ${column}=$1 AND user_id=$2`, [id,user]);
    }
    const [comments, counts] = await Promise.all([
      db.query(`WITH roots AS (SELECT id FROM community_comments WHERE ${column}=$1 AND parent_id IS NULL ORDER BY created_at DESC,id DESC LIMIT 50)
        SELECT c.id,c.content,c.parent_id AS "parentId",c.created_at AS "createdAt",u.display_name AS "authorName"
        FROM community_comments c JOIN users u ON u.id=c.author_id
        WHERE c.${column}=$1 AND (c.id IN (SELECT id FROM roots) OR c.parent_id IN (SELECT id FROM roots))
        ORDER BY c.created_at,c.id`, [id]),
      db.query(`SELECT (SELECT count(*)::int FROM ${likes} WHERE ${column}=$1) AS likes, EXISTS(SELECT 1 FROM ${likes} l JOIN users u ON u.id=l.user_id WHERE l.${column}=$1 AND u.auth_subject=$2) AS liked, (SELECT count(*)::int FROM community_comments WHERE ${column}=$1) AS total`, [id,session?.sub ?? ''])
    ]);
    return Response.json({ comments: comments.rows, ...counts.rows[0] }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: 'Chưa thể tải tương tác. Vui lòng thử lại.' }, { status: 503 });
  }
}
export const GET = handle;
export const POST = handle;
export const PUT = handle;
