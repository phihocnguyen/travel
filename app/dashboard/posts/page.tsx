import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { listApprovedPosts, listPostsByAuthor } from '@/lib/posts/store';
import { postPlainText } from '@/lib/posts/content';
import { decodeStatusText } from '@/lib/posts/status';
import CommunityFeed from '@/components/dashboard/CommunityFeed';

export const instant = false;
export const metadata = { title: 'Bảng tin cộng đồng · Vị Xoài Dẫn Lối' };

export default async function CommunityPage() {
  const session = await getSession();
  if (!session) redirect('/login?next=/dashboard/posts');
  const [posts, mine] = await Promise.all([listApprovedPosts(), listPostsByAuthor(session.sub)]);
  const statuses = posts.map(post => ({ ...post, statusText: decodeStatusText(
    post.content.replace(/<br\s*\/?>|<\/(?:p|h[2-4]|li|tr)>/gi, '\n').split('\n').map(postPlainText).join('\n').replace(/\n{3,}/g, '\n\n').trim()
  ) }));
  return <CommunityFeed posts={statuses} mine={mine} name={session.name} />;
}
