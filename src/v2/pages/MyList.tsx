import { Link } from 'react-router-dom';
import { LoginButton, Poster, Skeleton } from '../ui';
import { useBookmarks, useCatalog, useSession } from '../api/hooks';
import type { SeriesGroup } from '../types';

export default function MyList() {
  const { userId, ready } = useSession();
  const { data: marks, isLoading: l1 } = useBookmarks();
  const { groups, isLoading: l2 } = useCatalog();

  const saved = new Set((marks || []).map(m => m.video_id));
  const items = groups
    .map(g => ({ g, eps: g.episodes.filter(e => saved.has(e.id)) }))
    .filter(x => x.eps.length);

  return (
    <div className="px-[18px] pb-6 pt-4">
      <h1 className="text-[28px]">My List</h1>

      {ready && !userId && (
        <div className="mt-4 space-y-2 rounded-2xl border border-rr-line bg-rr-s1 p-4">
          <p className="text-[15px]">Pasandida episodes save karne ke liye login karein.</p>
          <LoginButton />
        </div>
      )}

      {userId && (l1 || l2) && <div className="mt-4 grid grid-cols-2 gap-3"><Skeleton className="aspect-[2/3]" /><Skeleton className="aspect-[2/3]" /></div>}

      {userId && !l1 && !l2 && items.length === 0 && (
        <p className="mt-6 text-rr-dim">
          Abhi kuch save nahi hai. Player me bookmark dabayein, ya{' '}
          <Link to="/v2/explore" className="text-rr-hi underline">Explore</Link> karein.
        </p>
      )}

      {items.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {items.map(({ g, eps }) => {
            const grp: SeriesGroup = g;
            const note = eps.length === 1 ? `Ep ${eps[0].episode_number} saved` : `${eps.length} episodes saved`;
            return <Poster key={g.title} group={grp} note={note} />;
          })}
        </div>
      )}
    </div>
  );
}
