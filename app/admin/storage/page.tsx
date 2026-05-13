'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.godoclab.com/api';

function fmt(bytes: number) {
  if (bytes < 1024)         return `${bytes} B`;
  if (bytes < 1024 ** 2)    return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3)    return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

interface StorageData {
  s3: { bucket: string; region: string; objectCount: number; totalBytes: number };
  byTool: { tool: string; count: number; bytes: number }[];
  recentFiles: { id: number; toolSlug: string; outputFileName: string; fileSize: number; createdAt: string }[];
}

export default function StoragePage() {
  const { token } = useAuth();
  const [data, setData]       = useState<StorageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/admin/storage`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { setData(d as StorageData); setLoading(false); })
      .catch(() => { setError('Failed to load storage data'); setLoading(false); });
  }, [token]);

  if (loading) return <Spinner />;
  if (error)   return <ErrMsg msg={error} />;
  if (!data)   return null;

  const maxBytes = data.byTool[0]?.bytes ?? 1;

  return (
    <div>
      <h1 className="text-xl font-black text-white mb-1">Storage Monitoring</h1>
      <p className="text-sm mb-6" style={{ color: '#64748b' }}>AWS S3 bucket — {data.s3.bucket} ({data.s3.region})</p>

      {/* S3 summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Objects',  value: data.s3.objectCount.toLocaleString(), icon: '📦', color: '#2596be' },
          { label: 'Total Size',     value: fmt(data.s3.totalBytes),              icon: '💾', color: '#8b5cf6' },
          { label: 'Avg Object Size', value: data.s3.objectCount > 0 ? fmt(Math.round(data.s3.totalBytes / data.s3.objectCount)) : '—', icon: '📐', color: '#10b981' },
        ].map((c) => (
          <div key={c.label} className="rounded-2xl p-5" style={{ background: '#1e293b', border: '1px solid #334155' }}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{c.icon}</span>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: c.color }}>{c.label}</span>
            </div>
            <p className="text-2xl font-black text-white">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Storage by tool */}
      <div className="rounded-2xl p-5 mb-6" style={{ background: '#1e293b', border: '1px solid #334155' }}>
        <h2 className="text-sm font-black text-white mb-4 uppercase tracking-widest">Storage by Tool</h2>
        <div className="flex flex-col gap-3">
          {data.byTool.map((t) => (
            <div key={t.tool}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-gray-300 truncate max-w-[60%]">{t.tool}</span>
                <span className="text-xs font-bold text-gray-400">{fmt(t.bytes)} · {t.count} files</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: '#334155' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max(2, (t.bytes / maxBytes) * 100)}%`,
                    background: 'linear-gradient(90deg,#1d4ed8,#2596be)',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent large files */}
      <div className="rounded-2xl" style={{ background: '#1e293b', border: '1px solid #334155' }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: '#334155' }}>
          <h2 className="text-sm font-black text-white uppercase tracking-widest">Largest Files</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #334155' }}>
                {['Tool', 'File', 'Size', 'Date'].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-bold uppercase tracking-widest" style={{ color: '#64748b' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.recentFiles.map((f) => (
                <tr key={f.id} className="hover:bg-white/5 transition-colors" style={{ borderBottom: '1px solid #1e293b' }}>
                  <td className="px-5 py-3 text-xs font-semibold" style={{ color: '#2596be' }}>{f.toolSlug}</td>
                  <td className="px-5 py-3 text-xs text-gray-300 max-w-[180px] truncate">{f.outputFileName || '—'}</td>
                  <td className="px-5 py-3 text-xs font-semibold text-white">{fmt(f.fileSize)}</td>
                  <td className="px-5 py-3 text-xs" style={{ color: '#64748b' }}>{new Date(f.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#2596be', borderTopColor: 'transparent' }} />
    </div>
  );
}
function ErrMsg({ msg }: { msg: string }) {
  return <p className="text-red-400 text-sm py-10 text-center">{msg}</p>;
}
