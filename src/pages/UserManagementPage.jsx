import { useState } from 'react';
import { Plus } from 'lucide-react';
import Dialog from '../components/Common/Dialog';
import { useData } from '../hooks/useData';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

const MIN_PASSWORD_LENGTH = 6;
const ROLE_LABELS = { super_admin: 'Super Admin', admin_wilayah: 'Admin Wilayah', admin_daerah: 'Admin Daerah' };
const inputClass = 'mt-1 min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-200 disabled:bg-gray-100 disabled:text-gray-600';

function DialogActions({ saving, submitLabel, onClose }) {
  return (
    <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <button type="button" onClick={onClose} disabled={saving} className="min-h-11 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">Batal</button>
      <button type="submit" disabled={saving} className="min-h-11 rounded-lg bg-teal-600 px-4 py-2 font-medium text-white hover:bg-teal-700 disabled:opacity-50">
        {saving ? 'Menyimpan...' : submitLabel}
      </button>
    </div>
  );
}

function UserFormDialog({ user, isSelf, daerahOptions, saving, onSubmit, onClose }) {
  const isNew = !user;
  const [form, setForm] = useState({
    username: user?.username || '',
    nama: user?.nama || '',
    role: user?.role || 'admin_daerah',
    daerah: user?.daerah || '',
    password: ''
  });
  const change = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  return (
    <Dialog title={isNew ? 'Tambah Akun' : `Edit Akun ${user.username}`} onClose={onClose} closeDisabled={saving} maxWidth="max-w-md">
      <form onSubmit={event => { event.preventDefault(); onSubmit(form); }} className="space-y-4">
        <label className="block text-sm font-medium text-gray-800">
          Username
          <input value={form.username} onChange={change('username')} disabled={!isNew || saving} required minLength={3} maxLength={30} pattern="[A-Za-z0-9_.\-]+" autoComplete="off" data-autofocus={isNew || undefined} className={inputClass} />
          {isNew && <span className="mt-1 block text-xs font-normal text-gray-600">3-30 karakter: huruf, angka, titik, garis bawah, atau strip. Tidak bisa diubah nanti.</span>}
        </label>
        <label className="block text-sm font-medium text-gray-800">
          Nama
          <input value={form.nama} onChange={change('nama')} disabled={saving} maxLength={100} data-autofocus={!isNew || undefined} className={inputClass} />
        </label>
        <label className="block text-sm font-medium text-gray-800">
          Role
          <select value={form.role} onChange={change('role')} disabled={isSelf || saving} className={inputClass}>
            <option value="admin_daerah">Admin Daerah (pantau 1 daerah)</option>
            <option value="admin_wilayah">Admin Wilayah (pantau semua daerah)</option>
            <option value="super_admin">Super Admin (kelola semua data)</option>
          </select>
          {isSelf && <span className="mt-1 block text-xs font-normal text-gray-600">Role akun sendiri tidak bisa diubah.</span>}
        </label>
        {form.role === 'admin_daerah' && (
          <label className="block text-sm font-medium text-gray-800">
            Daerah
            <select value={form.daerah} onChange={change('daerah')} disabled={saving} required className={inputClass}>
              <option value="">Pilih daerah</option>
              {daerahOptions.map(daerah => <option key={daerah} value={daerah}>{daerah}</option>)}
            </select>
          </label>
        )}
        {isNew && (
          <label className="block text-sm font-medium text-gray-800">
            Password awal
            <input type="password" value={form.password} onChange={change('password')} disabled={saving} required minLength={MIN_PASSWORD_LENGTH} autoComplete="new-password" className={inputClass} />
            <span className="mt-1 block text-xs font-normal text-gray-600">Minimal {MIN_PASSWORD_LENGTH} karakter. Sampaikan ke pemilik akun secara langsung.</span>
          </label>
        )}
        <DialogActions saving={saving} submitLabel={isNew ? 'Tambah Akun' : 'Simpan Perubahan'} onClose={onClose} />
      </form>
    </Dialog>
  );
}

function ResetPasswordDialog({ username, saving, onSubmit, onClose }) {
  const [password, setPassword] = useState('');

  return (
    <Dialog title={`Reset Password ${username}`} onClose={onClose} closeDisabled={saving} maxWidth="max-w-md">
      <form onSubmit={event => { event.preventDefault(); onSubmit(password); }}>
        <label className="block text-sm font-medium text-gray-800">
          Password baru
          <input type="password" value={password} onChange={event => setPassword(event.target.value)} disabled={saving} required minLength={MIN_PASSWORD_LENGTH} autoComplete="new-password" data-autofocus className={inputClass} />
        </label>
        <p className="mt-2 text-sm text-gray-600">Minimal {MIN_PASSWORD_LENGTH} karakter. Password lama langsung tidak berlaku.</p>
        <DialogActions saving={saving} submitLabel="Reset Password" onClose={onClose} />
      </form>
    </Dialog>
  );
}

export default function UserManagementPage() {
  const { users, refData, loading, createUser, updateUser, updateUserStatus, resetUserPassword } = useData();
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const [dialog, setDialog] = useState(null);
  const [saving, setSaving] = useState(false);
  const [togglingUsername, setTogglingUsername] = useState(null);

  const isSelf = (user) => Boolean(user) && user.username.toLowerCase() === String(currentUser?.username).toLowerCase();
  const closeDialog = () => setDialog(null);

  const run = async (request, onDone) => {
    try {
      const result = await request();
      if (!result.success) throw new Error(result.error || 'Permintaan gagal');
      showToast(result.message || 'Berhasil disimpan');
      onDone?.();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const submitWith = (request) => async (...args) => {
    setSaving(true);
    await run(() => request(...args), closeDialog);
    setSaving(false);
  };

  const handleSaveUser = submitWith(form => (dialog.user ? updateUser(form) : createUser(form)));
  const handleResetPassword = submitWith(password => resetUserPassword(dialog.user.username, password));

  const toggleStatus = async (user) => {
    setTogglingUsername(user.username);
    await run(() => updateUserStatus(user.username, !user.aktif));
    setTogglingUsername(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kelola Akun</h1>
          <p className="mt-1 text-sm text-gray-600">Akun nonaktif langsung keluar dan tidak bisa login sampai diaktifkan lagi.</p>
        </div>
        <button type="button" onClick={() => setDialog({ type: 'form', user: null })} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2 font-medium text-white hover:bg-teal-700">
          <Plus size={18} aria-hidden="true" />
          Tambah Akun
        </button>
      </div>

      <section className="rounded-xl bg-white shadow-sm" aria-label="Daftar akun">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="p-3 text-left font-semibold">Username</th>
                <th className="p-3 text-left font-semibold">Nama</th>
                <th className="p-3 text-left font-semibold">Role</th>
                <th className="p-3 text-left font-semibold">Daerah</th>
                <th className="p-3 text-left font-semibold">Status</th>
                <th className="p-3 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.username} className={`border-t border-gray-100 ${user.aktif ? '' : 'text-gray-500'}`}>
                  <td className="p-3 font-medium">
                    {user.username}
                    {isSelf(user) && <span className="ml-2 text-xs font-normal text-gray-500">(Anda)</span>}
                  </td>
                  <td className="p-3">{user.nama || '-'}</td>
                  <td className="p-3">{ROLE_LABELS[user.role] || user.role}</td>
                  <td className="p-3">{user.daerah || '-'}</td>
                  <td className="p-3">
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${user.aktif ? 'bg-green-50 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                      {user.aktif ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="p-2">
                    <div className="flex justify-end gap-1">
                      <button type="button" onClick={() => setDialog({ type: 'form', user })} className="min-h-11 whitespace-nowrap rounded-lg px-2 font-medium text-teal-700 hover:bg-teal-50">Edit</button>
                      <button type="button" onClick={() => setDialog({ type: 'reset', user })} className="min-h-11 whitespace-nowrap rounded-lg px-2 font-medium text-gray-700 hover:bg-gray-100">Reset password</button>
                      {!isSelf(user) && (
                        <button
                          type="button"
                          onClick={() => toggleStatus(user)}
                          disabled={togglingUsername === user.username}
                          className={`min-h-11 whitespace-nowrap rounded-lg px-2 font-medium disabled:opacity-50 ${user.aktif ? 'text-red-700 hover:bg-red-50' : 'text-teal-700 hover:bg-teal-50'}`}
                        >
                          {togglingUsername === user.username ? 'Menyimpan...' : user.aktif ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {loading && users.length === 0 && <p className="p-8 text-center text-sm text-gray-500">Memuat akun...</p>}
      </section>

      {dialog?.type === 'form' && (
        <UserFormDialog
          user={dialog.user}
          isSelf={isSelf(dialog.user)}
          daerahOptions={refData.daerah || []}
          saving={saving}
          onSubmit={handleSaveUser}
          onClose={closeDialog}
        />
      )}
      {dialog?.type === 'reset' && (
        <ResetPasswordDialog username={dialog.user.username} saving={saving} onSubmit={handleResetPassword} onClose={closeDialog} />
      )}
    </div>
  );
}
