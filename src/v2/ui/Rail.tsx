import type { SeriesGroup } from '../types';
import { Poster } from './Poster';

export function Rail({ title, groups, notes }: { title: string; groups: SeriesGroup[]; notes?: Record<string, string> }) {
  if (!groups.length) return null;
  return (
    <section>
      <h2 className="mb-2.5 mt-7 px-[18px] text-[24px]">{title}</h2>
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-[18px] [scrollbar-width:none]">
        {groups.map(g => <Poster key={g.title} group={g} width="136px" note={notes?.[g.title]} />)}
      </div>
    </section>
  );
}
