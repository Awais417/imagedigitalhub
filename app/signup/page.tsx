'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function SignupPage() {
  const { signup } = useAuth();
  const router      = useRouter();

  const [email, setEmail]         = useState('');
  const [username, setUsername]   = useState('');
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [showPw, setShowPw]       = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !username || !password) { setError('Please fill in all fields.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    setError('');
    try {
      await signup(email, username, password);
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
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-sky-400 hover:text-sky-300 transition-colors">
            Sign in
          </Link>
        </span>
      </header>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-5"
              style={{ background: 'rgba(37,150,190,0.15)', color: '#7dd3fc', border: '1px solid rgba(37,150,190,0.3)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
              Free forever · No credit card
            </div>
            <h1 className="text-3xl font-black text-white mb-2">Create your account</h1>
            <p className="text-slate-400 text-sm">Save your converted files and access them anytime</p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl p-8"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)' }}
          >
            {/* Email */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Email</label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.12)' }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#2596be')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
              />
            </div>

            {/* Username */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Username</label>
              <input
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
                placeholder="yourname"
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.12)' }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#2596be')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
              />
            </div>

            {/* Password */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full px-4 py-3 pr-12 rounded-xl text-sm text-white placeholder-slate-500 outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.12)' }}
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

            {/* Confirm password */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Confirm Password</label>
              <input
                type={showPw ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat password"
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: `1.5px solid ${confirm && confirm !== password ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.12)'}`,
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#2596be')}
                onBlur={(e) => (e.currentTarget.style.borderColor = confirm && confirm !== password ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.12)')}
              />
              {confirm && confirm !== password && (
                <p className="text-xs text-red-400 mt-1">Passwords don&apos;t match</p>
              )}
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
                  Creating account...
                </span>
              ) : 'Create Account →'}
            </button>

            <p className="text-center text-sm text-slate-500 mt-5">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-sky-400 hover:text-sky-300 transition-colors">
                Sign in
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
