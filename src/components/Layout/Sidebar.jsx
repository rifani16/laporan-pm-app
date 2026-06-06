import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, PlusCircle, ListFilter } from 'lucide-react';
import { X } from 'lucide-react';

const isAuthFeatureEnabled = false;

export default function Sidebar({ isMobile = false, onClose }) {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/master', label: 'Daftar PM', icon: Users },
    { to: '/salur', label: 'Input Penyaluran', icon: PlusCircle },
    { to: '/program-penerima', label: 'Penerima per Program', icon: ListFilter }
  ];

  return (
    <aside className="w-64 bg-teal-800 text-white flex flex-col h-full shadow-lg">
      <div className="p-5 font-bold text-xl border-b border-teal-700 flex justify-between items-center">
        <span>PM System</span>
        {isMobile && (
          <button onClick={onClose} className="md:hidden">
            <X size={24} />
          </button>
        )}
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={isMobile ? onClose : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                isActive ? 'bg-teal-900' : 'hover:bg-teal-700'
              }`
            }
          >
            <item.icon size={20} /> {item.label}
          </NavLink>
        ))}
        {isAuthFeatureEnabled && (
          <div className="pt-4 mt-4 border-t border-teal-700">
            <div className="flex items-center gap-3 px-4 py-2 opacity-50">
              🔒 Manajemen Akun
            </div>
          </div>
        )}
      </nav>
    </aside>
  );
}