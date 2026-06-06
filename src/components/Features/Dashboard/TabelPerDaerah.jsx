import { useMemo } from 'react';
import { useData } from '@/hooks/useData';

export default function TabelPerDaerah({ salurData }) {
  const { refData } = useData();
  
  const daerahMap = useMemo(() => {
    const map = new Map();
    salurData.forEach(s => {
      const daerah = s['DAERAH'];
      if (!daerah) return;
      if (!map.has(daerah)) {
        map.set(daerah, { transaksi: 0, totalDana: 0, penerima: new Set() });
      }
      const d = map.get(daerah);
      d.transaksi++;
      d.totalDana += Number(s['JUMLAH PENERIMAAN']) || 0;
      d.penerima.add(s['ID PM']);
    });
    return map;
  }, [salurData]);

  const data = refData.daerah.map(daerah => {
    const val = daerahMap.get(daerah);
    return {
      daerah,
      jumlahPenerima: val ? val.penerima.size : 0,
      frekuensiTransaksi: val ? val.transaksi : 0,
      totalDana: val ? val.totalDana : 0
    };
  }).filter(item => item.jumlahPenerima > 0 || item.frekuensiTransaksi > 0);

  return (
    <div className="bg-white rounded-lg shadow p-4 overflow-x-auto">
      <h2 className="text-lg font-bold mb-3">Rangkuman per Daerah</h2>
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">Daerah</th>
            <th className="p-2 text-left">Jumlah Penerima</th>
            <th className="p-2 text-left">Frekuensi Transaksi</th>
            <th className="p-2 text-left">Total Dana</th>
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            <tr key={row.daerah} className="border-b">
              <td className="p-2 font-medium whitespace-nowrap">{row.daerah}</td>
              <td className="p-2 whitespace-nowrap">{row.jumlahPenerima}</td>
              <td className="p-2 whitespace-nowrap">{row.frekuensiTransaksi}</td>
              <td className="p-2 whitespace-nowrap">Rp {row.totalDana.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}