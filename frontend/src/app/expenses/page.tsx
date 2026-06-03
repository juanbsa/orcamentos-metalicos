'use client';
import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Modal from '@/components/Modal';
import { api, fmtCurrency } from '@/lib/api';
import toast from 'react-hot-toast';

export default function ExpensesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', defaultValue: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const r = await api.get('/expenses'); setItems(r.data); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openEdit = (e: any) => { setEditing(e); setForm({ name: e.name, defaultValue: e.defaultValue }); setModal(true); };
  const openNew = () => { setEditing(null); setForm({ name: '', defaultValue: '' }); setModal(true); };

  const save = async () => {
    setSaving(true);
    try {
      const payload = { name: form.name, defaultValue: +form.defaultValue };
      if (editing) await api.put(`/expenses/${editing.id}`, payload);
      else await api.post('/expenses', payload);
      toast.success(editing ? 'Despesa atualizada!' : 'Despesa criada!');
      setModal(false);
      load();
    } catch { toast.error('Erro ao salvar'); }
    finally { setSaving(false); }
  };

  const remove = async (e: any) => {
    if (!confirm(`Excluir "${e.name}"?`)) return;
    await api.delete(`/expenses/${e.id}`);
    toast.success('Despesa excluída');
    load();
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title">Despesas Auxiliares</h1>
        <button onClick={openNew} className="btn-primary">+ Nova Despesa</button>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-3 font-semibold text-gray-600">Nome</th>
                <th className="text-left p-3 font-semibold text-gray-600">Valor Padrão</th>
                <th className="p-3 font-semibold text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} className="text-center py-10 text-gray-400">Carregando...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={3} className="text-center py-10 text-gray-400">Nenhuma despesa cadastrada</td></tr>
              ) : items.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3 font-medium">{item.name}</td>
                  <td className="p-3 text-green-600 font-semibold">{fmtCurrency(item.defaultValue)}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(item)} className="btn-secondary btn-sm">Editar</button>
                      <button onClick={() => remove(item)} className="btn-danger btn-sm">Excluir</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar Despesa' : 'Nova Despesa'} size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">Nome *</label>
            <input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div>
            <label className="label">Valor Padrão (R$) *</label>
            <input className="input" type="number" step="0.01" value={form.defaultValue} onChange={e => setForm(p => ({ ...p, defaultValue: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <button className="btn-primary flex-1 justify-center" onClick={save} disabled={saving || !form.name || !form.defaultValue}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
            <button className="btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
