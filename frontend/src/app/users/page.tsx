'use client';
import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Modal from '@/components/Modal';
import { api, fmtDate } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import toast from 'react-hot-toast';

const EMPTY = { name: '', email: '', password: '', role: 'COMERCIAL' };

export default function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const r = await api.get('/users'); setUsers(r.data); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openEdit = (u: any) => { setEditing(u); setForm({ name: u.name, email: u.email, password: '', role: u.role }); setModal(true); };
  const openNew = () => { setEditing(null); setForm(EMPTY); setModal(true); };

  const save = async () => {
    setSaving(true);
    try {
      if (editing) await api.put(`/users/${editing.id}`, form.password ? form : { name: form.name, email: form.email, role: form.role });
      else await api.post('/users', form);
      toast.success(editing ? 'Usuário atualizado!' : 'Usuário criado!');
      setModal(false);
      load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Erro ao salvar'); }
    finally { setSaving(false); }
  };

  const toggle = async (u: any) => {
    await api.put(`/users/${u.id}`, { active: !u.active });
    toast.success(u.active ? 'Usuário desativado' : 'Usuário ativado');
    load();
  };

  if (user?.role !== 'ADMIN') {
    return <Layout><div className="text-center py-20 text-gray-400">Acesso restrito a administradores.</div></Layout>;
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title">Usuários</h1>
        <button onClick={openNew} className="btn-primary">+ Novo Usuário</button>
      </div>

      <div className="card">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left p-3 font-semibold text-gray-600">Nome</th>
              <th className="text-left p-3 font-semibold text-gray-600">E-mail</th>
              <th className="text-left p-3 font-semibold text-gray-600">Perfil</th>
              <th className="text-left p-3 font-semibold text-gray-600">Status</th>
              <th className="p-3 font-semibold text-gray-600">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-10 text-gray-400">Carregando...</td></tr>
            ) : users.map(u => (
              <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-3 font-medium">{u.name}</td>
                <td className="p-3 text-gray-600">{u.email}</td>
                <td className="p-3">
                  <span className={`badge ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    {u.role === 'ADMIN' ? 'Administrador' : 'Comercial'}
                  </span>
                </td>
                <td className="p-3">
                  <span className={`badge ${u.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {u.active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(u)} className="btn-secondary btn-sm">Editar</button>
                    <button onClick={() => toggle(u)} className={`btn-sm ${u.active ? 'btn-danger' : 'btn-secondary'}`}>
                      {u.active ? 'Desativar' : 'Ativar'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar Usuário' : 'Novo Usuário'} size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">Nome *</label>
            <input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div>
            <label className="label">E-mail *</label>
            <input className="input" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
          </div>
          <div>
            <label className="label">{editing ? 'Nova Senha (deixe vazio para manter)' : 'Senha *'}</label>
            <input className="input" type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
          </div>
          <div>
            <label className="label">Perfil</label>
            <select className="input" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
              <option value="COMERCIAL">Comercial</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button className="btn-primary flex-1 justify-center" onClick={save} disabled={saving || !form.name || !form.email}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
            <button className="btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
