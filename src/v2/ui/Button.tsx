import type { ButtonHTMLAttributes } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'gold' | 'ghost' | 'quiet';
  block?: boolean;
  loading?: boolean;
};

const base = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 font-body text-[16px] font-bold transition active:scale-[.98] disabled:opacity-50 disabled:pointer-events-none';
const variants = {
  gold: 'bg-rr-gold text-[#14100A] shadow-[0_6px_24px_-8px_var(--gold)]',
  ghost: 'border border-rr-line bg-rr-s1 text-rr-tx',
  quiet: 'text-rr-hi',
};

export function Button({ variant = 'gold', block, loading, className = '', children, disabled, ...rest }: Props) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${block ? 'w-full' : ''} ${className}`}
    >
      {loading ? 'Ruko…' : children}
    </button>
  );
}
