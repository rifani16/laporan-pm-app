import { useMemo } from 'react';
import { useData } from '@/hooks/useData';

export default function TabelPerProgram({ salurData }) {
  const { refData } = useData();
  
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

  const data = refData.program.map(program => {
    const val = progMap.get(program);
    return {
      program,
      jumlahPenerima: val ? val.jumlahPenerima.size : 0,
      totalDana: val ? val.totalDana : 0
    };
  }).filter(item => item.jumlahPenerima > 0 || item.totalDana > 0);

  return (
    <div className="bg-white rounded-lg shadow p-4 overflow-x-auto">
      <h2 className="text-lg font-bold mb-3">Rangkuman per Program</h2>
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left whitespace-nowrap">Program</th>
            <th className="p-2 text-left whitespace-nowrap">Jumlah Penerima</th>
            <th className="p-2 text-left whitespace-nowrap">Total Dana</th>
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            <tr key={row.program} className="border-b">
              <td className="p-2 whitespace-nowrap">{row.program}</td>
              <td className="p-2 whitespace-nowrap">{row.jumlahPenerima}</td>
              <td className="p-2 whitespace-nowrap">Rp {row.totalDana.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}