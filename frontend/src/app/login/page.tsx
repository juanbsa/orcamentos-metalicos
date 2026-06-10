'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import toast from 'react-hot-toast';
import Image from 'next/image';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
    } catch {
      toast.error('Email ou senha inválidos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 to-gray-800">
      <div className="w-full max-w-md px-4">
        <div className="flex justify-center mb-8">
          <Image
            src="/logo.png"
            alt="Grupo Araújo"
            width={220}
            height={80}
            style={{ objectFit: 'contain' }}
            priority
          />
        </div>

        <div className="card p-8">
          <div className="text-center mb-7">
            <h1 className="text-xl font-bold text-gray-900">Bem-vindo</h1>
            <p className="text-gray-500 text-sm mt-1">Faça login para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">E-mail</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>
            <div>
              <label className="label">Senha</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <button className="btn-primary w-full justify-center py-2.5" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
