import { useState } from 'react';
import { useData } from '../../../hooks/useData';
import { useToast } from '../../../hooks/useToast';

export default function EditSalurModal({ data, onClose, onSave }) {
  const { masterData, refData } = useData();
  const { showToast } = useToast();

  // Nilai default (hanya untuk menghindari conditional hooks)
  const defaultIdPm = data ? data['ID PM'] : '';
  const defaultNamaPenerima = data ? (data['NAMA PENERIMA'] || data['NAMA PM'] || '') : '';
  const defaultProgram = data ? data['PROGRAM'] : '';
  const defaultBentuk = data ? data['BENTUK PENERIMAAN'] : '';
  const defaultJumlah = (data && data['JUMLAH PENERIMAAN'] != null) ? data['JUMLAH PENERIMAAN'] : '';
  const defaultKeterangan = data ? data['KETERANGAN'] : '';

  const [namaPenerima, setNamaPenerima] = useState(defaultNamaPenerima);
  const [form, setForm] = useState({
    PROGRAM: defaultProgram,
    BENTUK_PENERIMAAN: {
      uang: defaultBentuk.includes('Uang'),
      barang: defaultBentuk.includes('Barang')
    },
    JUMLAH_PENERIMAAN: defaultJumlah,
    KETERANGAN: defaultKeterangan
  });
  const [submitting, setSubmitting] = useState(false);

  if (!data) return null;

  const fixedPmId = defaultIdPm;
  const selectedPm = masterData.find(p => p['ID PM'] === fixedPmId);
  const namaOptions = selectedPm
    ? [
        { label: selectedPm['NAMA PM'], nik: selectedPm['NIK'] },
        { label: selectedPm['NAMA PM ALT'], nik: selectedPm['NIK ALT'] }
      ].filter(o => o.label)
    : [];

  const handleCheckboxChange = (type) => {
    setForm(prev => ({
      ...prev,
      BENTUK_PENERIMAAN: { ...prev.BENTUK_PENERIMAAN, [type]: !prev.BENTUK_PENERIMAAN[type] }
    }));
  };

  const handleSubmit = async () => {
    if (!namaPenerima) return showToast('Pilih nama penerima', 'error');
    if (!form.PROGRAM) return showToast('Pilih program', 'error');
    const { uang, barang } = form.BENTUK_PENERIMAAN;
    if (!uang && !barang) return showToast('Pilih bentuk penerimaan', 'error');
    const jumlah = Number(form.JUMLAH_PENERIMAAN);
    if (isNaN(jumlah) || jumlah <= 0) return showToast('Jumlah penerimaan harus >0', 'error');

    const bentukArr = [];
    if (uang) bentukArr.push('Uang');
    if (barang) bentukArr.push('Barang');
    const bentukPenerimaan = bentukArr.join(', ');
    const selected = namaOptions.find(o => o.label === namaPenerima);
    if (!selected) return showToast('Nama penerima tidak valid', 'error');

    const payload = {
      'ID SALUR': data['ID SALUR'],
      'ID PM': fixedPmId,
      'NAMA PENERIMA': namaPenerima,
      'NIK PENERIMA': selected.nik,
      'DAERAH': selectedPm['DAERAH'] || '',
      'ALAMAT': selectedPm['ALAMAT'] || '',
      'PROGRAM': form.PROGRAM,
      'BENTUK PENERIMAAN': bentukPenerimaan,
      'JUMLAH PENERIMAAN': jumlah,
      'KETERANGAN': form.KETERANGAN
    };

    setSubmitting(true);
    try {
      const result = await onSave(payload);
      if (result?.success) {
        showToast('Transaksi berhasil diperbarui', 'success');
        onClose();
      } else {
        showToast('Gagal: ' + (result?.error || 'Unknown error'), 'error');
      }
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-5">
        <h2 className="text-xl font-bold mb-4">Edit Transaksi</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium">ID PM</label>
            <input type="text" className="w-full border rounded p-2 bg-gray-100" value={fixedPmId} disabled />
          </div>
          <div>
            <label className="block text-sm font-medium">Nama Penerima</label>
            <select className="w-full border rounded p-2" value={namaPenerima} onChange={e => setNamaPenerima(e.target.value)}>
              <option value="">-- Pilih Nama --</option>
              {namaOptions.map(o => <option key={o.label} value={o.label}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Program</label>
            <select className="w-full border rounded p-2" value={form.PROGRAM} onChange={e => setForm({...form, PROGRAM: e.target.value})}>
              <option value="">-- Pilih Program --</option>
              {refData.program.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Bentuk Penerimaan</label>
            <div className="flex gap-4 mt-1">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.BENTUK_PENERIMAAN.uang} onChange={() => handleCheckboxChange('uang')} /> Uang
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.BENTUK_PENERIMAAN.barang} onChange={() => handleCheckboxChange('barang')} /> Barang
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">Jumlah Penerimaan (Rp)</label>
            <input type="number" className="w-full border rounded p-2" value={form.JUMLAH_PENERIMAAN} onChange={e => setForm({...form, JUMLAH_PENERIMAAN: e.target.value})} placeholder="Nominal dalam Rupiah" />
          </div>
          <div>
            <label className="block text-sm font-medium">Keterangan</label>
            <textarea className="w-full border rounded p-2" value={form.KETERANGAN} onChange={e => setForm({...form, KETERANGAN: e.target.value})} rows={2} placeholder="Catatan tambahan" />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} disabled={submitting} className="px-4 py-2 border rounded">Batal</button>
          <button onClick={handleSubmit} disabled={submitting} className={`px-4 py-2 rounded text-white ${submitting ? 'bg-gray-400' : 'bg-teal-600'}`}>
            {submitting ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  );
}