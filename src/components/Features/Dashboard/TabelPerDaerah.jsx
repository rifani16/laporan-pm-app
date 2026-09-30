import { useMemo, useState } from 'react';
import { useData } from '@/hooks/useData';
import SortIcon from '@/components/Common/SortIcon';

export default function TabelPerDaerah({ salurData }) {
  const { refData } = useData();
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'desc' });
  const handleSort = (key) => {
    setSortConfig(prev => prev.key === key ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'desc' });
  };
  const daerahMap = useMemo(() => {
    const map = new Map();
    salurData.forEach(s => {
      const daerah = s['DAERAH'];
      if (!daerah) return;
      if (!map.has(daerah)) map.set(daerah, { transaksi: 0, totalDana: 0, penerima: new Set() });
      const d = map.get(daerah);
      d.transaksi++;
      d.totalDana += Number(s['JUMLAH PENERIMAAN']) || 0;
      d.penerima.add(s['ID PM']);
    });
    return map;
  }, [salurData]);
  const data = useMemo(() => {
    const rows = refData.daerah.map(daerah => {
      const val = daerahMap.get(daerah);
      return { daerah, jumlahPenerima: val ? val.penerima.size : 0, frekuensiTransaksi: val ? val.transaksi : 0, totalDana: val ? val.totalDana : 0 };
    }).filter(item => item.jumlahPenerima > 0 || item.frekuensiTransaksi > 0);
    if (!sortConfig.key) return rows;
    return [...rows].sort((a, b) => {
      const aVal = a[sortConfig.key]; const bVal = b[sortConfig.key];
      if (aVal === bVal) return a.daerah.localeCompare(b.daerah, 'id-ID');
      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [refData.daerah, daerahMap, sortConfig]);
  return (
    <div className="bg-white rounded-lg shadow p-4 overflow-x-auto">
      <h2 className="text-lg font-bold mb-3">Rangkuman per Daerah</h2>
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">Daerah</th>
            <th className="p-2 text-right"><button type="button" onClick={() => handleSort('jumlahPenerima')} className="inline-flex items-center gap-1 hover:text-teal-700" aria-label="Urutkan berdasarkan Jumlah Penerima">Jumlah Penerima <SortIcon active={sortConfig.key === 'jumlahPenerima'} direction={sortConfig.direction} /></button></th>
            <th className="p-2 text-right"><button type="button" onClick={() => handleSort('frekuensiTransaksi')} className="inline-flex items-center gap-1 hover:text-teal-700" aria-label="Urutkan berdasarkan Frekuensi">Frekuensi <SortIcon active={sortConfig.key === 'frekuensiTransaksi'} direction={sortConfig.direction} /></button></th>
            <th className="p-2 text-right"><button type="button" onClick={() => handleSort('totalDana')} className="inline-flex items-center gap-1 hover:text-teal-700" aria-label="Urutkan berdasarkan Total Dana">Total Dana <SortIcon active={sortConfig.key === 'totalDana'} direction={sortConfig.direction} /></button></th>
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            <tr key={row.daerah} className="border-b">
              <td className="p-2 font-medium whitespace-nowrap">{row.daerah}</td>
              <td className="numeric p-2 text-right whitespace-nowrap">{row.jumlahPenerima.toLocaleString('id-ID')}</td>
              <td className="numeric p-2 text-right whitespace-nowrap">{row.frekuensiTransaksi.toLocaleString('id-ID')}</td>
              <td className="numeric p-2 text-right whitespace-nowrap">Rp {row.totalDana.toLocaleString('id-ID')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
