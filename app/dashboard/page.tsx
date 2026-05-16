'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { apiGet, apiDelete } from '../lib/api';

interface ConversionRecord {
  id: number;
  toolSlug: string;
  originalFileName: string;
  outputFileName: string;
  fileSize: number;
  createdAt: string;
  downloadUrl: string | null;
}

function formatBytes(bytes: number) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function toolColor(slug: string): string {
  if (slug.includes('pdf-to') || slug.includes('from-pdf')) return '#8b5cf6';
  if (slug.includes('to-pdf'))  return '#2596be';
  if (slug.includes('compress') || slug.includes('optimize')) return '#f59e0b';
  if (slug.includes('merge') || slug.includes('split'))  return '#3b82f6';
  if (slug.includes('image') || slug.includes('img') || slug.includes('jpg') || slug.includes('png')) return '#ec4899';
  if (slug.includes('protect') || slug.includes('unlock') || slug.includes('security')) return '#10b981';
  return '#2596be';
}

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [records, setRecords]     = useState<ConversionRecord[]>([]);
  const [fetching, setFetching]   = useState(true);
  const [deleting, setDeleting]   = useState<number | null>(null);
  const [fetchError, setFetchError] = useState('');

  /* Redirect to login if not authenticated */
  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  /* Fetch conversion history */
  useEffect(() => {
    if (!user) return;
    setFetching(true);
    apiGet<ConversionRecord[]>('/conversions')
      .then(setRecords)
      .catch((e) => setFetchError((e as Error).message))
      .finally(() => setFetching(false));
  }, [user]);

  const handleDelete = async (id: number) => {
    setDeleting(id);
    try {
      await apiDelete(`/conversions/${id}`);
      setRecords((prev) => prev.filter((r) => r.id !== id));
    } catch { /* ignore */ }
    setDeleting(null);
  };

  /* Loading skeleton while auth resolves */
  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f4f6f8' }}>
        <svg className="animate-spin h-8 w-8" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#2596be" strokeWidth="4"/>
          <path className="opacity-75" fill="#2596be" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
      </div>
    );
  }

  const totalSize = records.reduce((s, r) => s + Number(r.fileSize), 0);

  return (
    <div className="min-h-screen" style={{ background: '#f4f6f8' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{ background: '#fff', borderColor: '#e5e7eb', boxShadow: '0 1px 12px rgba(37,150,190,0.08)' }}
      >
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link href="/">
            <Image src="/logo.webp" alt="Digital Hub" width={130} height={40}
              className="h-9 w-auto object-contain" priority />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden sm:flex items-center gap-1.5 text-sm font-semibold transition-all hover:opacity-70"
              style={{ color: '#2596be' }}
            >
              ← All Tools
            </Link>
            <button
              onClick={() => { logout(); router.push('/'); }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
              style={{ background: '#f1f5f9', color: '#64748b' }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 40%, #2596be 100%)', padding: '2rem 1rem' }}
      >
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center gap-6">
          {/* Avatar + greeting */}
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black text-white shrink-0 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #2596be, #7c3aed)' }}
            >
              {user.username[0].toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#7dd3fc' }}>Your Account</p>
              <h1 className="text-2xl font-black text-white leading-tight">
                {user.username}
              </h1>
              <p className="text-xs" style={{ color: '#94a3b8' }}>{user.email}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="sm:ml-auto flex gap-8">
            {[
              { value: records.length, label: 'Conversions' },
              { value: formatBytes(totalSize), label: 'Total Processed' },
            ].map((s) => (
              <div key={s.label} className="text-center sm:text-right">
                <div className="text-2xl font-black text-white">{s.value}</div>
                <div className="text-xs" style={{ color: '#bfdbfe' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">

        {/* Section title */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-black text-gray-900">Conversion History</h2>
            <p className="text-xs text-gray-400 mt-0.5">Files are stored securely and links expire after 1 hour</p>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 shadow-sm"
            style={{ background: 'linear-gradient(135deg, #2596be, #1e7ea1)' }}
          >
            + New Conversion
          </Link>
        </div>

        {/* Error */}
        {fetchError && (
          <div className="p-4 rounded-xl mb-5" style={{ background: '#fef2f2', border: '1.5px solid #fecaca', color: '#b91c1c' }}>
            ⚠ {fetchError}
          </div>
        )}

        {/* Loading */}
        {fetching ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse" style={{ border: '1.5px solid #e5e7eb' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-200 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-1/3" />
                    <div className="h-2.5 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : records.length === 0 ? (
          /* Empty state */
          <div
            className="text-center py-20 rounded-2xl"
            style={{ background: '#fff', border: '1.5px dashed #e5e7eb' }}
          >
            <div className="text-6xl mb-4">📂</div>
            <h3 className="text-lg font-bold text-gray-700 mb-2">No conversions yet</h3>
            <p className="text-sm text-gray-400 mb-6 max-w-xs mx-auto">
              Use any tool while logged in and your files will automatically be saved here.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90 shadow-md"
              style={{ background: 'linear-gradient(135deg, #2596be, #1e7ea1)' }}
            >
              Browse All Tools
            </Link>
          </div>
        ) : (
          /* Records list */
          <div className="space-y-2">
            {records.map((r) => {
              const color = toolColor(r.toolSlug);
              const initials = r.toolSlug.split('-').slice(0, 2).map((w) => w[0].toUpperCase()).join('');
              return (
                <div
                  key={r.id}
                  className="bg-white rounded-2xl flex items-center gap-3 px-4 py-3 transition-all hover:shadow-md group"
                  style={{ border: '1.5px solid #e5e7eb' }}
                >
                  {/* Tool badge */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0"
                    style={{ background: color }}
                  >
                    {initials}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 leading-tight truncate">
                      {r.outputFileName || r.toolSlug}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: color + '18', color }}
                      >
                        {r.toolSlug}
                      </span>
                      <span className="text-[11px] text-gray-400">{formatBytes(r.fileSize)}</span>
                      <span className="text-[11px] text-gray-400">{formatDate(r.createdAt)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {r.downloadUrl ? (
                      <a
                        href={r.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all hover:opacity-90 shadow-sm"
                        style={{ background: color }}
                      >
                        ⬇ Download
                      </a>
                    ) : (
                      <span className="text-xs text-gray-300 px-3 py-1.5">Link expired</span>
                    )}
                    <button
                      onClick={() => handleDelete(r.id)}
                      disabled={deleting === r.id}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                      title="Delete record"
                    >
                      {deleting === r.id ? (
                        <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                        </svg>
                      ) : '✕'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
