import { useState, useMemo } from 'react';
import { useData } from '../hooks/useData';
import { useAuth } from '../hooks/useAuth';
import SummaryMetrics from '../components/Features/Dashboard/SummaryMetrics';
import TabelPerDaerah from '../components/Features/Dashboard/TabelPerDaerah';
import TabelPerProgram from '../components/Features/Dashboard/TabelPerProgram';
import MatriksSilang from '../components/Features/Dashboard/MatriksSilang';

export default function DashboardPage() {
  const { salurData, masterData, loading, refData } = useData();
  const { isSuperAdmin, userDaerah } = useAuth();

  const [filterDaerah, setFilterDaerah] = useState('semua');
  const [filterProgram, setFilterProgram] = useState('semua');

  const activeFilterDaerah = !isSuperAdmin && userDaerah ? userDaerah : filterDaerah;

  const daerahList = isSuperAdmin
    ? ['semua', ...(refData.daerah || [])]
    : [userDaerah || 'semua'];

  const programList = ['semua', ...(refData.program || [])];

  const filteredSalur = useMemo(() => {
    return salurData.filter((s) => {
      const matchDaerah =
        activeFilterDaerah === 'semua' || s['DAERAH'] === activeFilterDaerah;
      const matchProgram =
        filterProgram === 'semua' || s['PROGRAM'] === filterProgram;
      return matchDaerah && matchProgram;
    });
  }, [salurData, activeFilterDaerah, filterProgram]);

  const resetFilters = () => {
    setFilterDaerah('semua');
    setFilterProgram('semua');
  };

  if (loading && salurData.length === 0 && masterData.length === 0) {
    return (
      <div className="text-center py-10" role="status">
        Memuat dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header dan filter responsif */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard Rangkuman</h1>
          {!isSuperAdmin && userDaerah && (
            <p className="text-xs text-teal-700 font-medium mt-0.5">
              Wilayah Operasional: {userDaerah}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <select
            aria-label="Filter dashboard berdasarkan daerah"
            className="min-h-11 rounded-lg border bg-white px-3 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-600"
            value={activeFilterDaerah}
            onChange={(e) => setFilterDaerah(e.target.value)}
            disabled={!isSuperAdmin}
          >
            {daerahList.map((d) => (
              <option key={d} value={d}>
                {d === 'semua' ? 'Semua Daerah' : d}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter dashboard berdasarkan program"
            className="min-h-11 rounded-lg border bg-white px-3 py-2 text-sm"
            value={filterProgram}
            onChange={(e) => setFilterProgram(e.target.value)}
          >
            {programList.map((p) => (
              <option key={p} value={p}>
                {p === 'semua' ? 'Semua Program' : p}
              </option>
            ))}
          </select>
          {((isSuperAdmin && activeFilterDaerah !== 'semua') || filterProgram !== 'semua') && (
            <button
              onClick={resetFilters}
              className="min-h-11 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Reset
            </button>
          )}
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
