import Link from 'next/link';
import Image from 'next/image';
import { TOOLS, CATEGORIES } from './lib/tools';
import { SidebarNav } from './components/SidebarNav';
import { Navbar } from './components/Navbar';
import { ToolIcon, CategoryIcon } from './components/ToolIcon';

const pdfCategories   = CATEGORIES.filter((c) => !c.id.startsWith('img-'));
const imageCategories = CATEGORIES.filter((c) =>  c.id.startsWith('img-'));

export default function Home() {
  const totalTools = TOOLS.length;

  return (
    <div className="min-h-screen" style={{ background: '#f4f6f8' }}>

      {/* ══════════════════════════════════════════════════
          HEADER
      ══════════════════════════════════════════════════ */}
      <Navbar totalTools={totalTools} />

      {/* ══════════════════════════════════════════════════
          HERO  (compact)
      ══════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 40%, #2596be 100%)',
          paddingTop: '2rem',
          paddingBottom: '2rem',
        }}
      >
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #2596be, transparent)', transform: 'translate(30%,-30%)' }}
        />
        <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center gap-8">
          {/* Left: text */}
          <div className="flex-1 text-center sm:text-left">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4"
              style={{ background: 'rgba(37,150,190,0.18)', color: '#7dd3fc', border: '1px solid rgba(37,150,190,0.3)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
              Free · No Sign-up · Instant Download
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-3 leading-tight">
              Every PDF &amp; Image Tool<br />
              <span style={{ color: '#7dd3fc' }}>You&apos;ll Ever Need</span>
            </h1>
            <p className="text-base mb-0 max-w-xl" style={{ color: '#94a3b8' }}>
              Convert, compress, resize, watermark, OCR, remove backgrounds, merge, split, protect and more.
              100% free — no account required.
            </p>
          </div>

          {/* Right: stats */}
          <div className="flex sm:flex-col gap-6 sm:gap-4 shrink-0">
            {[
              { value: `${totalTools}+`, label: 'Free Tools'     },
              { value: '13',             label: 'Categories'      },
              { value: '100%',           label: 'Free Forever'    },
            ].map((s) => (
              <div key={s.label} className="text-center sm:text-right">
                <div className="text-2xl font-black text-white">{s.value}</div>
                <div className="text-xs font-medium" style={{ color: '#bfdbfe' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          TWO-COLUMN LAYOUT: SIDEBAR + CONTENT
      ══════════════════════════════════════════════════ */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 flex gap-6 items-start">

        {/* ── LEFT SIDEBAR ─────────────────────────────── */}
        <SidebarNav />

        {/* ── MAIN CONTENT ─────────────────────────────── */}
        <main className="flex-1 min-w-0">

          {/* PDF section banner */}
          <div
            id="pdf-section"
            className="flex items-center gap-3 rounded-xl px-4 py-3 mb-4"
            style={{ background: 'linear-gradient(90deg,#1d4ed8,#2596be)', color: '#fff' }}
          >
            <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center text-xl shrink-0">📄</div>
            <div>
              <h2 className="text-base font-black leading-tight">PDF Document Tools</h2>
              <p className="text-xs text-blue-100">
                {TOOLS.filter((t) => !t.category.startsWith('img-')).length} tools · convert, edit &amp; manage PDFs
              </p>
            </div>
          </div>

          {pdfCategories.map((category) => {
            const tools = TOOLS.filter((t) => t.category === category.id);
            if (!tools.length) return null;
            return <CategorySection key={category.id} category={category} tools={tools} />;
          })}

          {/* Image section banner */}
          <div
            id="img-section"
            className="flex items-center gap-3 rounded-xl px-4 py-3 mb-4 mt-6"
            style={{ background: 'linear-gradient(90deg,#7c3aed,#ec4899)', color: '#fff' }}
          >
            <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center text-xl shrink-0">🖼️</div>
            <div>
              <h2 className="text-base font-black leading-tight">Digital Image Hub</h2>
              <p className="text-xs text-purple-100">
                {TOOLS.filter((t) => t.category.startsWith('img-')).length} tools · transform, enhance &amp; edit images
              </p>
            </div>
          </div>

          {imageCategories.map((category) => {
            const tools = TOOLS.filter((t) => t.category === category.id);
            if (!tools.length) return null;
            return <CategorySection key={category.id} category={category} tools={tools} />;
          })}
        </main>
      </div>

      {/* ══════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════ */}
      <footer style={{ background: '#0f172a', borderTop: '1px solid #1e293b' }} className="mt-8">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Image
              src="/Website Logo.png"
              alt="Digital Hub"
              width={140}
              height={42}
              className="h-10 w-auto object-contain brightness-0 invert"
            />
            <div className="flex flex-wrap justify-center gap-3">
              {CATEGORIES.map((cat) => (
                <a
                  key={cat.id}
                  href={`#${cat.id}`}
                  className="flex items-center gap-1.5 text-xs font-medium transition-colors hover:text-white"
                  style={{ color: '#64748b' }}
                >
                  <CategoryIcon catId={cat.id} size={20} />
                  {cat.label}
                </a>
              ))}
            </div>
          </div>
          <div
            className="mt-6 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3"
            style={{ borderTop: '1px solid #1e293b' }}
          >
            <p className="text-xs" style={{ color: '#94a3b8' }}>
              {totalTools} free PDF &amp; Image tools · No sign-up required
            </p>
            <p className="text-xs" style={{ color: '#94a3b8' }}>
              Powered by {' '}
              <a href="https://aurexone.com" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white" style={{ color: '#2596be' }}>aurexone.com</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─── CategorySection ──────────────────────────────────────────────────────── */

function CategorySection({
  category,
  tools,
}: {
  category: (typeof CATEGORIES)[number];
  tools: ReturnType<typeof TOOLS.filter>;
}) {
  return (
    <section id={category.id} className="mb-5 scroll-mt-20">
      {/* Compact header */}
      <div className="flex items-center gap-2 mb-2">
        <CategoryIcon catId={category.id} size={24} />
        <h3 className="text-sm font-bold text-gray-800">{category.label}</h3>
        <span className="text-xs text-gray-400">({tools.length})</span>
        <div className="flex-1 h-px ml-1" style={{ background: 'linear-gradient(90deg,#e5e7eb,transparent)' }} />
      </div>

      {/* Dense horizontal cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-1.5">
        {tools.map((tool) => (
          <Link
            key={tool.slug}
            href={`/tool/${tool.slug}`}
            className="tool-card group flex items-center gap-2 bg-white rounded-xl px-2.5 py-2 hover:shadow-md transition-all duration-150"
            style={{ border: `1.5px solid ${tool.borderColor}` }}
          >
            <div className="shrink-0 transition-transform duration-150 group-hover:scale-110">
              <ToolIcon slug={tool.slug} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-900 leading-tight truncate">{tool.name}</p>
              <p className="text-[10px] text-gray-400 leading-tight truncate">{tool.description}</p>
            </div>
            <span
              className="text-xs opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-150 shrink-0"
              style={{ color: tool.color }}
            >→</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
