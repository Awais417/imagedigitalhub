'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.godoclab.com/api';

function fmt(bytes: number) {
  if (bytes < 1024)         return `${bytes} B`;
  if (bytes < 1024 ** 2)    return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3)    return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

interface Overview {
  totalUsers: number;
  totalConversions: number;
  newUsersMonth: number;
  newUsersWeek: number;
  newConversionsToday: number;
  newConversionsWeek: number;
  newConversionsMonth: number;
  totalStorageBytes: number;
}

export default function AdminOverview() {
  const { token } = useAuth();
  const [data, setData]     = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/admin/overview`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { setData(d as Overview); setLoading(false); })
      .catch(() => { setError('Failed to load overview'); setLoading(false); });
  }, [token]);

  if (loading) return <Spinner />;
  if (error)   return <ErrMsg msg={error} />;
  if (!data)   return null;

  const cards = [
    { label: 'Total Users',         value: data.totalUsers.toLocaleString(),        sub: `+${data.newUsersWeek} this week`,    icon: '👥', color: '#2596be' },
    { label: 'Total Conversions',   value: data.totalConversions.toLocaleString(),  sub: `+${data.newConversionsToday} today`, icon: '⚙️', color: '#8b5cf6' },
    { label: 'New Users (month)',   value: data.newUsersMonth.toLocaleString(),     sub: `+${data.newUsersWeek} this week`,    icon: '🆕', color: '#10b981' },
    { label: 'Storage Used',        value: fmt(data.totalStorageBytes),             sub: 'across all conversions',             icon: '🗄️', color: '#f59e0b' },
    { label: 'Conversions Today',   value: data.newConversionsToday.toLocaleString(), sub: `${data.newConversionsWeek} this week`, icon: '📅', color: '#ef4444' },
    { label: 'Conversions (month)', value: data.newConversionsMonth.toLocaleString(), sub: 'this calendar month',              icon: '📆', color: '#06b6d4' },
  ];

  return (
    <div>
      <h1 className="text-xl font-black text-white mb-1">Dashboard Overview</h1>
      <p className="text-sm mb-6" style={{ color: '#64748b' }}>Real-time stats for godoclab.com</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl p-5 flex items-start gap-4"
            style={{ background: '#1e293b', border: '1px solid #334155' }}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
              style={{ background: c.color + '20' }}
            >
              {c.icon}
            </div>
            <div>
              <p className="text-2xl font-black text-white leading-tight">{c.value}</p>
              <p className="text-xs font-semibold mt-0.5" style={{ color: c.color }}>{c.label}</p>
              <p className="text-[11px] mt-0.5" style={{ color: '#64748b' }}>{c.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs mt-8 text-center" style={{ color: '#334155' }}>
        Data pulled live from the database · Refresh to update
      </p>
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
