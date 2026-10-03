import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Chip, Poster, Skeleton } from '../ui';
import { useCatalog } from '../api/hooks';
import { avgSeconds } from '../lib/poster';

const DURS = [
  { label: 'Sab', test: (_s: number) => true },
  { label: '1 min tak', test: (s: number) => s <= 60 },
  { label: '1 se 2 min', test: (s: number) => s > 60 && s <= 120 },
  { label: '2 min se zyada', test: (s: number) => s > 120 },
];

export default function Explore() {
  const { groups, isLoading } = useCatalog();
  const [q, setQ] = useState('');
  const [genre, setGenre] = useState('Sab');
  const [dur, setDur] = useState(0);

  const genres = useMemo(() => ['Sab', ...Array.from(new Set(groups.map(g => g.category).filter(Boolean)))], [groups]);
  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return groups.filter(g =>
      (genre === 'Sab' || g.category === genre) &&
      DURS[dur].test(avgSeconds(g)) &&
      (!needle || `${g.title} ${g.category} ${g.description}`.toLowerCase().includes(needle)),
    );
  }, [groups, q, genre, dur]);

  return (
    <div className="pb-6">
      <h1 className="px-[18px] pb-1.5 pt-4 text-[28px]">Khojein</h1>

      <label className="mx-[18px] my-1.5 flex min-h-[50px] items-center gap-2.5 rounded-full border border-rr-line bg-rr-s1 px-4">
        <Search size={20} className="text-rr-dim" aria-hidden />
        <input
          value={q} onChange={e => setQ(e.target.value)} placeholder="Series ya genre khojein" aria-label="Search"
          className="min-h-[46px] flex-1 bg-transparent text-rr-tx outline-none placeholder:text-rr-dim"
        />
      </label>

      <div className="px-[18px] pt-2.5 text-[14.5px] font-semibold text-rr-dim">Genre</div>
      <div className="flex gap-2 overflow-x-auto px-[18px] py-2 [scrollbar-width:none]">
        {genres.map(g => <Chip key={g} active={g === genre} onClick={() => setGenre(g)}>{g}</Chip>)}
      </div>

      <div className="px-[18px] pt-1 text-[14.5px] font-semibold text-rr-dim">Episode kitne minute ka</div>
      <div className="flex gap-2 overflow-x-auto px-[18px] py-2 [scrollbar-width:none]">
        {DURS.map((d, i) => <Chip key={d.label} active={i === dur} onClick={() => setDur(i)}>{d.label}</Chip>)}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-3 gap-3 px-[18px] py-2">{[0, 1, 2].map(i => <Skeleton key={i} className="aspect-[2/3]" />)}</div>
      ) : results.length ? (
        <div className="grid grid-cols-3 gap-3 px-[18px] py-2">{results.map(g => <Poster key={g.title} group={g} />)}</div>
      ) : (
        <p className="px-6 py-10 text-center text-rr-dim">Kuch nahi mila. Filter badal kar dekhein.</p>
      )}
    </div>
  );
}

