
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-rr-s2 ${className}`} aria-hidden />;
}
