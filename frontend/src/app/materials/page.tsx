'use client';
import { useEffect, useState, useCallback } from 'react';
import Layout from '@/components/Layout';
import Modal from '@/components/Modal';
import Pagination from '@/components/Pagination';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

const EMPTY = { code: '', name: '', categoryId: '', side1: '', side2: '', thickness: '', specificWeight: '7850', linearWeight: '' };

export default function MaterialsPage() {
  const [data, setData] = useState<any>({ data: [], total: 0, pages: 1 });
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [catModal, setCatModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [catName, setCatName] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [mat, cats] = await Promise.all([
        api.get('/materials', { params: { search, categoryId: catFilter, page, limit: 15 } }),
        api.get('/materials/categories'),
      ]);
      setData(mat.data);
      setCategories(cats.data);
    } finally { setLoading(false); }
  }, [search, catFilter, page]);

  useEffect(() => { load(); }, [load]);

  const openEdit = (m: any) => { setEditing(m); setForm({ ...EMPTY, ...m, categoryId: m.categoryId }); setModal(true); };
  const openNew = () => { setEditing(null); setForm(EMPTY); setModal(true); };
  const f = (field: string, value: any) => setForm((p: any) => ({ ...p, [field]: value }));

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...form, side1: +form.side1 || null, side2: +form.side2 || null, thickness: +form.thickness || null, specificWeight: +form.specificWeight || null, linearWeight: +form.linearWeight };
      if (editing) await api.put(`/materials/${editing.id}`, payload);
      else await api.post('/materials', payload);
      toast.success(editing ? 'Material atualizado!' : 'Material criado!');
      setModal(false);
      load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Erro ao salvar'); }
    finally { setSaving(false); }
  };

  const duplicate = async (id: string) => {
    await api.post(`/materials/${id}/duplicate`);
    toast.success('Material duplicado!');
    load();
  };

  const remove = async (m: any) => {
    if (!confirm(`Excluir ${m.name}?`)) return;
    await api.delete(`/materials/${m.id}`);
    toast.success('Material excluído');
    load();
  };

  const saveCategory = async () => {
    await api.post('/materials/categories', { name: catName });
    toast.success('Categoria criada!');
    setCatModal(false);
    setCatName('');
    load();
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title">Perfis Metálicos</h1>
        <div className="flex gap-2">
          <button onClick={() => setCatModal(true)} className="btn-secondary">+ Categoria</button>
          <button onClick={openNew} className="btn-primary">+ Novo Perfil</button>
        </div>
      </div>

      <div className="card">
        <div className="p-4 border-b border-gray-100 flex gap-3 flex-wrap">
          <input className="input max-w-xs" placeholder="Buscar por nome ou código..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          <select className="input w-52" value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1); }}>
            <option value="">Todas as categorias</option>
            {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-3 font-semibold text-gray-600">Código</th>
                <th className="text-left p-3 font-semibold text-gray-600">Nome</th>
                <th className="text-left p-3 font-semibold text-gray-600 hidden md:table-cell">Categoria</th>
                <th className="text-left p-3 font-semibold text-gray-600 hidden sm:table-cell">L1 (mm)</th>
                <th className="text-left p-3 font-semibold text-gray-600 hidden sm:table-cell">L2 (mm)</th>
                <th className="text-left p-3 font-semibold text-gray-600 hidden lg:table-cell">Esp. (mm)</th>
                <th className="text-left p-3 font-semibold text-gray-600">Kg/m</th>
                <th className="p-3 font-semibold text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400">Carregando...</td></tr>
              ) : data.data.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400">Nenhum perfil encontrado</td></tr>
              ) : data.data.map((m: any) => (
                <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3 font-mono text-xs text-gray-600">{m.code}</td>
                  <td className="p-3 font-medium">{m.name}</td>
                  <td className="p-3 text-gray-600 hidden md:table-cell"><span className="badge bg-blue-50 text-blue-700">{m.category?.name}</span></td>
                  <td className="p-3 text-gray-600 hidden sm:table-cell">{m.side1 || '-'}</td>
                  <td className="p-3 text-gray-600 hidden sm:table-cell">{m.side2 || '-'}</td>
                  <td className="p-3 text-gray-600 hidden lg:table-cell">{m.thickness || '-'}</td>
                  <td className="p-3 font-semibold text-primary-700">{m.linearWeight.toFixed(3)}</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(m)} className="btn-secondary btn-sm">Editar</button>
                      <button onClick={() => duplicate(m.id)} className="btn-secondary btn-sm">Duplicar</button>
                      <button onClick={() => remove(m)} className="btn-danger btn-sm">✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4"><Pagination page={page} pages={data.pages} total={data.total} onChange={setPage} /></div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar Perfil' : 'Novo Perfil'} size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Código *</label>
              <input className="input" value={form.code} onChange={e => f('code', e.target.value)} />
            </div>
            <div>
              <label className="label">Categoria *</label>
              <select className="input" value={form.categoryId} onChange={e => f('categoryId', e.target.value)}>
                <option value="">Selecione</option>
                {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Nome *</label>
            <input className="input" value={form.name} onChange={e => f('name', e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Lado 1 (mm)</label>
              <input className="input" type="number" value={form.side1} onChange={e => f('side1', e.target.value)} />
            </div>
            <div>
              <label className="label">Lado 2 (mm)</label>
              <input className="input" type="number" value={form.side2} onChange={e => f('side2', e.target.value)} />
            </div>
            <div>
              <label className="label">Espessura (mm)</label>
              <input className="input" type="number" value={form.thickness} onChange={e => f('thickness', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Peso Esp. (kg/m³)</label>
              <input className="input" type="number" value={form.specificWeight} onChange={e => f('specificWeight', e.target.value)} />
            </div>
            <div>
              <label className="label">Peso Linear (kg/m) *</label>
              <input className="input" type="number" step="0.001" value={form.linearWeight} onChange={e => f('linearWeight', e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button className="btn-primary flex-1 justify-center" onClick={save} disabled={saving || !form.code || !form.name || !form.categoryId || !form.linearWeight}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
            <button className="btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
          </div>
        </div>
      </Modal>

      <Modal open={catModal} onClose={() => setCatModal(false)} title="Nova Categoria" size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">Nome da Categoria</label>
            <input className="input" value={catName} onChange={e => setCatName(e.target.value)} />
          </div>
          <div className="flex gap-3">
            <button className="btn-primary flex-1 justify-center" onClick={saveCategory} disabled={!catName}>Criar</button>
            <button className="btn-secondary" onClick={() => setCatModal(false)}>Cancelar</button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
