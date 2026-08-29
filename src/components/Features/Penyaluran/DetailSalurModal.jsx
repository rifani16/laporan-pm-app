import Dialog from '../../Common/Dialog';

export default function DetailSalurModal({ data, masterData, onClose }) {
  if (!data) return null;

  const masterPm = masterData.find(pm => pm['ID PM'] === data['ID PM']);
  const namaUtama = masterPm ? masterPm['NAMA PM'] : '';
  const namaAlternatif = masterPm ? masterPm['NAMA PM ALT'] : '';
  const namaPenerimaTransaksi = data['NAMA PENERIMA'] || data['NAMA PM'] || ''; // fallback

  const isAlternatif = namaPenerimaTransaksi === namaAlternatif && namaAlternatif !== '';

  const formatRupiah = (value) => {
    if (value == null) return 'Rp 0';
    const num = Number(value);
    if (isNaN(num)) return 'Rp 0';
    return `Rp ${num.toLocaleString('id-ID')}`;
  };

  return (
    <Dialog title="Detail Transaksi" onClose={onClose} maxWidth="max-w-lg">
        <div className="space-y-3">
          <div><label className="block text-sm font-medium text-gray-500">ID PM</label><p className="text-gray-800">{data['ID PM'] || '-'}</p></div>
          {isAlternatif ? (
            <>
              <div><label className="block text-sm font-medium text-gray-500">Nama PM Utama</label><p className="text-gray-800">{namaUtama}</p></div>
              <div><label className="block text-sm font-medium text-gray-500">Nama Penerima (Alternatif)</label><p className="text-gray-800">{namaPenerimaTransaksi}</p></div>
            </>
          ) : (
            <div><label className="block text-sm font-medium text-gray-500">Nama Penerima</label><p className="text-gray-800">{namaPenerimaTransaksi || namaUtama || '-'}</p></div>
          )}
          <div><label className="block text-sm font-medium text-gray-500">NIK Penerima</label><p className="text-gray-800">{data['NIK PENERIMA'] || data['NIK'] || '-'}</p></div>
          <div><label className="block text-sm font-medium text-gray-500">Daerah</label><p className="text-gray-800">{data['DAERAH'] || '-'}</p></div>
          <div><label className="block text-sm font-medium text-gray-500">Alamat</label><p className="text-gray-800">{data['ALAMAT'] || '-'}</p></div>
          <div><label className="block text-sm font-medium text-gray-500">Program</label><p className="text-gray-800">{data['PROGRAM'] || '-'}</p></div>
          <div><label className="block text-sm font-medium text-gray-500">Bentuk Penerimaan</label><p className="text-gray-800">{data['BENTUK PENERIMAAN'] || '-'}</p></div>
          <div><label className="block text-sm font-medium text-gray-500">Jumlah Penerimaan</label><p className="text-gray-800">{formatRupiah(data['JUMLAH PENERIMAAN'])}</p></div>
          <div><label className="block text-sm font-medium text-gray-500">Keterangan</label><p className="text-gray-800">{data['KETERANGAN'] || '-'}</p></div>
        </div>
        <div className="flex justify-end mt-4">
          <button onClick={onClose} className="min-h-11 px-4 py-2 bg-teal-600 text-white rounded-lg">Tutup</button>
        </div>
    </Dialog>
  );
}
