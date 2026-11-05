import { useId } from 'react';

const inputClass = 'min-h-11 w-full rounded-lg border bg-white px-3 py-2 text-sm';

export default function DateRangeFilter({ dari, sampai, onChange }) {
  const id = useId();
  return (
    <div className="flex flex-1 flex-wrap gap-2 sm:flex-nowrap">
      <div className="min-w-36 flex-1">
        <label htmlFor={`${id}-dari`} className="mb-1.5 block text-sm font-medium">Tanggal dari</label>
        <input id={`${id}-dari`} type="date" value={dari} max={sampai || undefined} onChange={e => onChange({ dari: e.target.value, sampai })} className={inputClass} />
      </div>
      <div className="min-w-36 flex-1">
        <label htmlFor={`${id}-sampai`} className="mb-1.5 block text-sm font-medium">Sampai</label>
        <input id={`${id}-sampai`} type="date" value={sampai} min={dari || undefined} onChange={e => onChange({ dari, sampai: e.target.value })} className={inputClass} />
      </div>
    </div>
  );
}
