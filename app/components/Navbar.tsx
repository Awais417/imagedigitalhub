'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef } from 'react';
import { CATEGORIES } from '../lib/tools';

const pdfCats = CATEGORIES.filter((c) => !c.id.startsWith('img-'));
const imgCats = CATEGORIES.filter((c) =>  c.id.startsWith('img-'));

const groups = [
  { label: 'PDF TOOLS',   cats: pdfCats, accent: '#2596be', lightBg: '#eff6ff' },
  { label: 'IMAGE TOOLS', cats: imgCats, accent: '#8b5cf6', lightBg: '#f5f3ff' },
];

export function Navbar({ totalTools }: { totalTools: number }) {
  const [openDropdown, setOpenDropdown]   = useState<string | null>(null);
  const [mobileOpen, setMobileOpen]       = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const enter = (label: string) => {
    if (timer.current) clearTimeout(timer.current);
    setOpenDropdown(label);
  };

  const leave = () => {
    timer.current = setTimeout(() => setOpenDropdown(null), 120);
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

  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{ background: '#fff', borderColor: '#e5e7eb', boxShadow: '0 1px 12px rgba(37,150,190,0.08)' }}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">

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
                  color:      openDropdown === g.label ? g.accent   : '#374151',
                  background: openDropdown === g.label ? g.lightBg  : 'transparent',
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
                  style={{
                    minWidth: 320,
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 16px 48px rgba(0,0,0,0.14)',
                  }}
                  onMouseEnter={() => enter(g.label)}
                  onMouseLeave={leave}
                >
                  <p
                    className="text-[10px] font-black uppercase tracking-widest px-2 mb-2"
                    style={{ color: g.accent }}
                  >
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

        {/* Right: count + hamburger */}
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden sm:block text-sm font-bold" style={{ color: '#2596be' }}>
            {totalTools}+ Free Tools
          </span>

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
        <div
          className="lg:hidden border-t"
          style={{ borderColor: '#e5e7eb', background: '#fff' }}
        >
          {groups.map((g) => (
            <div key={g.label} className="border-b last:border-0" style={{ borderColor: '#f1f5f9' }}>
              <button
                className="w-full flex items-center justify-between px-4 py-3 text-[13px] font-extrabold uppercase tracking-widest transition-colors"
                style={{ color: mobileExpanded === g.label ? g.accent : '#374151' }}
                onClick={() =>
                  setMobileExpanded(mobileExpanded === g.label ? null : g.label)
                }
              >
                <span className="flex items-center gap-2">
                  <span>{mobileExpanded === g.label ? '▾' : '▸'}</span>
                  {g.label}
                </span>
                <span className="text-xs font-medium text-gray-400">
                  {g.cats.length} categories
                </span>
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
