import { useState } from 'react';
import supabase from '../../lib/supabase';
import { Button } from './Button';

// Minimal Google sign-in (full login/profile comes in S5). Returns the user to the same page.
export function LoginButton({ label = 'Google se login karein', variant = 'gold' as const }) {
  const [busy, setBusy] = useState(false);
  return (
    <Button block variant={variant} loading={busy} onClick={async () => {
      setBusy(true);
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.href } });
      if (error) setBusy(false);
    }}>
      {label}
    </Button>
  );
}
