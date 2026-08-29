import { useMemo, useState } from 'react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import ConfirmDialog from '../components/Common/ConfirmDialog';
import Dialog from '../components/Common/Dialog';
import Pagination from '../components/Common/Pagination';
import { useData } from '../hooks/useData';
import { useToast } from '../hooks/useToast';

const normalizeName = (value) => String(value || '').trim().toLocaleLowerCase('id-ID');

export default function ProgramManagementPage() {
  const {
    refData,
    salurData,
    loading,
    createProgram,
    updateProgram,
    deleteProgram
  } = useData();
  const { showToast } = useToast();
  const [newName, setNewName] = useState('');
  const [search, setSearch] = useState('');
  const [editTarget, setEditTarget] = useState(null);
  const [editName, setEditName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const usageCounts = useMemo(() => {
    const counts = new Map();
    for (const item of salurData) {
      const key = normalizeName(item.PROGRAM);
      if (key) counts.set(key, (counts.get(key) || 0) + 1);
    }
    return counts;
  }, [salurData]);

  const filteredPrograms = useMemo(() => (
    [...(refData.program || [])]
      .sort((a, b) => a.localeCompare(b, 'id-ID'))
      .filter(name => normalizeName(name).includes(normalizeName(search)))
  ), [refData.program, search]);
  const totalPages = Math.ceil(filteredPrograms.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const programs = filteredPrograms.slice(startIndex, startIndex + rowsPerPage);

  const programExists = (name, ignoredName = '') => {
    const target = normalizeName(name);
    const ignored = normalizeName(ignoredName);
    return (refData.program || []).some(program => {
      const current = normalizeName(program);
      return current === target && current !== ignored;
    });
  };

  const handleAdd = async (event) => {
    event.preventDefault();
    const name = newName.trim();
    if (!name) return showToast('Nama program wajib diisi', 'error');
    if (programExists(name)) return showToast('Nama program sudah tersedia', 'error');

    setSaving(true);
    try {
      const result = await createProgram(name);
      if (!result.success) throw new Error(result.error || 'Gagal menambahkan program');
      setNewName('');
      setCurrentPage(1);
      showToast(result.message || 'Program berhasil ditambahkan');
    } catch (error) {
      showToast(error.message || 'Gagal menambahkan program', 'error');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (name) => {
    setEditTarget(name);
    setEditName(name);
  };

  const handleEdit = async (event) => {
    event.preventDefault();
    const name = editName.trim();
    if (!name) return showToast('Nama program wajib diisi', 'error');
    if (programExists(name, editTarget)) return showToast('Nama program sudah tersedia', 'error');
    if (name === editTarget) {
      setEditTarget(null);
      return;
    }

    setSaving(true);
    try {
      const result = await updateProgram(editTarget, name);
      if (!result.success) throw new Error(result.error || 'Gagal memperbarui program');
      setEditTarget(null);
      showToast(result.message || 'Program berhasil diperbarui');
    } catch (error) {
      showToast(error.message || 'Gagal memperbarui program', 'error');
    } finally {
      setSaving(false);
    }
  };

  const requestDelete = (name) => {
    const usage = usageCounts.get(normalizeName(name)) || 0;
    if (usage > 0) {
      showToast(`Program masih digunakan oleh ${usage} transaksi`, 'error');
      return;
    }
    setDeleteTarget(name);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const result = await deleteProgram(deleteTarget);
      if (!result.success) throw new Error(result.error || 'Gagal menghapus program');
      setDeleteTarget(null);
      if (programs.length === 1 && currentPage > 1) setCurrentPage(currentPage - 1);
      showToast(result.message || 'Program berhasil dihapus');
    } catch (error) {
      showToast(error.message || 'Gagal menghapus program', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manajemen Program</h1>
        <p className="mt-1 text-sm text-gray-600">Kelola pilihan program untuk penyaluran dan laporan.</p>
      </div>

      <form onSubmit={handleAdd} className="rounded-xl bg-white p-4 shadow-sm" aria-label="Tambah program">
        <label htmlFor="new-program" className="block text-sm font-medium text-gray-800">Nama program baru</label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            id="new-program"
            value={newName}
            onChange={event => setNewName(event.target.value)}
            maxLength={100}
            disabled={saving}
            className="min-h-11 flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-200 disabled:bg-gray-100"
            placeholder="Contoh: Pendidikan"
          />
          <button
            type="submit"
            disabled={saving || !newName.trim()}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2 font-medium text-white hover:bg-teal-700 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={18} aria-hidden="true" />
            {saving ? 'Menyimpan...' : 'Tambah Program'}
          </button>
        </div>
      </form>

      <section className="rounded-xl bg-white shadow-sm" aria-labelledby="program-list-title">
        <div className="flex flex-col gap-3 border-b border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="program-list-title" className="font-semibold text-gray-900">Daftar Program</h2>
            <p className="text-sm text-gray-600">{refData.program?.length || 0} program tersedia</p>
          </div>
          <label className="relative block sm:w-72">
            <span className="sr-only">Cari program</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={event => { setSearch(event.target.value); setCurrentPage(1); }}
              className="min-h-11 w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-200"
              placeholder="Cari program..."
            />
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="p-3 text-left font-semibold">Nama Program</th>
                <th className="w-44 p-3 text-right font-semibold">Jumlah Transaksi</th>
                <th className="w-40 p-3 text-center font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {programs.map(name => {
                const usage = usageCounts.get(normalizeName(name)) || 0;
                return (
                  <tr key={name} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="p-3 font-medium text-gray-900">{name}</td>
                    <td className="p-3 text-right numeric text-gray-700">{usage.toLocaleString('id-ID')}</td>
                    <td className="p-2">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(name)}
                          className="inline-flex min-h-11 items-center gap-1 rounded-lg px-3 py-2 font-medium text-teal-700 hover:bg-teal-50 active:scale-[0.97]"
                          aria-label={`Edit program ${name}`}
                        >
                          <Pencil size={16} aria-hidden="true" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => requestDelete(name)}
                          className="inline-flex min-h-11 items-center gap-1 rounded-lg px-3 py-2 font-medium text-red-700 hover:bg-red-50 active:scale-[0.97]"
                          aria-label={`Hapus program ${name}`}
                          title={usage > 0 ? `Masih digunakan oleh ${usage} transaksi` : 'Hapus program'}
                        >
                          <Trash2 size={16} aria-hidden="true" /> Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!loading && filteredPrograms.length === 0 && (
          <p className="p-8 text-center text-sm text-gray-500">
            {search ? 'Program tidak ditemukan.' : 'Belum ada program.'}
          </p>
        )}
        {loading && <p className="p-8 text-center text-sm text-gray-500">Memuat program...</p>}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={setRowsPerPage}
        />
      </section>

      {editTarget && (
        <Dialog title="Edit Program" onClose={() => setEditTarget(null)} closeDisabled={saving} maxWidth="max-w-md">
          <form onSubmit={handleEdit}>
            <label htmlFor="edit-program" className="block text-sm font-medium text-gray-800">Nama program</label>
            <input
              id="edit-program"
              autoFocus
              value={editName}
              onChange={event => setEditName(event.target.value)}
              maxLength={100}
              disabled={saving}
              className="mt-2 min-h-11 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-200 disabled:bg-gray-100"
            />
            <p className="mt-2 text-sm text-gray-600">Nama juga diperbarui pada seluruh transaksi terkait.</p>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setEditTarget(null)} disabled={saving} className="min-h-11 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">Batal</button>
              <button type="submit" disabled={saving || !editName.trim()} className="min-h-11 rounded-lg bg-teal-600 px-4 py-2 font-medium text-white hover:bg-teal-700 disabled:opacity-50">
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </Dialog>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus Program"
        message={`Hapus program “${deleteTarget || ''}”?`}
        detail="Program akan hilang dari daftar pilihan penyaluran."
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
