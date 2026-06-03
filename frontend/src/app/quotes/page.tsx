'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import Pagination from '@/components/Pagination';
import { api, fmtCurrency, fmtDate, STATUS_LABELS, STATUS_COLORS } from '@/lib/api';
import toast from 'react-hot-toast';

const STATUSES = ['', 'ELABORACAO', 'ENVIADO', 'AGUARDANDO', 'APROVADO', 'REPROVADO'];

export default function QuotesPage() {
  const router = useRouter();
  const [data, setData] = useState<any>({ data: [], total: 0, pages: 1 });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/quotes', { params: { search, status, page, limit: 15 } });
      setData(r.data);
    } finally { setLoading(false); }
  }, [search, status, page]);

  useEffect(() => { load(); }, [load]);

  const duplicate = async (id: string) => {
    const r = await api.post(`/quotes/${id}/duplicate`);
    toast.success('Orçamento duplicado!');
    router.push(`/quotes/${r.data.id}`);
  };

  const changeStatus = async (id: string, newStatus: string) => {
    await api.patch(`/quotes/${id}/status`, { status: newStatus });
    toast.success('Status atualizado!');
    load();
  };

  const openPdf = (id: string) => {
    const token = localStorage.getItem('token');
    window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/pdf/quote/${id}?token=${token}`, '_blank');
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title">Orçamentos</h1>
        <button onClick={() => router.push('/quotes/new')} className="btn-primary">+ Novo Orçamento</button>
      </div>

      <div className="card">
        <div className="p-4 border-b border-gray-100 flex gap-3 flex-wrap">
          <input className="input max-w-xs" placeholder="Buscar por cliente ou número..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          <select className="input w-48" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
            {STATUSES.map(s => <option key={s} value={s}>{s ? STATUS_LABELS[s] : 'Todos os status'}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-3 font-semibold text-gray-600">Nº</th>
                <th className="text-left p-3 font-semibold text-gray-600">Cliente</th>
                <th className="text-left p-3 font-semibold text-gray-600 hidden sm:table-cell">Data</th>
                <th className="text-left p-3 font-semibold text-gray-600">Status</th>
                <th className="text-left p-3 font-semibold text-gray-600 hidden md:table-cell">Valor</th>
                <th className="p-3 font-semibold text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">Carregando...</td></tr>
              ) : data.data.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">Nenhum orçamento encontrado</td></tr>
              ) : data.data.map((q: any) => (
                <tr key={q.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3 font-mono text-primary-700 font-semibold">
                    #{String(q.number).padStart(5, '0')}
                  </td>
                  <td className="p-3">
                    <p className="font-medium">{q.customer?.name}</p>
                    {q.customer?.fantasyName && <p className="text-xs text-gray-500">{q.customer.fantasyName}</p>}
                  </td>
                  <td className="p-3 text-gray-600 hidden sm:table-cell">{fmtDate(q.createdAt)}</td>
                  <td className="p-3">
                    <select
                      value={q.status}
                      onChange={e => changeStatus(q.id, e.target.value)}
                      className={`badge border-0 cursor-pointer text-xs font-medium rounded-full px-2 py-1 ${STATUS_COLORS[q.status]}`}
                    >
                      {STATUSES.filter(Boolean).map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                    </select>
                  </td>
                  <td className="p-3 font-semibold text-green-600 hidden md:table-cell">{fmtCurrency(q.total)}</td>
                  <td className="p-3">
                    <div className="flex gap-1 flex-wrap">
                      <button onClick={() => router.push(`/quotes/${q.id}`)} className="btn-secondary btn-sm">Ver</button>
                      <button onClick={() => duplicate(q.id)} className="btn-secondary btn-sm">Duplicar</button>
                      <button onClick={() => openPdf(q.id)} className="btn-secondary btn-sm">PDF</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4"><Pagination page={page} pages={data.pages} total={data.total} onChange={setPage} /></div>
      </div>
    </Layout>
  );
}
