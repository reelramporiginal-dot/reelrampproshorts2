import supabase from './supabase';

/** Same-tab Supabase OAuth: works on mobile, PWA and in-app browsers (no popup/proxy). */
export async function signInWithGoogle(_appName = 'ReelRamp Pro') {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin, queryParams: { prompt: 'select_account' } },
  });
  if (error) {
    console.error('Google login failed:', error.message);
    alert('Google login abhi nahi ho paya. Dobara try karein ya email se login karein.');
  }
}

/** Kept for compatibility: Supabase (detectSessionInUrl) handles the return itself. */
export async function handleGoogleRedirect() {}
