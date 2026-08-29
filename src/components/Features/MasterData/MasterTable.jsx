import { useState } from 'react';
import EditModal from './EditModal';
import DetailPmModal from './DetailPmModal';
import Pagination from '../../Common/Pagination';
import ConfirmDialog from '../../Common/ConfirmDialog';
import { useToast } from '../../../hooks/useToast';

export default function MasterTable({ data, onUpdate, onDelete, currentPage, onPageChange, rowsPerPage = 10, onRowsPerPageChange }) {
  const { showToast } = useToast();
  const [editItem, setEditItem] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const totalPages = Math.ceil(data.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginated = data.slice(startIndex, startIndex + rowsPerPage);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const idPm = deleteTarget['ID PM'];
    setDeletingId(idPm);
    try {
      const result = await onDelete(idPm);
      if (result?.success) {
        showToast('Data PM berhasil dihapus', 'success');
        setDeleteTarget(null);
        if (paginated.length === 1 && currentPage > 1) onPageChange(currentPage - 1);
      } else {
        showToast('Gagal menghapus PM: ' + (result?.error || 'Unknown error'), 'error');
      }
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* tabel sama seperti sebelumnya */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">No</th>
              <th className="p-2 text-left">Nama PM</th>
              <th className="p-2 text-left">Daerah</th>
              <th className="p-2 text-right">Total Penerimaan</th>
              <th className="w-40 min-w-40 p-2 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((pm, idx) => (
              <tr key={pm['ID PM']} className="border-b">
                <td className="p-2">{startIndex + idx + 1}</td>
                <td className="p-2 font-medium">{pm['NAMA PM']}</td>
                <td className="p-2">{pm['DAERAH'] || '-'}</td>
                <td className="p-2 text-right numeric">Rp {Number(pm['TOTAL PENERIMAAN'] || 0).toLocaleString('id-ID')}</td>
                <td className="w-40 min-w-40 p-2 text-right">
                  <div className="flex flex-wrap justify-end gap-1">
                    <button onClick={() => setDetailItem(pm)} className="rounded-md bg-blue-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-blue-700">Detail</button>
                    <button onClick={() => setEditItem(pm)} className="rounded-md bg-teal-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-teal-700">Edit</button>
                    <button
                      onClick={() => setDeleteTarget(pm)}
                      disabled={deletingId === pm['ID PM']}
                      className="rounded-md bg-red-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      {deletingId === pm['ID PM'] ? 'Menghapus...' : 'Hapus'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && <div className="p-6 text-center text-gray-500">Belum ada data PM yang sesuai.</div>}
      </div>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={onRowsPerPageChange}
      />
      {editItem && <EditModal item={editItem} onClose={() => setEditItem(null)} onSave={onUpdate} />}
      {detailItem && <DetailPmModal pm={detailItem} onClose={() => setDetailItem(null)} />}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        message={deleteTarget ? `Hapus PM “${deleteTarget['NAMA PM']}”?` : ''}
        detail={deleteTarget ? `ID PM: ${deleteTarget['ID PM']}. PM yang masih memiliki riwayat penyaluran tidak dapat dihapus.` : ''}
        loading={Boolean(deletingId)}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
