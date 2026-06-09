'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { api, fmtCurrency, fmtDate, STATUS_LABELS, STATUS_COLORS } from '@/lib/api';
import toast from 'react-hot-toast';

export default function QuoteDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/quotes/${id}`).then(r => { setQuote(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, [id]);

  const openPdf = () => {
    const token = localStorage.getItem('token');
    window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/pdf/quote/${id}?token=${token}`, '_blank');
  };

  const duplicate = async () => {
    const r = await api.post(`/quotes/${id}/duplicate`);
    toast.success('Orçamento duplicado!');
    router.push(`/quotes/${r.data.id}`);
  };

  if (loading) return <Layout><div className="flex items-center justify-center h-64 text-gray-400">Carregando...</div></Layout>;
  if (!quote) return <Layout><div className="text-center py-10 text-gray-400">Orçamento não encontrado.</div></Layout>;

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="page-title">Orçamento #{String(quote.number).padStart(5, '0')}</h1>
          <p className="text-sm text-gray-500">{fmtDate(quote.createdAt)} · por {quote.user?.name}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <span className={`badge ${STATUS_COLORS[quote.status]} text-sm py-1.5 px-3`}>{STATUS_LABELS[quote.status]}</span>
          <button onClick={() => router.push(`/quotes/${id}/edit`)} className="btn-secondary">Editar</button>
          <button onClick={duplicate} className="btn-secondary">Duplicar</button>
          <button onClick={openPdf} className="btn-primary">📄 Gerar PDF</button>
          <button onClick={() => router.back()} className="btn-secondary">← Voltar</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Cliente */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Cliente</h2>
            <p className="font-semibold text-gray-900 text-lg">{quote.customer?.fantasyName || quote.customer?.name}</p>
            {quote.customer?.fantasyName && <p className="text-sm text-gray-500">{quote.customer.name}</p>}
            <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-gray-600">
              <span>📞 {quote.customer?.phone}</span>
              {quote.customer?.email && <span>✉️ {quote.customer.email}</span>}
            </div>
          </div>

          {/* Materiais */}
          {quote.items?.length > 0 && (
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Perfis Metálicos</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 font-medium text-gray-600">Material</th>
                      <th className="text-right py-2 font-medium text-gray-600">Metros</th>
                      <th className="text-right py-2 font-medium text-gray-600 hidden sm:table-cell">Peso (kg)</th>
                      <th className="text-right py-2 font-medium text-gray-600 hidden sm:table-cell">c/ Desperd.</th>
                      <th className="text-right py-2 font-medium text-gray-600">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quote.items.map((item: any) => (
                      <tr key={item.id} className="border-b border-gray-100">
                        <td className="py-2">
                          <p className="font-medium">{item.material?.name}</p>
                          <p className="text-xs text-gray-400">{item.material?.code}</p>
                        </td>
                        <td className="py-2 text-right">{item.meters.toFixed(2)}</td>
                        <td className="py-2 text-right text-gray-500 hidden sm:table-cell">{item.totalWeight.toFixed(3)}</td>
                        <td className="py-2 text-right text-gray-500 hidden sm:table-cell">{item.weightWithWaste.toFixed(3)}</td>
                        <td className="py-2 text-right font-semibold text-green-600">{fmtCurrency(item.totalValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-400 mt-2">Desperdício: {quote.wastePercent}% | R$/kg: {fmtCurrency(quote.pricePerKg)}</p>
            </div>
          )}

          {/* Despesas */}
          {quote.expenses?.length > 0 && (
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Outras Despesas</h2>
              <div className="space-y-2">
                {quote.expenses.map((e: any) => (
                  <div key={e.id} className="flex justify-between text-sm">
                    <span>{e.expense?.name}</span>
                    <span className="font-medium">{fmtCurrency(e.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {quote.observations && (
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Observações</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{quote.observations}</p>
            </div>
          )}
        </div>

        {/* Resumo */}
        <div className="card p-5 h-fit sticky top-20">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Resumo Financeiro</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Total Materiais</span>
              <span>{fmtCurrency(quote.totalMaterials)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Total Despesas</span>
              <span>{fmtCurrency(quote.totalExpenses)}</span>
            </div>
            <div className="flex justify-between font-medium text-gray-700 border-t pt-2">
              <span>Subtotal</span>
              <span>{fmtCurrency(quote.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Lucro ({quote.profitType === 'MULTIPLIER' ? `${quote.profitValue}x` : `${quote.profitValue}%`})</span>
              <span>{fmtCurrency(quote.profitAmount)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-primary-700 border-t-2 border-primary-200 pt-3">
              <span>TOTAL</span>
              <span>{fmtCurrency(quote.total)}</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t text-xs text-gray-400 space-y-1">
            <p>Validade: {quote.validity} dias</p>
            <p>Criado em: {fmtDate(quote.createdAt)}</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
