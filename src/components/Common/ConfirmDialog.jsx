import { AlertTriangle } from 'lucide-react';
import Dialog from './Dialog';

export default function ConfirmDialog({
  open,
  title = 'Konfirmasi penghapusan',
  message,
  detail,
  confirmLabel = 'Ya, hapus',
  loading = false,
  onConfirm,
  onCancel
}) {
  if (!open) return null;

  return (
    <Dialog title={title} onClose={onCancel} closeDisabled={loading} maxWidth="max-w-md">
      <div className="flex gap-3 rounded-lg bg-red-50 p-4 text-red-900">
        <AlertTriangle className="mt-0.5 shrink-0" size={22} aria-hidden="true" />
        <div>
          <p className="font-medium">{message}</p>
          {detail && <p className="mt-1 text-sm text-red-800">{detail}</p>}
          <p className="mt-2 text-sm">Tindakan ini tidak dapat dibatalkan.</p>
        </div>
      </div>
      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="min-h-11 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Batal
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="min-h-11 rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? 'Menghapus...' : confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}
