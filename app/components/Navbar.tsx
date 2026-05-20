'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export function Navbar({ totalTools }: { totalTools: number }) {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const enterUser = () => {
    if (userTimer.current) clearTimeout(userTimer.current);
    setUserMenuOpen(true);
  };
  const leaveUser = () => {
    userTimer.current = setTimeout(() => setUserMenuOpen(false), 150);
  };

  const handleLogout = () => {
    setUserMenuOpen(false);
    logout();
    router.push('/');
  };

  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{ background: '#fff', borderColor: '#e5e7eb', boxShadow: '0 1px 12px rgba(37,150,190,0.08)' }}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">

        {/* Sidebar drawer trigger — left of logo */}
        <button
          aria-label="Browse categories"
          onClick={() => window.dispatchEvent(new Event('open-sidebar'))}
          className="flex flex-col justify-center items-center w-9 h-9 rounded-lg gap-1.5 hover:bg-gray-100 transition-colors shrink-0"
        >
          <span className="w-5 h-0.5 rounded-full bg-gray-700 block" />
          <span className="w-3.5 h-0.5 rounded-full bg-gray-500 block" />
          <span className="w-5 h-0.5 rounded-full bg-gray-700 block" />
        </button>

        {/* Logo */}
        <Link href="/" className="shrink-0">
          <Image
            src="/Website_logo_1.2-RB.png"
            alt="Digital Hub"
            width={180}
            height={56}
            className="h-14 w-auto object-contain"
            priority
          />
        </Link>

        {/* Right side — always visible on all screen sizes */}
        <div className="ml-auto flex items-center gap-2">

          <span className="text-sm font-bold shrink-0" style={{ color: '#2596be' }}>
            {totalTools}+ Free Tools
          </span>

          {/* Auth section */}
          {!authLoading && (
            user ? (
              /* ── Logged-in user menu ── */
              <div
                className="relative"
                onMouseEnter={enterUser}
                onMouseLeave={leaveUser}
              >
                <button
                  className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full transition-all hover:bg-gray-100"
                  onClick={() => setUserMenuOpen((v) => !v)}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-black shrink-0"
                    style={{ background: 'linear-gradient(135deg, #2596be, #7c3aed)' }}
                  >
                    {user.username[0].toUpperCase()}
                  </div>
                  <span className="hidden md:block text-sm font-semibold text-gray-700 max-w-[100px] truncate">
                    {user.username}
                  </span>
                  <svg width="10" height="7" viewBox="0 0 10 7" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M1 1l4 4 4-4" />
                  </svg>
                </button>

                {userMenuOpen && (
                  <div
                    className="absolute top-[calc(100%+6px)] right-0 bg-white rounded-2xl z-50 py-2 min-w-[180px]"
                    style={{ border: '1px solid #e5e7eb', boxShadow: '0 16px 40px rgba(0,0,0,0.12)' }}
                    onMouseEnter={enterUser}
                    onMouseLeave={leaveUser}
                  >
                    <div className="px-4 py-2 border-b" style={{ borderColor: '#f1f5f9' }}>
                      <p className="text-xs font-black text-gray-900 truncate">{user.username}</p>
                      <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors w-full"
                    >
                      <span className="text-base">📂</span> My Files
                    </Link>
                    <div className="border-t mx-2 my-1" style={{ borderColor: '#f1f5f9' }} />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors w-full"
                    >
                      <span className="text-base">→</span> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* ── Guest auth buttons — always visible ── */
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-1.5 rounded-lg text-sm font-bold transition-all hover:bg-gray-100"
                  style={{ color: '#374151', border: '1.5px solid #e5e7eb' }}
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-1.5 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #2596be, #1e7ea1)' }}
                >
                  Sign Up
                </Link>
              </div>
            )
          )}
        </div>
      </div>
    </header>
  );
}
