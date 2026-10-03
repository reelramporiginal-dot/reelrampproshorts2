import { Link } from 'react-router-dom';
import type { SeriesGroup } from '../types';
import { badgeFor, gradientFor, seriesPath } from '../lib/poster';

export function Poster({ group, note, width }: { group: SeriesGroup; note?: string; width?: string }) {
  const badge = badgeFor(group);
  return (
    <Link to={seriesPath(group.title)} className="block shrink-0 snap-start text-left" style={{ width }}>
      <div className="relative flex aspect-[2/3] items-end overflow-hidden rounded-2xl p-2.5" style={{ background: gradientFor(group.title) }}>
        {group.poster && <img src={group.poster} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
        {badge && (
          <span className={`absolute left-2 top-2 z-10 rounded-full px-2 py-0.5 text-[12.5px] font-bold ${badge === 'FREE' ? 'bg-rr-ok text-[#06130d]' : 'bg-rr-ember text-white'}`}>
            {badge}
          </span>
        )}
        <span className="relative z-10 font-display text-[20px] leading-tight">{group.title}</span>
      </div>
      <em className="mt-1.5 block text-[14.5px] not-italic text-rr-dim">{note ?? `${group.episodes.length} episodes · ${group.category}`}</em>
    </Link>
  );
}
