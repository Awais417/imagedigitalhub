'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { href: '/admin',           label: 'Overview',   icon: '📊' },
  { href: '/admin/analytics', label: 'Analytics',  icon: '📈' },
  { href: '/admin/storage',   label: 'Storage',    icon: '🗄️' },
  { href: '/admin/users',     label: 'Users',      icon: '👥' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();
  const [sideOpen, setSideOpen] = useState(false);

  /* Redirect non-admins — must be in useEffect, not render body */
  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.replace('/');
    }
  }, [loading, user, router]);

  if (loading || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f172a' }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#2596be', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#0f172a', color: '#e2e8f0' }}>

      {/* ── MOBILE BACKDROP ── */}
      {sideOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setSideOpen(false)}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside
        className={`fixed top-0 left-0 h-full z-50 flex flex-col lg:static transition-transform duration-300 ${sideOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{
          width: 240,
          background: '#0f172a',
          borderRight: '1px solid #1e293b',
        }}
      >
        {/* Logo area */}
        <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: '#1e293b' }}>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black text-white shrink-0"
            style={{ background: 'linear-gradient(135deg,#1d4ed8,#2596be)' }}
          >
            A
          </div>
          <div>
            <p className="text-sm font-black text-white leading-tight">Admin Panel</p>
            <p className="text-[10px]" style={{ color: '#64748b' }}>godoclab.com</p>
          </div>
          <button
            className="lg:hidden ml-auto text-gray-400 hover:text-white"
            onClick={() => setSideOpen(false)}
          >
            ✕
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {NAV.map((n) => {
            const active = pathname === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setSideOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150"
                style={{
                  background: active ? 'rgba(37,150,190,0.15)' : 'transparent',
                  color:      active ? '#38bdf8'               : '#94a3b8',
                  borderLeft: active ? '3px solid #2596be'     : '3px solid transparent',
                }}
              >
                <span className="text-base">{n.icon}</span>
                {n.label}
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        <div className="px-4 py-4 border-t" style={{ borderColor: '#1e293b' }}>
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0"
              style={{ background: 'linear-gradient(135deg,#2596be,#7c3aed)' }}
            >
              {user?.username[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{user?.username}</p>
              <p className="text-[10px] truncate" style={{ color: '#64748b' }}>{user?.email}</p>
            </div>
          </div>
          <Link
            href="/"
            className="mt-3 flex items-center gap-2 text-xs font-semibold transition-colors hover:text-white"
            style={{ color: '#64748b' }}
          >
            ← Back to site
          </Link>
        </div>
      </aside>

      {/* ── MAIN AREA ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar (mobile) */}
        <div
          className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 lg:hidden"
          style={{ background: '#0f172a', borderBottom: '1px solid #1e293b' }}
        >
          <button
            onClick={() => setSideOpen(true)}
            className="flex flex-col gap-1 p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <span className="w-5 h-0.5 bg-gray-400 rounded block" />
            <span className="w-3.5 h-0.5 bg-gray-500 rounded block" />
            <span className="w-5 h-0.5 bg-gray-400 rounded block" />
          </button>
          <span className="text-sm font-bold text-white">Admin Panel</span>
        </div>

        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
