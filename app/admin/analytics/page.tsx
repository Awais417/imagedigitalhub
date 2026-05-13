'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.godoclab.com/api';

interface Analytics {
  topTools: { tool: string; count: number }[];
  dailyConversions: { day: string; count: number }[];
  recentUsers: { id: number; email: string; username: string; role: string; createdAt: string }[];
}

export default function AnalyticsPage() {
  const { token } = useAuth();
  const [data, setData]       = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/admin/analytics`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { setData(d as Analytics); setLoading(false); })
      .catch(() => { setError('Failed to load analytics'); setLoading(false); });
  }, [token]);

  if (loading) return <Spinner />;
  if (error)   return <ErrMsg msg={error} />;
  if (!data)   return null;

  const maxCount    = data.topTools[0]?.count ?? 1;
  const maxDaily    = Math.max(...data.dailyConversions.map((d) => d.count), 1);

  return (
    <div>
      <h1 className="text-xl font-black text-white mb-1">Analytics & Performance</h1>
      <p className="text-sm mb-6" style={{ color: '#64748b' }}>Conversion data and user trends</p>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">

        {/* Top tools */}
        <div className="rounded-2xl p-5" style={{ background: '#1e293b', border: '1px solid #334155' }}>
          <h2 className="text-sm font-black text-white mb-4 uppercase tracking-widest">Top Tools</h2>
          <div className="flex flex-col gap-3">
            {data.topTools.map((t, i) => (
              <div key={t.tool}>
                <div className="flex items-center justify-between mb-1">
                  <span className="flex items-center gap-2">
                    <span className="text-[10px] font-black w-5 text-right" style={{ color: '#64748b' }}>#{i + 1}</span>
                    <span className="text-xs font-semibold text-gray-300">{t.tool}</span>
                  </span>
                  <span className="text-xs font-bold text-white">{t.count.toLocaleString()}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: '#334155' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(2, (t.count / maxCount) * 100)}%`,
                      background: `hsl(${200 + i * 15},70%,50%)`,
                    }}
                  />
                </div>
              </div>
            ))}
            {data.topTools.length === 0 && (
              <p className="text-xs text-gray-500 text-center py-4">No conversion data yet</p>
            )}
          </div>
        </div>

        {/* Daily conversions — last 30 days */}
        <div className="rounded-2xl p-5" style={{ background: '#1e293b', border: '1px solid #334155' }}>
          <h2 className="text-sm font-black text-white mb-4 uppercase tracking-widest">Daily Conversions (30 days)</h2>
          {data.dailyConversions.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-10">No data in last 30 days</p>
          ) : (
            <div className="flex items-end gap-0.5 h-36">
              {data.dailyConversions.map((d) => (
                <div
                  key={d.day}
                  className="flex-1 rounded-t group relative"
                  style={{
                    height: `${Math.max(4, (d.count / maxDaily) * 100)}%`,
                    background: 'linear-gradient(180deg,#2596be,#1d4ed8)',
                    minWidth: 4,
                  }}
                  title={`${new Date(d.day).toLocaleDateString()} — ${d.count} conversions`}
                >
                  {/* Tooltip on hover */}
                  <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-gray-900 text-white text-[10px] rounded px-1.5 py-0.5 whitespace-nowrap z-10">
                    {d.count}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-between mt-2 text-[10px]" style={{ color: '#64748b' }}>
            <span>{data.dailyConversions[0] ? new Date(data.dailyConversions[0].day).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : ''}</span>
            <span>{data.dailyConversions.at(-1) ? new Date(data.dailyConversions.at(-1)!.day).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : ''}</span>
          </div>
        </div>
      </div>

      {/* Recent signups */}
      <div className="rounded-2xl" style={{ background: '#1e293b', border: '1px solid #334155' }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: '#334155' }}>
          <h2 className="text-sm font-black text-white uppercase tracking-widest">Recent Signups</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #334155' }}>
                {['User', 'Email', 'Role', 'Joined'].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-bold uppercase tracking-widest" style={{ color: '#64748b' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.recentUsers.map((u) => (
                <tr key={u.id} className="hover:bg-white/5 transition-colors" style={{ borderBottom: '1px solid #1e293b' }}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0"
                        style={{ background: 'linear-gradient(135deg,#2596be,#7c3aed)' }}
                      >
                        {u.username[0].toUpperCase()}
                      </div>
                      <span className="text-xs font-semibold text-white">{u.username}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-400">{u.email}</td>
                  <td className="px-5 py-3">
                    <span
                      className="text-[10px] font-black px-2 py-0.5 rounded-full"
                      style={{
                        background: u.role === 'admin' ? 'rgba(37,150,190,0.2)' : 'rgba(100,116,139,0.2)',
                        color:      u.role === 'admin' ? '#38bdf8'              : '#94a3b8',
                      }}
                    >
                      {u.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs" style={{ color: '#64748b' }}>
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
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
