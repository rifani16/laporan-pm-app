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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Detail Penerima Manfaat</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {fields.map(field => (
            <div key={field.key} className="col-span-1">
              <label className="block text-sm font-medium text-gray-500">{field.label}</label>
              <p className="text-gray-800 break-words">
                {field.isRupiah && pm[field.key] !== undefined
                  ? `Rp ${pm[field.key].toLocaleString()}`
                  : pm[field.key] || '-'}
              </p>
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-4">
          <button onClick={onClose} className="px-4 py-2 bg-teal-600 text-white rounded">Tutup</button>
        </div>
      </div>
    </div>
  );
}