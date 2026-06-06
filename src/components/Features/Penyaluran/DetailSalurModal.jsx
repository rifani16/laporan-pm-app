export default function DetailSalurModal({ data, onClose }) {
  if (!data) return null;

  const formatRupiah = (value) => {
    if (value === undefined || value === null) return 'Rp 0';
    const num = Number(value);
    if (isNaN(num)) return 'Rp 0';
    return `Rp ${num.toLocaleString()}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Detail Transaksi</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>
        <div className="space-y-3">
          <div><label className="block text-sm font-medium text-gray-500">ID PM</label><p className="text-gray-800">{data['ID PM'] || '-'}</p></div>
          <div><label className="block text-sm font-medium text-gray-500">Nama PM</label><p className="text-gray-800">{data['NAMA PM'] || '-'}</p></div>
          <div><label className="block text-sm font-medium text-gray-500">NIK</label><p className="text-gray-800">{data['NIK'] || '-'}</p></div>
          <div><label className="block text-sm font-medium text-gray-500">Daerah</label><p className="text-gray-800">{data['DAERAH'] || '-'}</p></div>
          <div><label className="block text-sm font-medium text-gray-500">Alamat</label><p className="text-gray-800">{data['ALAMAT'] || '-'}</p></div>
          <div><label className="block text-sm font-medium text-gray-500">Program</label><p className="text-gray-800">{data['PROGRAM'] || '-'}</p></div>
          <div><label className="block text-sm font-medium text-gray-500">Bentuk Penerimaan</label><p className="text-gray-800">{data['BENTUK PENERIMAAN'] || '-'}</p></div>
          <div><label className="block text-sm font-medium text-gray-500">Jumlah Penerimaan</label><p className="text-gray-800">{formatRupiah(data['JUMLAH PENERIMAAN'])}</p></div>
        </div>
        <div className="flex justify-end mt-4">
          <button onClick={onClose} className="px-4 py-2 bg-teal-600 text-white rounded">Tutup</button>
        </div>
      </div>
    </div>
  );
}