import { useMemo } from 'react';
import { useData } from '@/hooks/useData';

export default function MatriksSilang({ salurData }) {
  const { refData } = useData();

  const matriks = useMemo(() => {
    const m = {};
    salurData.forEach(s => {
      const daerah = s['DAERAH'];
      const prog = s['PROGRAM'];
      if (!daerah || !prog) return;
      if (!m[daerah]) m[daerah] = {};
      if (!m[daerah][prog]) m[daerah][prog] = 0;
      m[daerah][prog] += Number(s['JUMLAH PENERIMAAN']) || 0;
    });
    return m;
  }, [salurData]);

  // Filter daerah dan program yang memiliki data
  const daerahList = refData.daerah.filter(daerah => {
    const row = matriks[daerah];
    if (!row) return false;
    return Object.values(row).some(value => value > 0);
  });

  const programList = refData.program.filter(program => {
    return daerahList.some(daerah => (matriks[daerah]?.[program] || 0) > 0);
  });

  if (daerahList.length === 0 || programList.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-bold mb-3">Matriks Silang (Daerah vs Program) - Total Dana</h2>
        <p className="text-gray-500 text-center py-4">Belum ada data penyaluran untuk ditampilkan.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 overflow-x-auto">
      <h2 className="text-lg font-bold mb-3">Matriks Silang (Daerah vs Program) - Total Dana</h2>
      <table className="min-w-full text-sm border">
        <thead>
          <tr>
            <th className="p-2 border whitespace-nowrap">Daerah / Program</th>
            {programList.map(p => (
              <th key={p} className="p-2 border whitespace-nowrap">{p}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {daerahList.map(d => (
            <tr key={d}>
              <td className="p-2 border font-medium whitespace-nowrap">{d}</td>
              {programList.map(p => {
                const value = matriks[d]?.[p] || 0;
                return (
                  <td key={p} className="p-2 border text-right whitespace-nowrap">
                    {value > 0 ? `Rp ${value.toLocaleString()}` : '-'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}