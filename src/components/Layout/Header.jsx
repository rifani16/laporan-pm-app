import { Menu, RefreshCw } from 'lucide-react';
import { useData } from '@/hooks/useData';

export default function Header({ toggleSidebar }) {
  const { refreshData } = useData();

  return (
    <header className="bg-white shadow-sm px-4 py-3 flex justify-between items-center">
      <button onClick={toggleSidebar} className="md:hidden text-gray-600 hover:text-teal-600">
        <Menu size={24} />
      </button>
      <div className="flex items-center gap-3">
        <button
          onClick={refreshData}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-md text-sm transition"
          title="Refresh data dari server"
        >
          <RefreshCw size={16} />
          <span className="hidden sm:inline">Refresh Data</span>
        </button>
      </div>
    </header>
  );
}