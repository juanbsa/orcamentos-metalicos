'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api, fmtCurrency, STATUS_LABELS } from '@/lib/api';

export default function QuotePrintPage() {
  const { id } = useParams();
  const [quote, setQuote] = useState<any>(null);

  useEffect(() => {
    api.get(`/quotes/${id}`).then(r => {
      setQuote(r.data);
      setTimeout(() => window.print(), 600);
    });
  }, [id]);

  if (!quote) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Arial, sans-serif' }}>
      <p>Carregando orçamento...</p>
    </div>
  );

  const customerName = quote.customer?.type === 'JURIDICA'
    ? quote.customer?.fantasyName || quote.customer?.name
    : quote.customer?.name;

  const customerDoc = quote.customer?.type === 'JURIDICA'
    ? `CNPJ: ${quote.customer?.cnpj || '-'}`
    : `CPF: ${quote.customer?.cpf || '-'}`;

  const validity = new Date(quote.createdAt);
  validity.setDate(validity.getDate() + (quote.validity || 30));

  const profitLabel = quote.profitType === 'MULTIPLIER'
    ? `${quote.profitValue}x`
    : `${quote.profitValue}%`;

  const primary = '#1e3a5f';

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; font-size: 10pt; color: #333; background: white; }
        .page { max-width: 210mm; margin: 0 auto; padding: 15mm 15mm 10mm; }
        .print-btn {
          position: fixed; top: 16px; right: 16px;
          background: ${primary}; color: white; border: none;
          padding: 10px 20px; cursor: pointer; border-radius: 6px;
          font-size: 14px; font-family: Arial, sans-serif; z-index: 9999;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
        .company-name { font-size: 18pt; font-weight: bold; color: ${primary}; }
        .company-sub { font-size: 10pt; color: #555; margin-top: 2px; }
        .company-contact { font-size: 9pt; color: #777; margin-top: 2px; }
        .quote-info { text-align: right; }
        .quote-num { font-size: 13pt; font-weight: bold; color: ${primary}; }
        .quote-meta { font-size: 9pt; color: #444; margin-top: 3px; line-height: 1.5; }
        .divider { border: none; border-top: 2px solid ${primary}; margin: 10px 0 14px; }
        .section-title { font-size: 11pt; font-weight: bold; color: ${primary}; margin: 14px 0 6px; text-transform: uppercase; }
        .customer-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; font-size: 9pt; margin-bottom: 14px; }
        table { width: 100%; border-collapse: collapse; font-size: 8pt; }
        th { background: ${primary}; color: white; padding: 5px 6px; text-align: right; font-weight: bold; }
        th:first-child { text-align: left; }
        td { padding: 4px 6px; text-align: right; border-bottom: 0.5px solid #e2e8f0; }
        td:first-child { text-align: left; }
        tr:nth-child(even) td { background: #f8fafc; }
        .note { font-size: 8pt; color: #888; text-align: right; margin-top: 3px; margin-bottom: 10px; }
        .thin-divider { border: none; border-top: 1px solid #e2e8f0; margin: 12px 0; }
        .summary { margin-left: auto; width: 270px; margin-top: 8px; }
        .summary-row { display: flex; justify-content: space-between; font-size: 9pt; padding: 3px 0; }
        .summary-total { display: flex; justify-content: space-between; font-size: 13pt; font-weight: bold; color: ${primary}; border-top: 2px solid ${primary}; padding-top: 5px; margin-top: 4px; }
        .signatures { display: flex; justify-content: space-between; margin-top: 50px; }
        .sig { width: 45%; text-align: center; }
        .sig-line { border-top: 1px solid #aaa; padding-top: 6px; font-size: 9pt; }
        .sig-label { font-size: 8pt; color: #777; margin-top: 2px; }
        .footer-txt { font-size: 7pt; color: #aaa; margin-top: 24px; }
        @media print {
          .print-btn { display: none !important; }
          .page { padding: 10mm 10mm 8mm; }
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        }
      `}</style>

      <button className="print-btn" onClick={() => window.print()}>
        🖨️ Imprimir / Salvar PDF
      </button>

      <div className="page">
        {/* Header */}
        <div className="header">
          <div>
            <div className="company-name">EMPRESA METÁLICA</div>
            <div className="company-sub">Estruturas Metálicas e Perfis de Alumínio</div>
            <div className="company-contact">Tel: (83) 99999-9999 | contato@empresa.com.br</div>
          </div>
          <div className="quote-info">
            <div className="quote-num">ORÇAMENTO Nº {String(quote.number).padStart(5, '0')}</div>
            <div className="quote-meta">
              Data: {new Date(quote.createdAt).toLocaleDateString('pt-BR')}<br />
              Validade: {validity.toLocaleDateString('pt-BR')}<br />
              <span style={{
                color: quote.status === 'APROVADO' ? '#16a34a'
                  : quote.status === 'REPROVADO' ? '#dc2626' : '#d97706',
                fontWeight: 'bold',
              }}>
                {STATUS_LABELS[quote.status] || quote.status}
              </span>
            </div>
          </div>
        </div>

        <hr className="divider" />

        {/* Customer */}
        <div className="section-title">Dados do Cliente</div>
        <div className="customer-grid">
          <div><strong>Cliente:</strong> {customerName}</div>
          <div><strong>Documento:</strong> {customerDoc}</div>
          <div><strong>Telefone:</strong> {quote.customer?.phone || '-'}</div>
          <div><strong>E-mail:</strong> {quote.customer?.email || '-'}</div>
        </div>

        {/* Items */}
        {quote.items?.length > 0 && (
          <>
            <div className="section-title">Perfis Metálicos</div>
            <table>
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Metros</th>
                  <th>Peso (kg)</th>
                  <th>c/ Desperd.</th>
                  <th>R$/kg</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {quote.items.map((item: any) => (
                  <tr key={item.id}>
                    <td>{item.material?.name}</td>
                    <td>{item.meters.toFixed(2)}</td>
                    <td>{item.totalWeight.toFixed(3)}</td>
                    <td>{item.weightWithWaste.toFixed(3)}</td>
                    <td>{fmtCurrency(item.unitValue)}</td>
                    <td><strong>{fmtCurrency(item.totalValue)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="note">
              Desperdício: {quote.wastePercent}% | R$/kg: {fmtCurrency(quote.pricePerKg)}
            </div>
          </>
        )}

        {/* Expenses */}
        {quote.expenses?.length > 0 && (
          <>
            <div className="section-title">Outras Despesas</div>
            <table style={{ marginBottom: '10px' }}>
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th style={{ width: '140px' }}>Valor</th>
                </tr>
              </thead>
              <tbody>
                {quote.expenses.map((exp: any) => (
                  <tr key={exp.id}>
                    <td>{exp.expense?.name}</td>
                    <td>{fmtCurrency(exp.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* Financial summary */}
        <hr className="thin-divider" />
        <div className="section-title">Resumo Financeiro</div>
        <div className="summary">
          <div className="summary-row"><span>Total de Materiais:</span><span>{fmtCurrency(quote.totalMaterials)}</span></div>
          <div className="summary-row"><span>Total de Despesas:</span><span>{fmtCurrency(quote.totalExpenses)}</span></div>
          <div className="summary-row"><span>Subtotal:</span><span>{fmtCurrency(quote.subtotal)}</span></div>
          <div className="summary-row"><span>Margem ({profitLabel}):</span><span>{fmtCurrency(quote.profitAmount)}</span></div>
          <div className="summary-total"><span>VALOR TOTAL:</span><span>{fmtCurrency(quote.total)}</span></div>
        </div>

        {/* Observations */}
        {quote.observations && (
          <>
            <div className="section-title" style={{ marginTop: '16px' }}>Observações</div>
            <p style={{ fontSize: '9pt', color: '#555', whiteSpace: 'pre-wrap' }}>{quote.observations}</p>
          </>
        )}

        {/* Signatures */}
        <div className="signatures">
          <div className="sig">
            <div className="sig-line">{customerName}</div>
            <div className="sig-label">Assinatura do Cliente</div>
          </div>
          <div className="sig">
            <div className="sig-line">Empresa Metálica</div>
            <div className="sig-label">Responsável Comercial</div>
          </div>
        </div>

        <div className="footer-txt">
          Este orçamento tem validade conforme especificado acima.
        </div>
      </div>
    </>
  );
}
