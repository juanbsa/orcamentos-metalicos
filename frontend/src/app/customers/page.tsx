'use client';
import { useEffect, useState, useCallback } from 'react';
import Layout from '@/components/Layout';
import Modal from '@/components/Modal';
import Pagination from '@/components/Pagination';
import { api, formatCPF, formatCNPJ, formatPhone, fmtDate } from '@/lib/api';
import toast from 'react-hot-toast';

const EMPTY = { type: 'FISICA', name: '', fantasyName: '', cpf: '', cnpj: '', phone: '', email: '', responsible: '', street: '', number: '', complement: '', district: '', city: '', state: '', zipCode: '' };

export default function CustomersPage() {
  const [data, setData] = useState<any>({ data: [], total: 0, pages: 1 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/customers', { params: { search, page, limit: 15 } });
      setData(r.data);
    } finally { setLoading(false); }
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setEditing(null); setForm(EMPTY); setModal(true); };
  const openEdit = (c: any) => { setEditing(c); setForm({ ...EMPTY, ...c }); setModal(true); };

  const save = async () => {
    setSaving(true);
    try {
      if (editing) await api.put(`/customers/${editing.id}`, form);
      else await api.post('/customers', form);
      toast.success(editing ? 'Cliente atualizado!' : 'Cliente criado!');
      setModal(false);
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erro ao salvar');
    } finally { setSaving(false); }
  };

  const remove = async (c: any) => {
    if (!confirm(`Excluir ${c.name}?`)) return;
    await api.delete(`/customers/${c.id}`);
    toast.success('Cliente excluído');
    load();
  };

  const f = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title">Clientes</h1>
        <button onClick={openNew} className="btn-primary">+ Novo Cliente</button>
      </div>

      <div className="card">
        <div className="p-4 border-b border-gray-100">
          <input className="input max-w-sm" placeholder="Pesquisar por nome, CPF, CNPJ..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-3 font-semibold text-gray-600">Nome</th>
                <th className="text-left p-3 font-semibold text-gray-600 hidden md:table-cell">Tipo</th>
                <th className="text-left p-3 font-semibold text-gray-600 hidden sm:table-cell">Documento</th>
                <th className="text-left p-3 font-semibold text-gray-600 hidden lg:table-cell">Telefone</th>
                <th className="text-left p-3 font-semibold text-gray-600 hidden lg:table-cell">Orçamentos</th>
                <th className="p-3 font-semibold text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">Carregando...</td></tr>
              ) : data.data.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">Nenhum cliente encontrado</td></tr>
              ) : data.data.map((c: any) => (
                <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3">
                    <p className="font-medium">{c.name}</p>
                    {c.fantasyName && <p className="text-xs text-gray-500">{c.fantasyName}</p>}
                  </td>
                  <td className="p-3 hidden md:table-cell">
                    <span className={`badge ${c.type === 'FISICA' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                      {c.type === 'FISICA' ? 'PF' : 'PJ'}
                    </span>
                  </td>
                  <td className="p-3 text-gray-600 hidden sm:table-cell">
                    {c.type === 'FISICA' ? formatCPF(c.cpf || '') : formatCNPJ(c.cnpj || '')}
                  </td>
                  <td className="p-3 text-gray-600 hidden lg:table-cell">{formatPhone(c.phone || '')}</td>
                  <td className="p-3 hidden lg:table-cell">
                    <span className="badge bg-gray-100 text-gray-600">{c._count?.quotes ?? 0}</span>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(c)} className="btn-secondary btn-sm">Editar</button>
                      <button onClick={() => remove(c)} className="btn-danger btn-sm">Excluir</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4">
          <Pagination page={page} pages={data.pages} total={data.total} onChange={setPage} />
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar Cliente' : 'Novo Cliente'} size="lg">
        <div className="space-y-4">
          <div>
            <label className="label">Tipo de Pessoa</label>
            <div className="flex gap-3">
              {['FISICA', 'JURIDICA'].map(t => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value={t} checked={form.type === t} onChange={() => f('type', t)} />
                  <span className="text-sm">{t === 'FISICA' ? 'Pessoa Física' : 'Pessoa Jurídica'}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className={form.type === 'JURIDICA' ? 'col-span-2' : ''}>
              <label className="label">{form.type === 'JURIDICA' ? 'Razão Social' : 'Nome'} *</label>
              <input className="input" value={form.name} onChange={e => f('name', e.target.value)} />
            </div>
            {form.type === 'JURIDICA' && (
              <>
                <div>
                  <label className="label">Nome Fantasia</label>
                  <input className="input" value={form.fantasyName} onChange={e => f('fantasyName', e.target.value)} />
                </div>
                <div>
                  <label className="label">Responsável</label>
                  <input className="input" value={form.responsible} onChange={e => f('responsible', e.target.value)} />
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {form.type === 'FISICA' ? (
              <div>
                <label className="label">CPF</label>
                <input className="input" value={form.cpf} onChange={e => f('cpf', e.target.value)} placeholder="000.000.000-00" />
              </div>
            ) : (
              <div>
                <label className="label">CNPJ</label>
                <input className="input" value={form.cnpj} onChange={e => f('cnpj', e.target.value)} placeholder="00.000.000/0000-00" />
              </div>
            )}
            <div>
              <label className="label">Telefone *</label>
              <input className="input" value={form.phone} onChange={e => f('phone', e.target.value)} placeholder="(00) 00000-0000" />
            </div>
          </div>

          <div>
            <label className="label">E-mail</label>
            <input className="input" type="email" value={form.email} onChange={e => f('email', e.target.value)} />
          </div>

          <hr />
          <p className="text-sm font-medium text-gray-700">Endereço</p>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="label">Rua/Av.</label>
              <input className="input" value={form.street} onChange={e => f('street', e.target.value)} />
            </div>
            <div>
              <label className="label">Nº</label>
              <input className="input" value={form.number} onChange={e => f('number', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Complemento</label>
              <input className="input" value={form.complement} onChange={e => f('complement', e.target.value)} />
            </div>
            <div>
              <label className="label">Bairro</label>
              <input className="input" value={form.district} onChange={e => f('district', e.target.value)} />
            </div>
            <div>
              <label className="label">CEP</label>
              <input className="input" value={form.zipCode} onChange={e => f('zipCode', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Cidade</label>
              <input className="input" value={form.city} onChange={e => f('city', e.target.value)} />
            </div>
            <div>
              <label className="label">Estado</label>
              <input className="input" value={form.state} onChange={e => f('state', e.target.value)} placeholder="PB" maxLength={2} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button className="btn-primary flex-1 justify-center" onClick={save} disabled={saving || !form.name || !form.phone}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
            <button className="btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
