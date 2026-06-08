import { Menu, RefreshCw } from 'lucide-react';
import { useData } from '../../hooks/useData';
import { useState } from 'react';

export default function Header({ toggleSidebar }) {
  const { refreshData, loading } = useData();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  return (
    <header className="bg-white shadow-sm px-4 py-3 flex justify-between items-center">
      <button onClick={toggleSidebar} className="md:hidden text-gray-600 hover:text-teal-600">
        <Menu size={24} />
      </button>
      <button
        onClick={handleRefresh}
        disabled={refreshing || loading}
        className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-md text-sm transition disabled:opacity-50"
        title="Refresh data dari server"
      >
        <RefreshCw size={16} className={refreshing || loading ? 'animate-spin' : ''} />
        <span className="hidden sm:inline">{refreshing || loading ? 'Memuat...' : 'Refresh Data'}</span>
      </button>
    </header>
  );
}