'use client';

import { useEffect, useState } from 'react';
import { CATEGORIES } from '../lib/tools';

const pdfCats = CATEGORIES.filter((c) => !c.id.startsWith('img-'));
const imgCats = CATEGORIES.filter((c) =>  c.id.startsWith('img-'));

const groups = [
  { label: 'PDF Tools',   icon: '📄', accent: '#2596be', cats: pdfCats },
  { label: 'Image Tools', icon: '🖼️', accent: '#8b5cf6', cats: imgCats },
];

export function SidebarNav() {
  const [active, setActive] = useState<string>('');
  const [open,   setOpen]   = useState(false);

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>('section[id]'));
    if (!sections.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length) setActive(visible[0].target.id);
      },
      { rootMargin: '-10% 0px -70% 0px', threshold: 0 },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  /* ── Open via custom event (fired by SidebarBtn in page.tsx) ── */
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('open-sidebar', handler);
    return () => window.removeEventListener('open-sidebar', handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top: y, behavior: 'smooth' });
    setOpen(false);
  };

  const navContent = (
    <>
      {groups.map((group) => (
        <div key={group.label} className="mb-3">
          <div
            className="flex items-center gap-2 px-3 py-2 mb-1 rounded-lg text-xs font-black uppercase tracking-widest"
            style={{ color: group.accent, background: group.accent + '12' }}
          >
            <span>{group.icon}</span>
            <span>{group.label}</span>
          </div>
          {group.cats.map((cat) => {
            const isActive = active === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => scrollTo(cat.id)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-all duration-150 cursor-pointer"
                style={{
                  background: isActive ? cat.color + '18' : 'transparent',
                  color:      isActive ? cat.color       : '#374151',
                  fontWeight: isActive ? 700              : 500,
                  borderLeft: isActive ? `3px solid ${cat.color}` : '3px solid transparent',
                }}
              >
                <span className="text-base leading-none">{cat.icon}</span>
                <span className="truncate">{cat.label}</span>
              </button>
            );
          })}
        </div>
      ))}
    </>
  );

  return (
    <>
      {/* ── BACKDROP ── */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden="true"
        className="fixed inset-0 z-50 transition-opacity duration-300"
        style={{
          background: 'rgba(15,23,42,0.55)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
        }}
      />

      {/* ── SLIDE-IN DRAWER ── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className="fixed top-0 left-0 h-full z-50 flex flex-col"
        style={{
          width: 268,
          background: '#f8fafc',
          boxShadow: '6px 0 40px rgba(0,0,0,0.20)',
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        {/* Header bar */}
        <div
          className="flex items-center justify-between px-3 py-3 shrink-0"
          style={{ borderBottom: '1px solid #e2e8f0' }}
        >
          <span className="text-xs font-black uppercase tracking-widest" style={{ color: '#94a3b8' }}>
            Browse Tools
          </span>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="flex items-center justify-center rounded-lg transition-all duration-150 active:scale-90"
            style={{ width: 30, height: 30, background: '#f1f5f9', color: '#64748b' }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Category list */}
        <div className="flex-1 overflow-y-auto px-2 py-3">
          {navContent}
        </div>
      </div>
    </>
  );
}
