import Link from 'next/link';
import Image from 'next/image';
import { TOOLS, CATEGORIES } from './lib/tools';

const pdfCategories   = CATEGORIES.filter((c) => !c.id.startsWith('img-'));
const imageCategories = CATEGORIES.filter((c) =>  c.id.startsWith('img-'));

export default function Home() {
  const totalTools = TOOLS.length;

  return (
    <div className="min-h-screen" style={{ background: '#f4f6f8' }}>

      {/* ══════════════════════════════════════════════════
          HEADER
      ══════════════════════════════════════════════════ */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{ background: '#ffffff', borderColor: '#e5e7eb', boxShadow: '0 1px 12px 0 rgba(37,150,190,0.08)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <Image
              src="/Website Logo.png"
              alt="Digital Hub"
              width={160}
              height={48}
              className="h-11 w-auto object-contain"
              priority
            />
          </Link>

          {/* Nav pills */}
          <nav className="hidden md:flex items-center gap-1">
            {[
              { label: 'PDF Tools',   href: '#organize',   color: '#3b82f6' },
              { label: 'Image Tools', href: '#img-convert', color: '#8b5cf6' },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="px-4 py-2 rounded-full text-sm font-semibold transition-all hover:opacity-80"
                style={{ color: item.color, background: item.color + '14' }}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <p className="hidden sm:block text-sm font-medium" style={{ color: '#2596be' }}>
            {totalTools} Free Tools
          </p>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 40%, #2596be 100%)',
          paddingTop: '5rem',
          paddingBottom: '5rem',
        }}
      >
        {/* Decorative blobs */}
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #2596be, transparent)', transform: 'translate(30%, -30%)' }}
        />
        <div
          className="absolute bottom-0 left-0 w-72 h-72 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)', transform: 'translate(-30%, 30%)' }}
        />

        <div className="relative max-w-5xl mx-auto px-4 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6"
            style={{ background: 'rgba(37,150,190,0.18)', color: '#7dd3fc', border: '1px solid rgba(37,150,190,0.3)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
            Free · No Sign-up · Instant Download
          </div>

          {/* Icon pair */}
          <div className="flex items-center justify-center gap-5 mb-7">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-2xl"
              style={{ background: 'linear-gradient(135deg, #1d4ed8, #2596be)', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              📄
            </div>
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center font-black text-white text-sm"
              style={{ background: 'rgba(255,255,255,0.12)' }}
            >
              +
            </div>
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-2xl"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              🖼️
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-5 leading-tight">
            Every PDF &amp; Image Tool<br />
            <span style={{ color: '#7dd3fc' }}>You&apos;ll Ever Need</span>
          </h1>
          <p className="text-lg sm:text-xl mb-10 max-w-2xl mx-auto" style={{ color: '#94a3b8' }}>
            Convert, compress, resize, watermark, remove backgrounds, merge, split, protect and more.
            100% free — no account required.
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap justify-center gap-8 mb-10">
            {[
              { value: `${totalTools}+`, label: 'Free Tools'   },
              { value: '12',            label: 'Categories'    },
              { value: '100%',          label: 'Free Forever'  },
              { value: '0',             label: 'Sign-ups Needed' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-black" style={{ color: '#38bdf8' }}>{s.value}</div>
                <div className="text-xs font-medium mt-0.5" style={{ color: '#64748b' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Category quick-nav */}
          <div className="flex flex-wrap justify-center gap-2">
            {CATEGORIES.map((cat) => (
              <a
                key={cat.id}
                href={`#${cat.id}`}
                className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:scale-105"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  color: '#cbd5e1',
                  border: `1px solid rgba(255,255,255,0.12)`,
                }}
              >
                {cat.icon} {cat.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SECTION DIVIDER — PDF
      ══════════════════════════════════════════════════ */}
      <SectionDivider
        icon="📄"
        title="PDF Document Tools"
        subtitle={`${TOOLS.filter((t) => !t.category.startsWith('img-')).length} tools to manage, convert and edit your PDF documents`}
        gradient="linear-gradient(90deg, #1d4ed8, #2596be)"
        light="#eff6ff"
        anchor="pdf-section"
      />

      {/* PDF Tool Sections */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {pdfCategories.map((category) => {
          const tools = TOOLS.filter((t) => t.category === category.id);
          if (tools.length === 0) return null;
          return (
            <CategorySection key={category.id} category={category} tools={tools} />
          );
        })}
      </main>

      {/* ══════════════════════════════════════════════════
          SECTION DIVIDER — IMAGE
      ══════════════════════════════════════════════════ */}
      <SectionDivider
        icon="🖼️"
        title="Digital Image Hub"
        subtitle={`${TOOLS.filter((t) => t.category.startsWith('img-')).length} tools to transform, enhance and edit your images`}
        gradient="linear-gradient(90deg, #7c3aed, #ec4899)"
        light="#faf5ff"
        anchor="img-section"
      />

      {/* Image Tool Sections */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {imageCategories.map((category) => {
          const tools = TOOLS.filter((t) => t.category === category.id);
          if (tools.length === 0) return null;
          return (
            <CategorySection key={category.id} category={category} tools={tools} />
          );
        })}
      </main>

      {/* ══════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════ */}
      <footer style={{ background: '#0f172a', borderTop: '1px solid #1e293b' }} className="mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Image
                src="/Website Logo.png"
                alt="Digital Hub"
                width={140}
                height={42}
                className="h-10 w-auto object-contain brightness-0 invert"
              />
            </div>
            <div className="flex flex-wrap justify-center gap-6">
              {CATEGORIES.map((cat) => (
                <a
                  key={cat.id}
                  href={`#${cat.id}`}
                  className="text-xs font-medium transition-colors hover:text-white"
                  style={{ color: '#64748b' }}
                >
                  {cat.icon} {cat.label}
                </a>
              ))}
            </div>
          </div>
          <div className="mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3"
            style={{ borderTop: '1px solid #1e293b' }}>
            <p className="text-xs" style={{ color: '#475569' }}>
              {totalTools} free PDF &amp; Image tools · No sign-up required
            </p>
            <p className="text-xs" style={{ color: '#334155' }}>
              Powered by Digital Image Hub
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─── Sub-components ──────────────────────────────────────────────────────── */

function SectionDivider({
  icon, title, subtitle, gradient, light, anchor,
}: {
  icon: string; title: string; subtitle: string;
  gradient: string; light: string; anchor: string;
}) {
  return (
    <div id={anchor} className="mt-8" style={{ background: light, borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center gap-5">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-md"
          style={{ background: gradient }}
        >
          {icon}
        </div>
        <div>
          <h2 className="text-xl font-black text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function CategorySection({
  category,
  tools,
}: {
  category: (typeof CATEGORIES)[number];
  tools: ReturnType<typeof TOOLS.filter>;
}) {
  return (
    <section key={category.id} id={category.id} className="mb-12 scroll-mt-20">
      {/* Category Header */}
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-base shadow"
          style={{ background: category.color }}
        >
          {category.icon}
        </div>
        <div className="flex-1">
          <h3 className="text-base font-bold text-gray-900">{category.label}</h3>
          <p className="text-xs text-gray-400">{tools.length} tool{tools.length > 1 ? 's' : ''} available</p>
        </div>
        <div className="hidden sm:block flex-1 h-px" style={{ background: 'linear-gradient(90deg, #e5e7eb, transparent)' }} />
      </div>

      {/* Tool Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {tools.map((tool) => (
          <Link
            key={tool.slug}
            href={`/tool/${tool.slug}`}
            className="tool-card group flex flex-col bg-white rounded-2xl p-5 transition-all duration-200 cursor-pointer"
            style={{
              border: `1.5px solid ${tool.borderColor}`,
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}
          >
            {/* Icon */}
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-3 transition-transform duration-200 group-hover:scale-110"
              style={{ background: tool.bgColor }}
            >
              {tool.icon}
            </div>

            {/* Text */}
            <h4 className="text-sm font-bold text-gray-900 mb-1 leading-snug">{tool.name}</h4>
            <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 flex-1">{tool.description}</p>

            {/* CTA */}
            <div
              className="mt-3 flex items-center gap-1 text-xs font-bold"
              style={{ color: tool.color }}
            >
              Use Tool
              <span className="transition-transform duration-200 group-hover:translate-x-1 inline-block">→</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
