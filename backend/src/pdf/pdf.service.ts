import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PdfService {
  constructor(private prisma: PrismaService) {}

  private fmt(value: number): string {
    return (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  private fmtNum(value: number, decimals = 2): string {
    return (value || 0).toFixed(decimals).replace('.', ',');
  }

  async generateQuotePdf(id: string): Promise<Buffer> {
    const quote = await this.prisma.quote.findUnique({
      where: { id },
      include: {
        customer: true,
        user: { select: { name: true, email: true } },
        items: { include: { material: { include: { category: true } } } },
        expenses: { include: { expense: true } },
      },
    });

    if (!quote) throw new NotFoundException('Orçamento não encontrado');

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const PdfPrinter = require('pdfmake');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs = require('fs');

    // vfs_fonts.js usa `this.pdfMake.vfs = ...` — em serverless `this` pode ser undefined.
    // Executar via new Function com contexto explícito garante que `this` seja nosso objeto.
    let vfsData: Record<string, string> | undefined;
    try {
      const vfsFontsPath = require.resolve('pdfmake/build/vfs_fonts');
      const vfsCode = fs.readFileSync(vfsFontsPath, 'utf8');
      const ctx: any = {};
      // eslint-disable-next-line no-new-func
      new Function(vfsCode).call(ctx);
      vfsData = ctx.pdfMake?.vfs;
    } catch (_e1) {
      try {
        // fallback: require direto (funciona em alguns ambientes)
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const vfsFonts = require('pdfmake/build/vfs_fonts');
        vfsData = vfsFonts?.pdfMake?.vfs || (global as any).pdfMake?.vfs;
      } catch (_e2) { /* ignorar */ }
    }

    if (!vfsData) throw new Error('pdfmake vfs_fonts não carregou');

    const fonts = {
      Roboto: {
        normal: Buffer.from(vfsData['Roboto-Regular.ttf'], 'base64'),
        bold: Buffer.from(vfsData['Roboto-Medium.ttf'], 'base64'),
        italics: Buffer.from(vfsData['Roboto-Italic.ttf'], 'base64'),
        bolditalics: Buffer.from(vfsData['Roboto-MediumItalic.ttf'], 'base64'),
      },
    };

    const printer = new PdfPrinter(fonts);

    const customerName =
      quote.customer.type === 'JURIDICA'
        ? quote.customer.fantasyName || quote.customer.name
        : quote.customer.name;

    const customerDoc =
      quote.customer.type === 'JURIDICA'
        ? `CNPJ: ${quote.customer.cnpj || '-'}`
        : `CPF: ${quote.customer.cpf || '-'}`;

    const validity = new Date(quote.createdAt);
    validity.setDate(validity.getDate() + (quote.validity || 30));

    const profitLabel =
      quote.profitType === 'MULTIPLIER'
        ? `${quote.profitValue}x`
        : `${quote.profitValue}%`;

    const docDefinition: any = {
      pageSize: 'A4',
      pageMargins: [40, 60, 40, 60],
      defaultStyle: { font: 'Roboto', fontSize: 10 },
      styles: {
        header: { fontSize: 18, bold: true, color: '#1e3a5f' },
        subheader: { fontSize: 12, bold: true, color: '#1e3a5f' },
        tableHeader: {
          bold: true,
          fillColor: '#1e3a5f',
          color: 'white',
          fontSize: 9,
          alignment: 'center',
        },
        sectionTitle: {
          fontSize: 11,
          bold: true,
          color: '#1e3a5f',
          margin: [0, 10, 0, 4],
        },
        totalLabel: { fontSize: 13, bold: true, color: '#1e3a5f' },
        totalValue: { fontSize: 13, bold: true, color: '#1e3a5f', alignment: 'right' },
      },
      content: [
        // Cabeçalho
        {
          columns: [
            {
              stack: [
                { text: 'EMPRESA METÁLICA', style: 'header' },
                {
                  text: 'Estruturas Metálicas e Perfis de Alumínio',
                  fontSize: 10,
                  color: '#555',
                },
                {
                  text: 'Tel: (83) 99999-9999 | contato@empresa.com.br',
                  fontSize: 9,
                  color: '#777',
                  margin: [0, 2, 0, 0],
                },
              ],
            },
            {
              stack: [
                {
                  text: `ORÇAMENTO Nº ${String(quote.number).padStart(5, '0')}`,
                  style: 'subheader',
                  alignment: 'right',
                },
                {
                  text: `Data: ${new Date(quote.createdAt).toLocaleDateString('pt-BR')}`,
                  fontSize: 9,
                  alignment: 'right',
                  margin: [0, 4, 0, 0],
                },
                {
                  text: `Validade: ${validity.toLocaleDateString('pt-BR')}`,
                  fontSize: 9,
                  alignment: 'right',
                },
                {
                  text: quote.status,
                  fontSize: 9,
                  bold: true,
                  alignment: 'right',
                  color:
                    quote.status === 'APROVADO'
                      ? '#16a34a'
                      : quote.status === 'REPROVADO'
                      ? '#dc2626'
                      : '#d97706',
                  margin: [0, 2, 0, 0],
                },
              ],
            },
          ],
        },
        {
          canvas: [
            { type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 2, lineColor: '#1e3a5f' },
          ],
          margin: [0, 8, 0, 8],
        },

        // Dados do cliente
        { text: 'DADOS DO CLIENTE', style: 'sectionTitle' },
        {
          table: {
            widths: ['*', '*'],
            body: [
              [
                {
                  text: [{ text: 'Cliente: ', bold: true }, customerName],
                  border: [false, false, false, false],
                },
                {
                  text: [{ text: 'Documento: ', bold: true }, customerDoc],
                  border: [false, false, false, false],
                },
              ],
              [
                {
                  text: [{ text: 'Telefone: ', bold: true }, quote.customer.phone || '-'],
                  border: [false, false, false, false],
                },
                {
                  text: [{ text: 'E-mail: ', bold: true }, quote.customer.email || '-'],
                  border: [false, false, false, false],
                },
              ],
            ],
          },
          margin: [0, 0, 0, 10],
        },

        // Perfis Metálicos
        ...(quote.items.length > 0
          ? [
              { text: 'PERFIS METÁLICOS', style: 'sectionTitle' },
              {
                table: {
                  headerRows: 1,
                  widths: ['*', 42, 58, 58, 52, 68],
                  body: [
                    [
                      { text: 'Material', style: 'tableHeader' },
                      { text: 'Metros', style: 'tableHeader' },
                      { text: 'Peso (kg)', style: 'tableHeader' },
                      { text: 'c/ Desperd.', style: 'tableHeader' },
                      { text: 'R$/kg', style: 'tableHeader' },
                      { text: 'Total', style: 'tableHeader' },
                    ],
                    ...quote.items.map((item, i) => [
                      {
                        text: item.material.name,
                        fontSize: 9,
                        fillColor: i % 2 === 0 ? '#f8fafc' : 'white',
                      },
                      {
                        text: this.fmtNum(item.meters),
                        fontSize: 9,
                        alignment: 'center',
                        fillColor: i % 2 === 0 ? '#f8fafc' : 'white',
                      },
                      {
                        text: this.fmtNum(item.totalWeight, 3),
                        fontSize: 9,
                        alignment: 'center',
                        fillColor: i % 2 === 0 ? '#f8fafc' : 'white',
                      },
                      {
                        text: this.fmtNum(item.weightWithWaste, 3),
                        fontSize: 9,
                        alignment: 'center',
                        fillColor: i % 2 === 0 ? '#f8fafc' : 'white',
                      },
                      {
                        text: this.fmt(item.unitValue),
                        fontSize: 9,
                        alignment: 'right',
                        fillColor: i % 2 === 0 ? '#f8fafc' : 'white',
                      },
                      {
                        text: this.fmt(item.totalValue),
                        fontSize: 9,
                        alignment: 'right',
                        bold: true,
                        fillColor: i % 2 === 0 ? '#f8fafc' : 'white',
                      },
                    ]),
                  ],
                },
                layout: {
                  hLineWidth: () => 0.5,
                  vLineWidth: () => 0,
                  hLineColor: () => '#e2e8f0',
                },
                margin: [0, 0, 0, 4],
              },
              {
                text: `Desperdício: ${quote.wastePercent}%  |  Valor por kg: ${this.fmt(quote.pricePerKg)}`,
                fontSize: 8,
                color: '#888',
                alignment: 'right',
                margin: [0, 2, 0, 10],
              },
            ]
          : []),

        // Outras Despesas
        ...(quote.expenses.length > 0
          ? [
              { text: 'OUTRAS DESPESAS', style: 'sectionTitle' },
              {
                table: {
                  headerRows: 1,
                  widths: ['*', 120],
                  body: [
                    [
                      { text: 'Descrição', style: 'tableHeader' },
                      { text: 'Valor', style: 'tableHeader' },
                    ],
                    ...quote.expenses.map((exp, i) => [
                      {
                        text: exp.expense.name,
                        fontSize: 9,
                        fillColor: i % 2 === 0 ? '#f8fafc' : 'white',
                      },
                      {
                        text: this.fmt(exp.value),
                        fontSize: 9,
                        alignment: 'right',
                        fillColor: i % 2 === 0 ? '#f8fafc' : 'white',
                      },
                    ]),
                  ],
                },
                layout: {
                  hLineWidth: () => 0.5,
                  vLineWidth: () => 0,
                  hLineColor: () => '#e2e8f0',
                },
                margin: [0, 0, 0, 10],
              },
            ]
          : []),

        // Resumo financeiro
        {
          canvas: [
            { type: 'line', x1: 0, y1: 2, x2: 515, y2: 2, lineWidth: 1, lineColor: '#e2e8f0' },
          ],
          margin: [0, 0, 0, 8],
        },
        { text: 'RESUMO FINANCEIRO', style: 'sectionTitle' },
        {
          columns: [
            { text: '', width: '*' },
            {
              width: 260,
              table: {
                widths: ['*', 110],
                body: [
                  [
                    { text: 'Total de Materiais:', border: [false, false, false, false] },
                    {
                      text: this.fmt(quote.totalMaterials),
                      alignment: 'right',
                      border: [false, false, false, false],
                    },
                  ],
                  [
                    { text: 'Total de Despesas:', border: [false, false, false, false] },
                    {
                      text: this.fmt(quote.totalExpenses),
                      alignment: 'right',
                      border: [false, false, false, false],
                    },
                  ],
                  [
                    { text: 'Subtotal:', border: [false, false, false, false] },
                    {
                      text: this.fmt(quote.subtotal),
                      alignment: 'right',
                      border: [false, false, false, false],
                    },
                  ],
                  [
                    {
                      text: `Margem (${profitLabel}):`,
                      border: [false, false, false, false],
                    },
                    {
                      text: this.fmt(quote.profitAmount),
                      alignment: 'right',
                      border: [false, false, false, false],
                    },
                  ],
                  [
                    {
                      text: 'VALOR TOTAL:',
                      style: 'totalLabel',
                      border: [false, true, false, false],
                    },
                    {
                      text: this.fmt(quote.total),
                      style: 'totalValue',
                      border: [false, true, false, false],
                    },
                  ],
                ],
              },
            },
          ],
        },

        // Observações
        ...(quote.observations
          ? [
              { text: 'OBSERVAÇÕES', style: 'sectionTitle', margin: [0, 16, 0, 4] as any },
              { text: quote.observations, fontSize: 9, color: '#555' },
            ]
          : []),

        // Assinaturas
        { text: '', margin: [0, 40, 0, 0] },
        {
          columns: [
            {
              stack: [
                {
                  canvas: [
                    {
                      type: 'line',
                      x1: 0,
                      y1: 0,
                      x2: 200,
                      y2: 0,
                      lineWidth: 1,
                      lineColor: '#aaa',
                    },
                  ],
                },
                {
                  text: customerName,
                  fontSize: 9,
                  alignment: 'center',
                  margin: [0, 4, 0, 0],
                },
                {
                  text: 'Assinatura do Cliente',
                  fontSize: 8,
                  color: '#777',
                  alignment: 'center',
                },
              ],
              width: 220,
            },
            { text: '', width: '*' },
            {
              stack: [
                {
                  canvas: [
                    {
                      type: 'line',
                      x1: 0,
                      y1: 0,
                      x2: 200,
                      y2: 0,
                      lineWidth: 1,
                      lineColor: '#aaa',
                    },
                  ],
                },
                {
                  text: 'Empresa Metálica',
                  fontSize: 9,
                  alignment: 'center',
                  margin: [0, 4, 0, 0],
                },
                {
                  text: 'Responsável Comercial',
                  fontSize: 8,
                  color: '#777',
                  alignment: 'center',
                },
              ],
              width: 220,
            },
          ],
        },
      ],

      footer: (currentPage: number, pageCount: number) => ({
        columns: [
          {
            text: 'Este orçamento tem validade conforme especificado acima.',
            fontSize: 7,
            color: '#aaa',
            margin: [40, 0, 0, 0],
          },
          {
            text: `Página ${currentPage} de ${pageCount}`,
            fontSize: 7,
            color: '#aaa',
            alignment: 'right',
            margin: [0, 0, 40, 0],
          },
        ],
      }),
    };

    return new Promise((resolve, reject) => {
      try {
        const doc = printer.createPdfKitDocument(docDefinition);
        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}
