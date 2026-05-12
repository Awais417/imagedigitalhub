'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

const GOOGLE_AUTH_URL =
  (process.env.NEXT_PUBLIC_API_URL ?? 'https://api.godoclab.com/api') + '/auth/google';

export default function LoginPage() {
  const { login } = useAuth();
  const router     = useRouter();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPw, setShowPw]     = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)' }}
    >
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-4">
        <Link href="/">
          <Image src="/Website Logo.png" alt="Digital Hub" width={130} height={40}
            className="h-9 w-auto object-contain brightness-0 invert" />
        </Link>
        <span className="text-sm text-slate-400">
          No account?{' '}
          <Link href="/signup" className="font-semibold text-sky-400 hover:text-sky-300 transition-colors">
            Sign up free
          </Link>
        </span>
      </header>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Badge */}
          <div className="text-center mb-8">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-5"
              style={{ background: 'rgba(37,150,190,0.15)', color: '#7dd3fc', border: '1px solid rgba(37,150,190,0.3)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
              Free · No credit card required
            </div>
            <h1 className="text-3xl font-black text-white mb-2">Welcome back</h1>
            <p className="text-slate-400 text-sm">Sign in to access your conversion history</p>
          </div>

          {/* Google OAuth button */}
          <a
            href={GOOGLE_AUTH_URL}
            className="flex items-center justify-center gap-3 w-full py-3 rounded-xl text-sm font-bold mb-6 transition-all hover:opacity-90"
            style={{ background: '#fff', color: '#1f2937', border: '1.5px solid #e5e7eb' }}
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continue with Google
          </a>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
            <span className="text-xs text-slate-500 font-medium">or sign in with email</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl p-8"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)' }}
          >
            {/* Email / Username */}
            <div className="mb-5">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                Email or Username
              </label>
              <input
                type="text"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com or username"
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: '1.5px solid rgba(255,255,255,0.12)',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#2596be')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
              />
            </div>

            {/* Password */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  className="w-full px-4 py-3 pr-12 rounded-xl text-sm text-white placeholder-slate-500 outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    border: '1.5px solid rgba(255,255,255,0.12)',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#2596be')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors text-xs font-semibold"
                >
                  {showPw ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                className="mb-5 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2"
                style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)' }}
              >
                <span>⚠</span> {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-white font-extrabold text-sm uppercase tracking-widest transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: loading ? '#334155' : 'linear-gradient(135deg, #2596be, #1e7ea1)' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign In →'}
            </button>

            <p className="text-center text-sm text-slate-500 mt-5">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-semibold text-sky-400 hover:text-sky-300 transition-colors">
                Create one free
              </Link>
            </p>
          </form>

          <p className="text-center text-xs text-slate-600 mt-6">
            Just want to use tools?{' '}
            <Link href="/" className="text-slate-500 hover:text-slate-400 transition-colors underline">
              Continue without an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
