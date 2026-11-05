import Dialog from '../../Common/Dialog';
import { formatRupiah, formatTanggal } from '../../../services/kegiatan';

const jejak = (oleh, pada) => (oleh ? `${oleh}${pada ? `, ${pada}` : ''}` : '-');

export default function DetailSalurModal({ data, masterData, onClose }) {
  if (!data) return null;

  const masterPm = masterData.find(pm => pm['ID PM'] === data['ID PM']);
  const namaUtama = masterPm ? masterPm['NAMA PM'] : '';
  const namaAlternatif = masterPm ? masterPm['NAMA PM ALT'] : '';
  const namaPenerimaTransaksi = data['NAMA PENERIMA'] || data['NAMA PM'] || ''; // fallback

  const isAlternatif = namaPenerimaTransaksi === namaAlternatif && namaAlternatif !== '';

  return (
    <Dialog title="Detail Transaksi" onClose={onClose} maxWidth="max-w-3xl">
        <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
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
          <div><label className="block text-sm font-medium text-gray-500">Kegiatan</label><p className="text-gray-800">{data.NAMA_KEGIATAN ? `${data.NAMA_KEGIATAN} (${formatTanggal(data.TANGGAL)})` : 'Tanpa kegiatan'}</p></div>
          <div><label className="block text-sm font-medium text-gray-500">Program</label><p className="text-gray-800">{data['PROGRAM'] || '-'}</p></div>
          <div><label className="block text-sm font-medium text-gray-500">Bentuk Penerimaan</label><p className="text-gray-800">{data['BENTUK PENERIMAAN'] || '-'}</p></div>
          <div><label className="block text-sm font-medium text-gray-500">Jumlah Penerimaan</label><p className="text-gray-800">{formatRupiah(data['JUMLAH PENERIMAAN'])}</p></div>
          <div><label className="block text-sm font-medium text-gray-500">Keterangan</label><p className="text-gray-800">{data['KETERANGAN'] || '-'}</p></div>
          <div><label className="block text-sm font-medium text-gray-500">Diinput</label><p className="text-gray-800">{jejak(data['DIINPUT OLEH'], data['DIINPUT PADA'])}</p></div>
          <div><label className="block text-sm font-medium text-gray-500">Terakhir diubah</label><p className="text-gray-800">{jejak(data['DIUBAH OLEH'], data['DIUBAH PADA'])}</p></div>
        </div>
        <div className="flex justify-end mt-4">
          <button onClick={onClose} className="min-h-11 px-4 py-2 bg-teal-600 text-white rounded-lg">Tutup</button>
        </div>
    </Dialog>
  );
}
