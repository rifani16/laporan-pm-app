import Dialog from '../../Common/Dialog';

export default function DetailPmModal({ pm, onClose }) {
  if (!pm) return null;

  const fields = [
    { label: 'ID PM', key: 'ID PM' },
    { label: 'NAMA PM', key: 'NAMA PM' },
    { label: 'NIK', key: 'NIK' },
    { label: 'NAMA PM ALT', key: 'NAMA PM ALT' },
    { label: 'NIK ALT', key: 'NIK ALT' },
    { label: 'NO KK', key: 'NO KK' },
    { label: 'ALAMAT', key: 'ALAMAT' },
    { label: 'DAERAH', key: 'DAERAH' },
    { label: 'NO HP', key: 'NO HP' },
    { label: 'ASNAF', key: 'ASNAF' },
    { label: 'PEKERJAAN', key: 'PEKERJAAN' },
    { label: 'CATATAN', key: 'CATATAN' },
    { label: 'Program Pernah Diterima', key: 'PENERIMAAN PROGRAM' },
    { label: 'Total Penerimaan', key: 'TOTAL PENERIMAAN', isRupiah: true }
  ];

  return (
    <Dialog title="Detail Penerima Manfaat" onClose={onClose} maxWidth="max-w-2xl">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {fields.map(field => (
            <div key={field.key} className="col-span-1">
              <label className="block text-sm font-medium text-gray-500">{field.label}</label>
              <p className="text-gray-800 break-words">
                {field.isRupiah && pm[field.key] !== undefined
                  ? `Rp ${Number(pm[field.key]).toLocaleString('id-ID')}`
                  : pm[field.key] || '-'}
              </p>
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-4">
          <button onClick={onClose} className="min-h-11 px-4 py-2 bg-teal-600 text-white rounded-lg">Tutup</button>
        </div>
    </Dialog>
  );
}
