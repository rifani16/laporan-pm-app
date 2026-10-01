import { Menu, RefreshCw, LogOut, Shield } from 'lucide-react';
import { useData } from '../../hooks/useData';
import { useAuth } from '../../hooks/useAuth';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/master': 'Daftar Penerima Manfaat',
  '/salur': 'Input Penyaluran',
  '/program-penerima': 'Penerima per Program',
  '/program': 'Manajemen Program'
};

export default function Header({ toggleSidebar }) {
  const { refreshData, loading, error } = useData();
  const { user, logout, isSuperAdmin } = useAuth();
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
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            aria-label="Buka menu navigasi"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 hover:text-teal-600 md:hidden"
          >
            <Menu size={24} />
          </button>
          <p className="hidden font-bold text-gray-800 md:block">
            {PAGE_TITLES[pathname] || 'PM System'}
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {user && (
            <div className="hidden sm:flex items-center gap-2 rounded-lg bg-gray-50 border border-gray-200 px-3 py-1.5 text-xs">
              <span className="font-semibold text-gray-700 max-w-[120px] truncate">
                {user.nama || user.username}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-medium ${
                  isSuperAdmin
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-teal-100 text-teal-800'
                }`}
              >
                <Shield size={11} />
                {isSuperAdmin ? 'Pusat' : user.daerah || 'Daerah'}
              </span>
            </div>
          )}

          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="flex min-h-11 items-center gap-2 rounded-lg bg-teal-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-teal-700 active:scale-[0.98] disabled:opacity-50"
            title="Refresh data dari server"
          >
            <RefreshCw
              size={16}
              className={refreshing || loading ? 'animate-spin' : ''}
            />
            <span className="hidden sm:inline">
              {refreshing || loading ? 'Memuat...' : 'Refresh'}
            </span>
          </button>

          {user && (
            <button
              onClick={logout}
              title="Keluar (Logout)"
              aria-label="Keluar dari sistem"
              className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 active:scale-[0.98] transition-colors"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 border-t border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
        >
          <span>
            Gagal memuat data: {error.message || 'Periksa koneksi lalu coba lagi.'}
          </span>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="min-h-11 rounded-lg border border-red-300 px-3 py-2 font-medium hover:bg-red-100 disabled:opacity-50"
          >
            Coba lagi
          </button>
        </div>
      )}
    </>
  );
}
