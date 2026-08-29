import { Menu, RefreshCw } from 'lucide-react';
import { useData } from '../../hooks/useData';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/master': 'Daftar Penerima Manfaat',
  '/salur': 'Input Penyaluran',
  '/program-penerima': 'Penerima per Program'
};

export default function Header({ toggleSidebar }) {
  const { refreshData, loading, error } = useData();
  const { pathname } = useLocation();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await refreshData();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <>
    <header className="flex items-center justify-between bg-white px-4 py-3 shadow-sm">
      <button onClick={toggleSidebar} aria-label="Buka menu navigasi" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 hover:text-teal-600 md:hidden">
        <Menu size={24} />
      </button>
      <p className="hidden font-semibold text-gray-800 md:block">{PAGE_TITLES[pathname] || 'PM System'}</p>
      <button
        onClick={handleRefresh}
        disabled={refreshing || loading}
        className="flex min-h-11 items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
        title="Refresh data dari server"
      >
        <RefreshCw size={16} className={refreshing || loading ? 'animate-spin' : ''} />
        <span className="hidden sm:inline">{refreshing || loading ? 'Memuat...' : 'Refresh Data'}</span>
      </button>
    </header>
    {error && (
      <div role="alert" className="flex flex-wrap items-center justify-between gap-3 border-t border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
        <span>Gagal memuat data: {error.message || 'Periksa koneksi lalu coba lagi.'}</span>
        <button onClick={handleRefresh} disabled={refreshing} className="min-h-11 rounded-lg border border-red-300 px-3 py-2 font-medium hover:bg-red-100 disabled:opacity-50">
          Coba lagi
        </button>
      </div>
    )}
    </>
  );
}
