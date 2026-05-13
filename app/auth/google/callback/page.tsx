'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Landing page after Google OAuth.
 * The backend redirects here with ?token=...&user=...
 * We store it in localStorage (same format as normal login) then go to /dashboard.
 */
export default function GoogleCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const token  = params.get('token');
      const userRaw = params.get('user');

      if (!token || !userRaw) {
        setError('Google sign-in failed. Missing parameters.');
        return;
      }

      const user = JSON.parse(decodeURIComponent(userRaw));
      localStorage.setItem('auth', JSON.stringify({ user, token }));

      // Dispatch storage event so AuthContext in other tabs updates
      window.dispatchEvent(new Event('storage'));

      router.replace(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch {
      setError('Google sign-in failed. Please try again.');
    }
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f172a' }}>
        <div className="text-center">
          <p className="text-red-400 text-sm mb-4">{error}</p>
          <a href="/login" className="text-sky-400 text-sm hover:underline">Back to Login</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f172a' }}>
      <div className="flex flex-col items-center gap-3">
        <svg className="animate-spin h-8 w-8" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#2596be" strokeWidth="4"/>
          <path className="opacity-75" fill="#2596be" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
        <p className="text-slate-400 text-sm">Signing you in...</p>
      </div>
    </div>
  );
}
