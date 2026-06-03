'use client';

interface Props {
  page: number;
  pages: number;
  total: number;
  onChange: (p: number) => void;
}

export default function Pagination({ page, pages, total, onChange }: Props) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
      <span>{total} registro{total !== 1 ? 's' : ''}</span>
      <div className="flex items-center gap-1">
        <button onClick={() => onChange(page - 1)} disabled={page === 1} className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-40">‹</button>
        {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
          const p = i + 1;
          return (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={`px-3 py-1 rounded ${p === page ? 'bg-primary-700 text-white' : 'hover:bg-gray-100'}`}
            >{p}</button>
          );
        })}
        <button onClick={() => onChange(page + 1)} disabled={page === pages} className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-40">›</button>
      </div>
    </div>
  );
}
