import { useMemo, useState } from 'react';
import { useData } from '@/hooks/useData';
import SortIcon from '@/components/Common/SortIcon';

export default function TabelPerProgram({ salurData }) {
  const { refData } = useData();
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'desc' });
  const handleSort = (key) => {
    setSortConfig(prev => prev.key === key ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'desc' });
  };
  const progMap = useMemo(() => {
    const map = new Map();
    salurData.forEach(s => {
      const prog = s['PROGRAM'];
      if (!prog) return;
      if (!map.has(prog)) map.set(prog, { jumlahPenerima: new Set(), totalDana: 0 });
      const p = map.get(prog);
      p.jumlahPenerima.add(s['ID PM']);
      p.totalDana += Number(s['JUMLAH PENERIMAAN']) || 0;
    });
    return map;
  }, [salurData]);

  const data = useMemo(() => {
    const rows = refData.program.map(program => {
      const val = progMap.get(program);
      return { program, jumlahPenerima: val ? val.jumlahPenerima.size : 0, totalDana: val ? val.totalDana : 0 };
    }).filter(item => item.jumlahPenerima > 0 || item.totalDana > 0);
    if (!sortConfig.key) return rows;
    return [...rows].sort((a, b) => {
      const aVal = a[sortConfig.key]; const bVal = b[sortConfig.key];
      if (aVal === bVal) return a.program.localeCompare(b.program, 'id-ID');
      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [refData.program, progMap, sortConfig]);

  return (
    <div className="bg-white rounded-lg shadow p-4 overflow-x-auto">
      <h2 className="text-lg font-bold mb-3">Rangkuman per Program</h2>
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left whitespace-nowrap">Program</th>
            <th className="p-2 text-right whitespace-nowrap"><button type="button" onClick={() => handleSort('jumlahPenerima')} className="inline-flex items-center gap-1 hover:text-teal-700" aria-label="Urutkan berdasarkan Jumlah Penerima">Jumlah Penerima <SortIcon active={sortConfig.key === 'jumlahPenerima'} direction={sortConfig.direction} /></button></th>
            <th className="p-2 text-right whitespace-nowrap"><button type="button" onClick={() => handleSort('totalDana')} className="inline-flex items-center gap-1 hover:text-teal-700" aria-label="Urutkan berdasarkan Total Dana">Total Dana <SortIcon active={sortConfig.key === 'totalDana'} direction={sortConfig.direction} /></button></th>
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            <tr key={row.program} className="border-b">
              <td className="p-2 whitespace-nowrap">{row.program}</td>
              <td className="numeric p-2 text-right whitespace-nowrap">{row.jumlahPenerima.toLocaleString('id-ID')}</td>
              <td className="numeric p-2 text-right whitespace-nowrap">Rp {row.totalDana.toLocaleString('id-ID')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
