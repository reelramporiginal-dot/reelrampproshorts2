import { useState } from 'react';
import { Button, Chip, Sheet, Skeleton } from '../ui';
import { useCatalog, useSession, useSubscription } from '../api/hooks';

// S1 check screen: proves tokens, UI kit and the locked-down API work together. S2 replaces this with the real Home.
export default function Home() {
  const { groups, isLoading, error } = useCatalog();
  const { userId } = useSession();
  const { isPremium } = useSubscription();
  const [open, setOpen] = useState(false);

  return (
    <div className="mx-auto max-w-md space-y-5 px-4 pt-6">
      <h1 className="text-[30px] leading-tight text-rr-hi">ReelRamp</h1>
      <p className="text-[15px] text-rr-dim">Foundation check: {userId ? (isPremium ? 'premium user' : 'logged in') : 'guest'}</p>

      <section className="space-y-3">
        <h2 className="text-[20px]">Catalog (live API)</h2>
        {isLoading && <><Skeleton className="h-16" /><Skeleton className="h-16" /></>}
        {error && <p className="text-rr-ember">API error: {(error as Error).message}</p>}
        {groups.map(g => (
          <div key={g.title} className="rounded-2xl border border-rr-line bg-rr-s1 p-4">
            <div className="font-bold">{g.title}</div>
            <div className="text-[14.5px] text-rr-dim">{g.episodes.length} episodes · {g.category}</div>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-[20px]">UI kit</h2>
        <div className="flex gap-2 overflow-x-auto"><Chip active>Hindi</Chip><Chip>Romance</Chip><Chip>Thriller</Chip></div>
        <Button block onClick={() => setOpen(true)}>Sheet kholein</Button>
        <Button block variant="ghost">Ghost button</Button>
      </section>

      <Sheet open={open} onClose={() => setOpen(false)} title="Bottom sheet">
        <p className="mb-4 text-rr-dim">Drag neeche karke band karein.</p>
        <Button block onClick={() => setOpen(false)}>Theek hai</Button>
      </Sheet>
    </div>
  );
}

