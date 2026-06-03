'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, fmtCurrency } from '@/lib/api';
import toast from 'react-hot-toast';

interface Item { materialId: string; meters: number; linearWeight: number; }
interface Expense { expenseId: string; value: number; name?: string; }

export default function QuoteForm({ initialQuote }: { initialQuote?: any }) {
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);

  const [customerId, setCustomerId] = useState(initialQuote?.customerId || '');
  const [customerSearch, setCustomerSearch] = useState('');
  const [wastePercent, setWastePercent] = useState(initialQuote?.wastePercent ?? 5);
  const [pricePerKg, setPricePerKg] = useState(initialQuote?.pricePerKg ?? 35);
  const [profitType, setProfitType] = useState(initialQuote?.profitType || 'MULTIPLIER');
  const [profitValue, setProfitValue] = useState(initialQuote?.profitValue ?? 3);
  const [validity, setValidity] = useState(initialQuote?.validity ?? 30);
  const [observations, setObservations] = useState(initialQuote?.observations || '');
  const [items, setItems] = useState<Item[]>(
    initialQuote?.items?.map((i: any) => ({ materialId: i.materialId, meters: i.meters, linearWeight: i.material?.linearWeight || 0 })) || []
  );
  const [quoteExpenses, setQuoteExpenses] = useState<Expense[]>(
    initialQuote?.expenses?.map((e: any) => ({ expenseId: e.expenseId, value: e.value, name: e.expense?.name })) || []
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/customers', { params: { limit: 200 } }),
      api.get('/materials', { params: { limit: 200 } }),
      api.get('/expenses'),
      api.get('/templates'),
    ]).then(([c, m, e, t]) => {
      setCustomers(c.data.data);
      setMaterials(m.data.data);
      setExpenses(e.data);
      setTemplates(t.data);
    });
  }, []);

  const calc = () => {
    let totalMaterials = 0;
    const calcItems = items.map(item => {
      const mat = materials.find(m => m.id === item.materialId);
      const lw = mat?.linearWeight || item.linearWeight || 0;
      const totalWeight = item.meters * lw;
      const weightWithWaste = totalWeight * (1 + wastePercent / 100);
      const totalValue = weightWithWaste * pricePerKg;
      totalMaterials += totalValue;
      return { totalWeight, weightWithWaste, totalValue };
    });
    const totalExpenses = quoteExpenses.reduce((s, e) => s + e.value, 0);
    const subtotal = totalMaterials + totalExpenses;
    let profitAmount = 0, total = 0;
    if (profitType === 'MULTIPLIER') { total = subtotal * profitValue; profitAmount = total - subtotal; }
    else { profitAmount = subtotal * (profitValue / 100); total = subtotal + profitAmount; }
    return { calcItems, totalMaterials, totalExpenses, subtotal, profitAmount, total };
  };

  const { totalMaterials, totalExpenses, subtotal, profitAmount, total } = calc();

  const addItem = () => setItems(p => [...p, { materialId: '', meters: 1, linearWeight: 0 }]);
  const removeItem = (i: number) => setItems(p => p.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, value: any) => {
    setItems(p => p.map((item, idx) => {
      if (idx !== i) return item;
      const updated = { ...item, [field]: value };
      if (field === 'materialId') {
        const mat = materials.find(m => m.id === value);
        updated.linearWeight = mat?.linearWeight || 0;
      }
      return updated;
    }));
  };

  const addExpense = (exp: any) => {
    if (quoteExpenses.find(e => e.expenseId === exp.id)) return;
    setQuoteExpenses(p => [...p, { expenseId: exp.id, value: exp.defaultValue, name: exp.name }]);
  };
  const removeExpense = (i: number) => setQuoteExpenses(p => p.filter((_, idx) => idx !== i));
  const updateExpenseValue = (i: number, value: number) =>
    setQuoteExpenses(p => p.map((e, idx) => idx === i ? { ...e, value } : e));

  const applyTemplate = (t: any) => {
    const newItems = t.items.map((i: any) => ({
      materialId: i.materialId,
      meters: i.meters,
      linearWeight: i.material?.linearWeight || 0,
    }));
    setItems(newItems);
    toast.success(`Template "${t.name}" aplicado!`);
  };

  const save = async () => {
    if (!customerId) { toast.error('Selecione o cliente'); return; }
    if (items.length === 0) { toast.error('Adicione pelo menos um material'); return; }
    setSaving(true);
    try {
      const payload = {
        customerId,
        wastePercent: +wastePercent,
        pricePerKg: +pricePerKg,
        profitType,
        profitValue: +profitValue,
        validity: +validity,
        observations,
        items: items.map(item => ({
          materialId: item.materialId,
          meters: +item.meters,
          linearWeight: materials.find(m => m.id === item.materialId)?.linearWeight || item.linearWeight,
        })),
        expenses: quoteExpenses.map(e => ({ expenseId: e.expenseId, value: +e.value })),
      };

      if (initialQuote) {
        await api.put(`/quotes/${initialQuote.id}`, payload);
        toast.success('Orçamento atualizado!');
        router.push(`/quotes/${initialQuote.id}`);
      } else {
        const r = await api.post('/quotes', payload);
        toast.success('Orçamento criado!');
        router.push(`/quotes/${r.data.id}`);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erro ao salvar');
    } finally { setSaving(false); }
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    (c.fantasyName || '').toLowerCase().includes(customerSearch.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title">{initialQuote ? `Editar Orçamento #${String(initialQuote.number).padStart(5, '0')}` : 'Novo Orçamento'}</h1>
        <button onClick={() => router.back()} className="btn-secondary">← Voltar</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna principal */}
        <div className="lg:col-span-2 space-y-5">
          {/* Cliente */}
          <div className="card p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Cliente</h2>
            <input
              className="input mb-2"
              placeholder="Pesquisar cliente..."
              value={customerSearch}
              onChange={e => setCustomerSearch(e.target.value)}
            />
            <select className="input" value={customerId} onChange={e => setCustomerId(e.target.value)}>
              <option value="">Selecione o cliente</option>
              {filteredCustomers.map(c => (
                <option key={c.id} value={c.id}>{c.fantasyName || c.name} — {c.type === 'FISICA' ? c.cpf : c.cnpj}</option>
              ))}
            </select>
          </div>

          {/* Template */}
          {templates.length > 0 && (
            <div className="card p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Aplicar Template</h2>
              <div className="flex gap-2 flex-wrap">
                {templates.map(t => (
                  <button key={t.id} onClick={() => applyTemplate(t)} className="btn-secondary btn-sm">
                    📐 {t.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Materiais */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Perfis Metálicos</h2>
              <button onClick={addItem} className="btn-secondary btn-sm">+ Adicionar</button>
            </div>

            {items.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-lg">
                Nenhum material adicionado
              </p>
            )}

            <div className="space-y-2">
              {items.map((item, i) => {
                const mat = materials.find(m => m.id === item.materialId);
                const lw = mat?.linearWeight || 0;
                const totalWeight = item.meters * lw;
                const weightWithWaste = totalWeight * (1 + wastePercent / 100);
                const totalValue = weightWithWaste * pricePerKg;

                return (
                  <div key={i} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex gap-2 mb-2">
                      <select
                        className="input flex-1"
                        value={item.materialId}
                        onChange={e => updateItem(i, 'materialId', e.target.value)}
                      >
                        <option value="">Selecionar material</option>
                        {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.linearWeight} kg/m)</option>)}
                      </select>
                      <input
                        className="input w-28"
                        type="number"
                        step="0.1"
                        min="0.01"
                        value={item.meters}
                        onChange={e => updateItem(i, 'meters', +e.target.value)}
                        placeholder="Metros"
                      />
                      <button onClick={() => removeItem(i)} className="btn-danger btn-sm shrink-0">✕</button>
                    </div>
                    {mat && (
                      <div className="grid grid-cols-4 gap-2 text-xs text-gray-500">
                        <span>Peso: <b>{totalWeight.toFixed(2)} kg</b></span>
                        <span>c/ desperd.: <b>{weightWithWaste.toFixed(2)} kg</b></span>
                        <span>kg/m: <b>{lw}</b></span>
                        <span className="text-green-600 font-semibold">= {fmtCurrency(totalValue)}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Despesas */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Outras Despesas</h2>
              <div className="flex gap-2 flex-wrap">
                {expenses.map(e => (
                  <button key={e.id} onClick={() => addExpense(e)} className="btn-secondary btn-sm">+ {e.name}</button>
                ))}
              </div>
            </div>

            {quoteExpenses.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-lg">Nenhuma despesa adicionada</p>
            ) : (
              <div className="space-y-2">
                {quoteExpenses.map((exp, i) => {
                  const expData = expenses.find(e => e.id === exp.expenseId);
                  return (
                    <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                      <span className="flex-1 text-sm font-medium">{exp.name || expData?.name}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400">R$</span>
                        <input
                          className="input w-28"
                          type="number"
                          step="0.01"
                          value={exp.value}
                          onChange={e => updateExpenseValue(i, +e.target.value)}
                        />
                      </div>
                      <button onClick={() => removeExpense(i)} className="btn-danger btn-sm">✕</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Coluna lateral — configurações e resumo */}
        <div className="space-y-5">
          {/* Configurações */}
          <div className="card p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Configurações</h2>
            <div className="space-y-3">
              <div>
                <label className="label">Desperdício (%)</label>
                <input className="input" type="number" step="0.5" min="0" value={wastePercent} onChange={e => setWastePercent(+e.target.value)} />
              </div>
              <div>
                <label className="label">Valor por kg (R$)</label>
                <input className="input" type="number" step="0.01" min="0" value={pricePerKg} onChange={e => setPricePerKg(+e.target.value)} />
              </div>
              <div>
                <label className="label">Margem de Lucro</label>
                <div className="flex gap-2 mb-2">
                  {['MULTIPLIER', 'PERCENT'].map(t => (
                    <label key={t} className="flex items-center gap-1.5 cursor-pointer text-sm">
                      <input type="radio" value={t} checked={profitType === t} onChange={() => setProfitType(t)} />
                      {t === 'MULTIPLIER' ? 'Multiplicador' : 'Percentual'}
                    </label>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input className="input" type="number" step="0.1" min="1" value={profitValue} onChange={e => setProfitValue(+e.target.value)} />
                  <span className="text-sm text-gray-500 shrink-0">{profitType === 'MULTIPLIER' ? 'x' : '%'}</span>
                </div>
              </div>
              <div>
                <label className="label">Validade (dias)</label>
                <input className="input" type="number" min="1" value={validity} onChange={e => setValidity(+e.target.value)} />
              </div>
            </div>
          </div>

          {/* Resumo financeiro */}
          <div className="card p-5 sticky top-20">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Resumo Financeiro</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Total Materiais</span>
                <span>{fmtCurrency(totalMaterials)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Total Despesas</span>
                <span>{fmtCurrency(totalExpenses)}</span>
              </div>
              <div className="flex justify-between text-gray-700 font-medium border-t border-gray-200 pt-2">
                <span>Subtotal</span>
                <span>{fmtCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Lucro ({profitType === 'MULTIPLIER' ? `${profitValue}x` : `${profitValue}%`})</span>
                <span>{fmtCurrency(profitAmount)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-primary-700 border-t-2 border-primary-200 pt-3 mt-2">
                <span>TOTAL</span>
                <span>{fmtCurrency(total)}</span>
              </div>
            </div>

            <div className="mt-4">
              <label className="label">Observações</label>
              <textarea className="input resize-none" rows={3} value={observations} onChange={e => setObservations(e.target.value)} placeholder="Observações para o cliente..." />
            </div>

            <button
              className="btn-primary w-full justify-center mt-4 py-3 text-base"
              onClick={save}
              disabled={saving}
            >
              {saving ? 'Salvando...' : (initialQuote ? 'Atualizar Orçamento' : 'Criar Orçamento')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
