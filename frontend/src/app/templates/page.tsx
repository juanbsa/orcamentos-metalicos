'use client';
import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Modal from '@/components/Modal';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [name, setName] = useState('');
  const [items, setItems] = useState<{ materialId: string; meters: number }[]>([]);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [t, m] = await Promise.all([api.get('/templates'), api.get('/materials', { params: { limit: 200 } })]);
      setTemplates(t.data);
      setMaterials(m.data.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setName(''); setItems([]); setModal(true); };
  const openEdit = (t: any) => {
    setEditing(t);
    setName(t.name);
    setItems(t.items.map((i: any) => ({ materialId: i.materialId, meters: i.meters })));
    setModal(true);
  };

  const addItem = () => setItems(p => [...p, { materialId: '', meters: 1 }]);
  const removeItem = (i: number) => setItems(p => p.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, value: any) =>
    setItems(p => p.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

  const save = async () => {
    setSaving(true);
    try {
      if (editing) await api.put(`/templates/${editing.id}`, { name, items });
      else await api.post('/templates', { name, items });
      toast.success(editing ? 'Template atualizado!' : 'Template criado!');
      setModal(false);
      load();
    } catch { toast.error('Erro ao salvar'); }
    finally { setSaving(false); }
  };

  const remove = async (t: any) => {
    if (!confirm(`Excluir "${t.name}"?`)) return;
    await api.delete(`/templates/${t.id}`);
    toast.success('Template excluído');
    load();
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title">Templates de Estruturas</h1>
        <button onClick={openNew} className="btn-primary">+ Novo Template</button>
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-10">Carregando...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.length === 0 && <p className="text-gray-400 col-span-3 text-center py-10">Nenhum template cadastrado</p>}
          {templates.map(t => (
            <div key={t.id} className="card p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{t.name}</h3>
                  <p className="text-xs text-gray-500">{t.items.length} perfil{t.items.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(t)} className="btn-secondary btn-sm">Editar</button>
                  <button onClick={() => remove(t)} className="btn-danger btn-sm">✕</button>
                </div>
              </div>
              <ul className="space-y-1">
                {t.items.slice(0, 4).map((item: any) => (
                  <li key={item.id} className="text-xs text-gray-600 flex justify-between">
                    <span>{item.material?.name}</span>
                    <span className="text-gray-400">{item.meters} m</span>
                  </li>
                ))}
                {t.items.length > 4 && <li className="text-xs text-gray-400">+{t.items.length - 4} mais...</li>}
              </ul>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar Template' : 'Novo Template'} size="lg">
        <div className="space-y-4">
          <div>
            <label className="label">Nome do Template *</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Portão Simples, Cobertura 6x4..." />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Perfis</label>
              <button onClick={addItem} className="btn-secondary btn-sm">+ Adicionar Perfil</button>
            </div>
            {items.length === 0 && <p className="text-sm text-gray-400 py-4 text-center border border-dashed border-gray-200 rounded-lg">Nenhum perfil adicionado</p>}
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <select className="input flex-1" value={item.materialId} onChange={e => updateItem(i, 'materialId', e.target.value)}>
                    <option value="">Selecione o material</option>
                    {materials.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                  <input className="input w-24" type="number" step="0.1" min="0.1" value={item.meters} onChange={e => updateItem(i, 'meters', +e.target.value)} placeholder="Metros" />
                  <button onClick={() => removeItem(i)} className="btn-danger btn-sm shrink-0">✕</button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button className="btn-primary flex-1 justify-center" onClick={save} disabled={saving || !name}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
            <button className="btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
