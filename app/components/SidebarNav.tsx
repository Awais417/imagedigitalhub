'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CATEGORIES, TOOLS } from '../lib/tools';

const pdfCats = CATEGORIES.filter((c) => !c.id.startsWith('img-'));
const imgCats = CATEGORIES.filter((c) =>  c.id.startsWith('img-'));

const groups = [
  { label: 'PDF Tools',   icon: '📄', accent: '#2596be', cats: pdfCats },
  { label: 'Image Tools', icon: '🖼️', accent: '#8b5cf6', cats: imgCats },
];

// Map category id → tools
const toolsByCategory: Record<string, typeof TOOLS> = {};
for (const tool of TOOLS) {
  if (!toolsByCategory[tool.category]) toolsByCategory[tool.category] = [];
  toolsByCategory[tool.category].push(tool);
}

export function SidebarNav() {
  const [active,       setActive]       = useState<string>('');
  const [open,         setOpen]         = useState(false);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());

  const toggleCat = (catId: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  /* ── Active section via IntersectionObserver (homepage) ── */
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>('section[id]'));
    if (!sections.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length) {
          const id = visible[0].target.id;
          setActive(id);
          setExpandedCats((prev) => new Set([...prev, id]));
        }
      },
      { rootMargin: '-10% 0px -70% 0px', threshold: 0 },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  /* ── Open via custom event from Navbar ── */
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('open-sidebar', handler);
    return () => window.removeEventListener('open-sidebar', handler);
  }, []);

  /* ── Escape key to close ── */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  /* ── Lock body scroll while open ── */
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

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
          width: 280,
          background: '#f8fafc',
          boxShadow: '6px 0 40px rgba(0,0,0,0.20)',
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        {/* Header bar */}
        <div
          className="flex items-center justify-between px-4 py-3 shrink-0"
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

        {/* Accordion list */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
          {groups.map((group) => (
            <div key={group.label}>

              {/* Group label */}
              <div
                className="flex items-center gap-2 px-3 py-2 mb-1 rounded-lg text-xs font-black uppercase tracking-widest"
                style={{ color: group.accent, background: group.accent + '12' }}
              >
                <span>{group.icon}</span>
                <span>{group.label}</span>
              </div>

              {/* Categories */}
              {group.cats.map((cat) => {
                const isExpanded = expandedCats.has(cat.id);
                const isActive   = active === cat.id;
                const tools      = toolsByCategory[cat.id] ?? [];

                return (
                  <div key={cat.id} className="mb-0.5">

                    {/* Accordion trigger */}
                    <button
                      onClick={() => toggleCat(cat.id)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-all duration-150 hover:bg-gray-100"
                      style={{
                        background: isActive && !isExpanded ? cat.color + '15' : undefined,
                        color:      isActive ? cat.color : '#374151',
                        fontWeight: 600,
                        borderLeft: isActive ? `3px solid ${cat.color}` : '3px solid transparent',
                      }}
                    >
                      <span className="text-base leading-none shrink-0">{cat.icon}</span>
                      <span className="flex-1 truncate text-sm">{cat.label}</span>
                      <span
                        className="shrink-0 ml-1"
                        style={{
                          display: 'inline-flex',
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s ease',
                          color: '#9ca3af',
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    </button>

                    {/* Tool sub-items */}
                    <div
                      style={{
                        maxHeight: isExpanded ? `${tools.length * 36}px` : '0px',
                        overflow: 'hidden',
                        transition: 'max-height 0.25s ease',
                      }}
                    >
                      <div
                        className="ml-5 mt-0.5 mb-1.5"
                        style={{ borderLeft: `2px solid ${cat.color}30` }}
                      >
                        {tools.map((tool) => (
                          <Link
                            key={tool.slug}
                            href={`/tool/${tool.slug}`}
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-r-lg text-xs text-gray-500 hover:text-gray-900 hover:bg-white transition-all duration-100 group"
                          >
                            <span className="text-sm leading-none shrink-0">{tool.icon}</span>
                            <span className="truncate group-hover:font-medium">{tool.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
