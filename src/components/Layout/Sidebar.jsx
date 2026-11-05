import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  PlusCircle,
  CalendarDays,
  ListFilter,
  Settings,
  UserCog,
  LogOut,
  X
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const ROLE_LABELS = { super_admin: 'Super Admin', admin_wilayah: 'Admin Wilayah', admin_daerah: 'Admin Daerah' };

export default function Sidebar({ isMobile = false, onClose }) {
  const { user, logout, isSuperAdmin } = useAuth();

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/master', label: 'Daftar PM', icon: Users },
    { to: '/kegiatan', label: 'Kegiatan Penyaluran', icon: CalendarDays },
    { to: '/salur', label: 'Input Penyaluran', icon: PlusCircle, superOnly: true },
    { to: '/program-penerima', label: 'Penerima per Program', icon: ListFilter },
    { to: '/program', label: 'Manajemen Program', icon: Settings, superOnly: true },
    { to: '/akun', label: 'Kelola Akun', icon: UserCog, superOnly: true }
  ].filter(item => !item.superOnly || isSuperAdmin);

  return (
    <aside className="flex h-full w-64 flex-col bg-teal-800 text-white shadow-lg">
      <div className="flex items-center justify-between border-b border-teal-700 p-5 font-bold text-xl">
        <span>PM System</span>
        {isMobile && (
          <button
            onClick={onClose}
            aria-label="Tutup menu navigasi"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg hover:bg-teal-700 md:hidden"
          >
            <X size={24} />
          </button>
        )}
      </div>

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
                className={`rounded-full px-2 py-0.5 font-medium ${
                  isSuperAdmin
                    ? 'bg-amber-400 text-amber-950'
                    : 'bg-teal-600 text-teal-50'
                }`}
              >
                {ROLE_LABELS[user.role] || 'Admin Daerah'}
              </span>
              {user.role === 'admin_daerah' && user.daerah && (
                <span className="rounded-full bg-teal-700/80 px-2 py-0.5 text-teal-100">
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
