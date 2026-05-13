'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.godoclab.com/api';

interface UserRow { id: number; email: string; username: string; role: string; createdAt: string }
interface UsersData { users: UserRow[]; total: number; page: number; limit: number }

export default function UsersPage() {
  const { token } = useAuth();
  const [data, setData]       = useState<UsersData | null>(null);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [search,  setSearch]  = useState('');

  const load = (p: number) => {
    if (!token) return;
    setLoading(true);
    fetch(`${API}/admin/users?page=${p}&limit=20`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { setData(d as UsersData); setLoading(false); })
      .catch(() => { setError('Failed to load users'); setLoading(false); });
  };

  useEffect(() => { load(page); }, [token, page]); // eslint-disable-line

  const rows = data?.users.filter(
    (u) => !search || u.username.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()),
  ) ?? [];

  const totalPages = data ? Math.ceil(data.total / data.limit) : 1;

  return (
    <div>
      <h1 className="text-xl font-black text-white mb-1">Users</h1>
      <p className="text-sm mb-6" style={{ color: '#64748b' }}>
        {data?.total.toLocaleString()} total registered users
      </p>

      {/* Search */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by username or email…"
        className="w-full sm:w-72 mb-5 px-4 py-2 rounded-xl text-sm outline-none"
        style={{ background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0' }}
      />

      {error   && <p className="text-red-400 text-sm mb-4">{error}</p>}
      {loading && <Spinner />}

      {!loading && (
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #334155' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ background: '#1e293b' }}>
                <tr style={{ borderBottom: '1px solid #334155' }}>
                  {['#', 'Username', 'Email', 'Role', 'Joined'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-bold uppercase tracking-widest" style={{ color: '#64748b' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody style={{ background: '#0f1f33' }}>
                {rows.map((u) => (
                  <tr key={u.id} className="hover:bg-white/5 transition-colors" style={{ borderBottom: '1px solid #1e293b' }}>
                    <td className="px-5 py-3 text-xs" style={{ color: '#64748b' }}>{u.id}</td>
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
                {rows.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-xs text-gray-500">No users found</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t" style={{ borderColor: '#334155', background: '#1e293b' }}>
              <span className="text-xs" style={{ color: '#64748b' }}>
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-30"
                  style={{ background: '#334155', color: '#e2e8f0' }}
                >
                  ← Prev
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-30"
                  style={{ background: '#2596be', color: '#fff' }}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
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
