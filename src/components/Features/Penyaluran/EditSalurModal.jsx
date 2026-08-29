import { useState } from 'react';
import { useData } from '../../../hooks/useData';
import { useToast } from '../../../hooks/useToast';
import Dialog from '../../Common/Dialog';

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
    <Dialog title="Edit Transaksi" onClose={onClose} closeDisabled={submitting} maxWidth="max-w-md">
        <div className="space-y-3">
          <div>
            <label htmlFor="edit-salur-id-pm" className="block text-sm font-medium">ID PM</label>
            <input id="edit-salur-id-pm" type="text" className="min-h-11 w-full rounded-lg border bg-gray-100 p-2" value={fixedPmId} disabled />
          </div>
          <div>
            <label htmlFor="edit-salur-penerima" className="block text-sm font-medium">Nama Penerima</label>
            <select id="edit-salur-penerima" className="min-h-11 w-full rounded-lg border p-2" value={namaPenerima} onChange={e => setNamaPenerima(e.target.value)}>
              <option value="">-- Pilih Nama --</option>
              {namaOptions.map(o => <option key={o.label} value={o.label}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="edit-salur-program" className="block text-sm font-medium">Program</label>
            <select id="edit-salur-program" className="min-h-11 w-full rounded-lg border p-2" value={form.PROGRAM} onChange={e => setForm({...form, PROGRAM: e.target.value})}>
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
            <label htmlFor="edit-salur-jumlah" className="block text-sm font-medium">Jumlah Penerimaan (Rp)</label>
            <input id="edit-salur-jumlah" type="number" className="min-h-11 w-full rounded-lg border p-2 numeric" value={form.JUMLAH_PENERIMAAN} onChange={e => setForm({...form, JUMLAH_PENERIMAAN: e.target.value})} placeholder="Nominal dalam Rupiah" />
          </div>
          <div>
            <label htmlFor="edit-salur-keterangan" className="block text-sm font-medium">Keterangan</label>
            <textarea id="edit-salur-keterangan" className="w-full rounded-lg border p-2" value={form.KETERANGAN} onChange={e => setForm({...form, KETERANGAN: e.target.value})} rows={2} placeholder="Catatan tambahan" />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} disabled={submitting} className="min-h-11 px-4 py-2 border rounded-lg">Batal</button>
          <button onClick={handleSubmit} disabled={submitting} className={`min-h-11 px-4 py-2 rounded-lg text-white ${submitting ? 'bg-gray-400' : 'bg-teal-600'}`}>
            {submitting ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
    </Dialog>
  );
}
