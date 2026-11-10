import CommunityLayout from './CommunityLayout';
import { CommunityLoading } from './CommunityPost';
import './community.css';

export default function CommunityPageLoading({ video = false }: { video?: boolean }) {
  return <div className="social-page" aria-busy="true">
    <div aria-hidden="true" className="social-heading"><div><div className="social-skeleton h-2 w-40" /><div className="social-skeleton mt-3 h-8 w-60" /><div className="social-skeleton mt-3 hidden h-3 w-64 sm:block" /></div><div className="social-skeleton h-12 w-44 !rounded-xl" /></div>
    <CommunityLayout sidebar={<><section aria-hidden="true" className="social-side-card"><div className="social-skeleton h-3 w-40" /><div className="social-skeleton my-4 h-12 w-3/4" /><div className="social-skeleton mb-4 h-16 w-full" /><div className="social-skeleton mb-3 h-3 w-36" />{[0, 1, 2, 3].map(item => <div key={item} className="social-member-row"><div className="social-skeleton h-8 w-8 !rounded-full" /><div className="social-skeleton h-4 w-28" /></div>)}</section><div aria-hidden="true" className="social-skeleton h-48 !rounded-2xl" /></>}>
      <div aria-hidden="true" className="social-card social-composer"><div className="social-composer-top"><div className="social-skeleton social-avatar shrink-0" /><div className="social-skeleton h-12 flex-1 !rounded-xl" /></div><div className="social-composer-bottom"><div className="social-skeleton h-5 w-28" /><div className="social-skeleton h-5 w-32" /></div></div>
      <div aria-hidden="true" className="social-toolbar"><div className="social-skeleton h-8 w-52" /><div className="social-skeleton h-8 w-24" /></div><div aria-hidden="true" className="social-skeleton h-10 w-full !rounded-xl" />
      <CommunityLoading video={video} /><CommunityLoading video={video} />
    </CommunityLayout>
  </div>;
}
