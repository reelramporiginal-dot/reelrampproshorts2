import { NavLink } from 'react-router-dom';
import { Home, Compass, Coins, User } from 'lucide-react';

const items = [
  { to: '/v2', label: 'Home', Icon: Home, end: true },
  { to: '/v2/explore', label: 'Explore', Icon: Compass },
  { to: '/v2/rewards', label: 'Rewards', Icon: Coins },
  { to: '/v2/profile', label: 'Profile', Icon: User },
];

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-rr-line bg-rr-bg/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-md">
        {items.map(({ to, label, Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink to={to} end={end} className={({ isActive }) =>
              `flex min-h-14 flex-col items-center justify-center gap-0.5 text-[13px] font-semibold ${isActive ? 'text-rr-gold' : 'text-rr-dim'}`}>
              <Icon size={22} aria-hidden />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

