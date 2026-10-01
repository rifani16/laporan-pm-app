import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  PlusCircle,
  ListFilter,
  Settings,
  LogOut,
  Shield,
  MapPin,
  X
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function Sidebar({ isMobile = false, onClose }) {
  const { user, logout, isSuperAdmin } = useAuth();

  const allNavItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['super_admin', 'admin_daerah'] },
    { to: '/master', label: 'Daftar PM', icon: Users, roles: ['super_admin', 'admin_daerah'] },
    { to: '/salur', label: 'Input Penyaluran', icon: PlusCircle, roles: ['super_admin', 'admin_daerah'] },
    { to: '/program-penerima', label: 'Penerima per Program', icon: ListFilter, roles: ['super_admin', 'admin_daerah'] },
    { to: '/program', label: 'Manajemen Program', icon: Settings, roles: ['super_admin'] }
  ];

  const currentRole = user?.role || (isSuperAdmin ? 'super_admin' : 'admin_daerah');
  const navItems = allNavItems.filter(item => item.roles.includes(currentRole));

  return (
    <aside className="flex h-full w-64 flex-col bg-teal-800 text-white shadow-lg">
      {/* Brand Header */}
      <div className="flex items-center justify-between border-b border-teal-700 p-5 font-bold text-xl">
        <span>PM System</span>
        {isMobile && (
          <button
            autoFocus={isMobile}
            onClick={onClose}
            aria-label="Tutup menu navigasi"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg hover:bg-teal-700 md:hidden"
          >
            <X size={24} />
          </button>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={isMobile ? onClose : undefined}
            className={({ isActive }) =>
              `flex min-h-11 items-center gap-3 rounded-lg px-4 py-2 transition-colors ${
                isActive ? 'bg-teal-900 font-medium' : 'hover:bg-teal-700'
              }`
            }
          >
            <item.icon size={20} /> {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User Info & Logout Footer */}
      {user && (
        <div className="border-t border-teal-700 bg-teal-900/40 p-4">
          <div className="mb-3">
            <div className="flex items-center gap-2">
              <span className="truncate font-semibold text-sm text-white">
                {user.nama || user.username}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${
                  isSuperAdmin
                    ? 'bg-amber-400 text-amber-950'
                    : 'bg-teal-600 text-teal-50'
                }`}
              >
                <Shield size={12} />
                {isSuperAdmin ? 'Super Admin' : 'Admin Daerah'}
              </span>
              {!isSuperAdmin && user.daerah && (
                <span className="inline-flex items-center gap-1 rounded-full bg-teal-700/80 px-2 py-0.5 text-teal-100">
                  <MapPin size={12} />
                  {user.daerah}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-teal-700/60 px-3 py-2 text-xs font-medium text-teal-100 hover:bg-red-600 hover:text-white transition-colors"
          >
            <LogOut size={15} />
            <span>Keluar (Logout)</span>
          </button>
        </div>
      )}
    </aside>
  );
}
