'use client';
import { Suspense } from 'react';
import QuoteForm from '../_components/QuoteForm';
import Layout from '@/components/Layout';

export default function NewQuotePage() {
  return (
    <Layout>
      <Suspense fallback={<div className="text-center py-10 text-gray-400">Carregando...</div>}>
        <QuoteForm />
      </Suspense>
    </Layout>
  );
}
