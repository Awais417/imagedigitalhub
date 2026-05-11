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

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>('section[id]'));
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the topmost visible section
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

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top: y, behavior: 'smooth' });
  };

  return (
    <aside
      className="sticky top-20 hidden lg:flex flex-col gap-1 overflow-y-auto"
      style={{ width: 220, maxHeight: 'calc(100vh - 6rem)' }}
    >
      {groups.map((group) => (
        <div key={group.label} className="mb-3">
          {/* Group header */}
          <div
            className="flex items-center gap-2 px-3 py-2 mb-1 rounded-lg text-xs font-black uppercase tracking-widest"
            style={{ color: group.accent, background: group.accent + '12' }}
          >
            <span>{group.icon}</span>
            <span>{group.label}</span>
          </div>

          {/* Category links */}
          {group.cats.map((cat) => {
            const isActive = active === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => scrollTo(cat.id)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-all duration-150 cursor-pointer"
                style={{
                  background:   isActive ? cat.color + '18' : 'transparent',
                  color:        isActive ? cat.color       : '#374151',
                  fontWeight:   isActive ? 700              : 500,
                  borderLeft:   isActive ? `3px solid ${cat.color}` : '3px solid transparent',
                }}
              >
                <span className="text-base leading-none">{cat.icon}</span>
                <span className="truncate">{cat.label}</span>
              </button>
            );
          })}
        </div>
      ))}
    </aside>
  );
}
