'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CATEGORIES } from '../lib/tools';
import { useAuth } from '../context/AuthContext';

const pdfCats = CATEGORIES.filter((c) => !c.id.startsWith('img-'));
const imgCats = CATEGORIES.filter((c) =>  c.id.startsWith('img-'));

const groups = [
  { label: 'PDF TOOLS',   cats: pdfCats, accent: '#2596be', lightBg: '#eff6ff' },
  { label: 'IMAGE TOOLS', cats: imgCats, accent: '#8b5cf6', lightBg: '#f5f3ff' },
];

export function Navbar({ totalTools }: { totalTools: number }) {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();

  const [openDropdown, setOpenDropdown]     = useState<string | null>(null);
  const [mobileOpen, setMobileOpen]         = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen]     = useState(false);
  const timer     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const enter = (label: string) => {
    if (timer.current) clearTimeout(timer.current);
    setOpenDropdown(label);
  };
  const leave = () => {
    timer.current = setTimeout(() => setOpenDropdown(null), 120);
  };

  const enterUser = () => {
    if (userTimer.current) clearTimeout(userTimer.current);
    setUserMenuOpen(true);
  };
  const leaveUser = () => {
    userTimer.current = setTimeout(() => setUserMenuOpen(false), 150);
  };

  const scrollTo = (id: string) => {
    setOpenDropdown(null);
    setMobileOpen(false);
    setMobileExpanded(null);
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 72;
    window.scrollTo({ top: y, behavior: 'smooth' });
  };

  const handleLogout = () => {
    setUserMenuOpen(false);
    setMobileOpen(false);
    logout();
    router.push('/');
  };

  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{ background: '#fff', borderColor: '#e5e7eb', boxShadow: '0 1px 12px rgba(37,150,190,0.08)' }}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">

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
            src="/Website Logo.png"
            alt="Digital Hub"
            width={140}
            height={44}
            className="h-10 w-auto object-contain"
            priority
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-0.5 flex-1">
          {groups.map((g) => (
            <div
              key={g.label}
              className="relative"
              onMouseEnter={() => enter(g.label)}
              onMouseLeave={leave}
            >
              <button
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-extrabold tracking-widest uppercase transition-all duration-150"
                style={{
                  color:      openDropdown === g.label ? g.accent  : '#374151',
                  background: openDropdown === g.label ? g.lightBg : 'transparent',
                }}
              >
                {g.label}
                <svg
                  width="11" height="8" viewBox="0 0 12 8" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                  className={`transition-transform duration-200 ${openDropdown === g.label ? 'rotate-180' : ''}`}
                >
                  <path d="M1 1l5 5 5-5" />
                </svg>
              </button>

              {openDropdown === g.label && (
                <div
                  className="absolute top-[calc(100%+4px)] left-0 bg-white rounded-2xl z-50 p-3"
                  style={{ minWidth: 320, border: '1px solid #e5e7eb', boxShadow: '0 16px 48px rgba(0,0,0,0.14)' }}
                  onMouseEnter={() => enter(g.label)}
                  onMouseLeave={leave}
                >
                  <p className="text-[10px] font-black uppercase tracking-widest px-2 mb-2" style={{ color: g.accent }}>
                    {g.label}
                  </p>
                  <div className="grid grid-cols-2 gap-0.5">
                    {g.cats.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => scrollTo(cat.id)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors hover:bg-gray-50 group"
                      >
                        <span
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-sm text-white shrink-0"
                          style={{ background: cat.color }}
                        >
                          {cat.icon}
                        </span>
                        <span className="text-xs font-semibold text-gray-700 group-hover:text-gray-900 leading-tight">
                          {cat.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden sm:block text-sm font-bold" style={{ color: '#2596be' }}>
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
                    {/* User info */}
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
              /* ── Guest auth buttons ── */
              <div className="hidden sm:flex items-center gap-2">
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

          {/* Hamburger */}
          <button
            className="lg:hidden flex flex-col justify-center items-center w-9 h-9 rounded-lg gap-1.5 hover:bg-gray-100 transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
          >
            <span
              className="w-5 h-0.5 rounded-full bg-gray-700 transition-all duration-200 origin-center"
              style={{ transform: mobileOpen ? 'rotate(45deg) translateY(7px)' : 'none' }}
            />
            <span
              className="w-5 h-0.5 rounded-full bg-gray-700 transition-all duration-200"
              style={{ opacity: mobileOpen ? 0 : 1 }}
            />
            <span
              className="w-5 h-0.5 rounded-full bg-gray-700 transition-all duration-200 origin-center"
              style={{ transform: mobileOpen ? 'rotate(-45deg) translateY(-7px)' : 'none' }}
            />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t" style={{ borderColor: '#e5e7eb', background: '#fff' }}>

          {/* Mobile auth row */}
          {!authLoading && (
            user ? (
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#f1f5f9' }}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-black"
                    style={{ background: 'linear-gradient(135deg, #2596be, #7c3aed)' }}
                  >
                    {user.username[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{user.username}</p>
                    <p className="text-[10px] text-gray-400">{user.email}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                    style={{ background: '#eff6ff', color: '#2596be' }}
                  >
                    My Files
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-500 hover:bg-red-50 transition-all"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2 px-4 py-3 border-b" style={{ borderColor: '#f1f5f9' }}>
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 py-2 rounded-lg text-sm font-bold text-center transition-all hover:bg-gray-50"
                  style={{ color: '#374151', border: '1.5px solid #e5e7eb' }}
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 py-2 rounded-lg text-sm font-bold text-white text-center transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #2596be, #1e7ea1)' }}
                >
                  Sign Up
                </Link>
              </div>
            )
          )}

          {groups.map((g) => (
            <div key={g.label} className="border-b last:border-0" style={{ borderColor: '#f1f5f9' }}>
              <button
                className="w-full flex items-center justify-between px-4 py-3 text-[13px] font-extrabold uppercase tracking-widest transition-colors"
                style={{ color: mobileExpanded === g.label ? g.accent : '#374151' }}
                onClick={() => setMobileExpanded(mobileExpanded === g.label ? null : g.label)}
              >
                <span className="flex items-center gap-2">
                  <span>{mobileExpanded === g.label ? '▾' : '▸'}</span>
                  {g.label}
                </span>
                <span className="text-xs font-medium text-gray-400">{g.cats.length} categories</span>
              </button>

              {mobileExpanded === g.label && (
                <div className="px-3 pb-3 grid grid-cols-2 gap-1.5">
                  {g.cats.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => scrollTo(cat.id)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-colors"
                      style={{ background: cat.color + '12', border: `1px solid ${cat.color}22` }}
                    >
                      <span
                        className="w-6 h-6 rounded-md flex items-center justify-center text-xs text-white shrink-0"
                        style={{ background: cat.color }}
                      >
                        {cat.icon}
                      </span>
                      <span className="text-xs font-semibold text-gray-800 leading-tight">{cat.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </header>
  );
}
