import Link from 'next/link';
import { TOOLS, CATEGORIES } from './lib/tools';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ── */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white text-lg font-bold">P</span>
            </div>
            <div>
              <span className="text-2xl font-extrabold text-gray-900 tracking-tight">PDF</span>
              <span className="text-2xl font-extrabold text-red-600 tracking-tight"> HUB</span>
            </div>
          </div>
          <p className="hidden sm:block text-sm text-gray-500">
            Powered by iLovePDF API — All tools in one place
          </p>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-red-600 via-red-700 to-red-800 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-white/30 shadow-2xl">
            <span className="text-4xl">📄</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 tracking-tight">
            Every PDF Tool You Need
          </h1>
          <p className="text-xl text-red-100 max-w-2xl mx-auto">
            Merge, split, compress, convert, rotate, watermark, protect and more.
            All tools are free and easy to use.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {CATEGORIES.map((cat) => (
              <a
                key={cat.id}
                href={`#${cat.id}`}
                className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-sm font-medium transition-all"
              >
                {cat.icon} {cat.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tool Grid ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {CATEGORIES.map((category) => {
          const categoryTools = TOOLS.filter((t) => t.category === category.id);
          if (categoryTools.length === 0) return null;
          return (
            <section key={category.id} id={category.id} className="mb-14">
              {/* Category Header */}
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg shadow-md"
                  style={{ backgroundColor: category.color }}
                >
                  {category.icon}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{category.label}</h2>
                  <p className="text-sm text-gray-500">{categoryTools.length} tools available</p>
                </div>
                <div className="flex-1 h-px ml-4 bg-gray-200" />
              </div>

              {/* Tools Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {categoryTools.map((tool) => (
                  <Link
                    key={tool.slug}
                    href={`/tool/${tool.slug}`}
                    className="group block bg-white rounded-2xl border-2 p-5 hover:shadow-lg transition-all duration-200 cursor-pointer hover:-translate-y-0.5"
                    style={{ borderColor: tool.borderColor }}
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform"
                      style={{ backgroundColor: tool.bgColor }}
                    >
                      {tool.icon}
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mb-1">{tool.name}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
                      {tool.description}
                    </p>
                    <div
                      className="mt-3 text-xs font-semibold flex items-center gap-1"
                      style={{ color: tool.color }}
                    >
                      Use Tool
                      <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </main>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-6 h-6 bg-red-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">P</span>
            </div>
            <span className="font-bold text-gray-800">PDF HUB</span>
          </div>
          <p className="text-sm text-gray-400">Powered by iLovePDF API · {TOOLS.length} PDF tools</p>
        </div>
      </footer>
    </div>
  );
}
