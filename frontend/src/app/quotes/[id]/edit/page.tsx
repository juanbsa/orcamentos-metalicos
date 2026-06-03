'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Layout from '@/components/Layout';
import QuoteForm from '../../_components/QuoteForm';
import { api } from '@/lib/api';

export default function EditQuotePage() {
  const { id } = useParams();
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/quotes/${id}`).then(r => { setQuote(r.data); setLoading(false); });
  }, [id]);

  if (loading) return <Layout><div className="text-center py-10 text-gray-400">Carregando...</div></Layout>;

  return (
    <Layout>
      <QuoteForm initialQuote={quote} />
    </Layout>
  );
}
