'use client';
import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { api, fmtCurrency, STATUS_LABELS, STATUS_COLORS } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const PIE_COLORS = ['#1e40af', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444'];

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(r => { setStats(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <Layout><div className="flex items-center justify-center h-64 text-gray-500">Carregando...</div></Layout>;

  const statusData = stats?.statusCounts
    ? Object.entries(stats.statusCounts).map(([k, v]) => ({ name: STATUS_LABELS[k] || k, value: v as number }))
    : [];

  return (
    <Layout>
      <h1 className="page-title mb-6">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Orçamentos no Mês" value={stats?.monthQuotes ?? 0} icon="📋" color="blue" />
        <KpiCard label="Valor Total (Mês)" value={fmtCurrency(stats?.totalValueMonth ?? 0)} icon="💵" color="green" />
        <KpiCard label="Aprovados" value={fmtCurrency(stats?.totalApproved ?? 0)} icon="✅" color="emerald" />
        <KpiCard label="Conversão" value={`${stats?.conversionRate ?? 0}%`} icon="📈" color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Status dos Orçamentos */}
        <div className="card p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Status dos Orçamentos</h2>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} labelLine={false} fontSize={11}>
                  {statusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-center py-10">Sem dados</p>}
        </div>

        {/* Top Clientes */}
        <div className="card p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Top 5 Clientes</h2>
          {stats?.topCustomers?.length > 0 ? (
            <div className="space-y-3">
              {stats.topCustomers.map((c: any, i: number) => (
                <div key={c.id} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.fantasyName || c.name}</p>
                    <p className="text-xs text-gray-500">{c.count} orçamento{c.count !== 1 ? 's' : ''}</p>
                  </div>
                  <span className="text-sm font-semibold text-green-600">{fmtCurrency(c.total)}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-400 text-center py-10">Sem dados</p>}
        </div>
      </div>

      {/* Top Materiais */}
      <div className="card p-5">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Materiais Mais Utilizados</h2>
        {stats?.topMaterials?.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.topMaterials.map((m: any) => ({ name: m.name?.substring(0, 20), metros: m.totalMeters }))}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: any) => [`${v?.toFixed(1)} m`, 'Total']} />
              <Bar dataKey="metros" fill="#1e40af" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : <p className="text-gray-400 text-center py-10">Sem dados</p>}
      </div>
    </Layout>
  );
}

function KpiCard({ label, value, icon, color }: { label: string; value: any; icon: string; color: string }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-lg font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}
