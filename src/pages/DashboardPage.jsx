import { useState, useMemo } from 'react';
import { useData } from '../hooks/useData';
import SummaryMetrics from '../components/Features/Dashboard/SummaryMetrics';
import TabelPerDaerah from '../components/Features/Dashboard/TabelPerDaerah';
import TabelPerProgram from '../components/Features/Dashboard/TabelPerProgram';
import MatriksSilang from '../components/Features/Dashboard/MatriksSilang';

export default function DashboardPage() {
  const { salurData, masterData, loading, refData } = useData();
  const [filterDaerah, setFilterDaerah] = useState('semua');
  const [filterProgram, setFilterProgram] = useState('semua');

  const daerahList = ['semua', ...(refData.daerah || [])];
  const programList = ['semua', ...(refData.program || [])];

  const filteredSalur = useMemo(() => {
    return salurData.filter(s => {
      const matchDaerah = filterDaerah === 'semua' || s['DAERAH'] === filterDaerah;
      const matchProgram = filterProgram === 'semua' || s['PROGRAM'] === filterProgram;
      return matchDaerah && matchProgram;
    });
  }, [salurData, filterDaerah, filterProgram]);

  if (loading) return <div className="text-center py-10">Memuat dashboard...</div>;

  return (
    <div className="space-y-6">
      {/* Header dan filter responsif */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard Rangkuman</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            className="border rounded px-3 py-1 text-sm bg-white"
            value={filterDaerah}
            onChange={e => setFilterDaerah(e.target.value)}
          >
            {daerahList.map(d => (
              <option key={d} value={d}>{d === 'semua' ? 'Semua Daerah' : d}</option>
            ))}
          </select>
          <select
            className="border rounded px-3 py-1 text-sm bg-white"
            value={filterProgram}
            onChange={e => setFilterProgram(e.target.value)}
          >
            {programList.map(p => (
              <option key={p} value={p}>{p === 'semua' ? 'Semua Program' : p}</option>
            ))}
          </select>
        </div>
      </div>

      <SummaryMetrics salurData={filteredSalur} masterData={masterData} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TabelPerDaerah salurData={filteredSalur} />
        <TabelPerProgram salurData={filteredSalur} />
      </div>
      <MatriksSilang salurData={filteredSalur} />
    </div>
  );
}