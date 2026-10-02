import type { ButtonHTMLAttributes } from 'react';

export function Chip({ active, className = '', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      {...rest}
      className={`min-h-11 shrink-0 rounded-full border px-4 text-[15px] font-semibold transition ${
        active ? 'border-rr-gold bg-rr-gold text-[#14100A]' : 'border-rr-line bg-rr-s1 text-rr-dim'
      } ${className}`}
    />
  );
}
