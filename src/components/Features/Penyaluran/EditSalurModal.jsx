import { useState } from 'react';
import { useData } from '../../../hooks/useData';
import { useToast } from '../../../hooks/useToast';
import Dialog from '../../Common/Dialog';
import { getNamaOptions, toggleBentuk, buildSalurPayload } from './salurFields';
import KegiatanSelect from './KegiatanSelect';

export default function EditSalurModal({ data, onClose, onSave }) {
  const { masterData, refData, kegiatanList } = useData();
  const { showToast } = useToast();
  const fixedPmId = data['ID PM'];
  const bentuk = data['BENTUK PENERIMAAN'] || '';
  // Transaksi lama boleh tetap tanpa kegiatan; yang sudah masuk kegiatan tidak bisa dilepas.
  const isLegacy = !data['ID KEGIATAN'];

  const [namaPenerima, setNamaPenerima] = useState(data['NAMA PENERIMA'] || data['NAMA PM'] || '');
  const [form, setForm] = useState({
    ID_KEGIATAN: data['ID KEGIATAN'] ? String(data['ID KEGIATAN']) : '',
    PROGRAM: data['PROGRAM'] || '',
    BENTUK_PENERIMAAN: { uang: bentuk.includes('Uang'), barang: bentuk.includes('Barang') },
    JUMLAH_PENERIMAAN: data['JUMLAH PENERIMAAN'] ?? '',
    KETERANGAN: data['KETERANGAN'] || ''
  });
  const [submitting, setSubmitting] = useState(false);

  const selectedPm = masterData.find(p => p['ID PM'] === fixedPmId);
  const namaOptions = getNamaOptions(selectedPm);

  const handleSubmit = async () => {
    const { error, payload } = buildSalurPayload(selectedPm, namaPenerima, form);
    if (error) return showToast(error, 'error');

    setSubmitting(true);
    try {
      const result = await onSave({ 'ID SALUR': data['ID SALUR'], ...payload });
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
          <KegiatanSelect
            kegiatanList={kegiatanList}
            value={form.ID_KEGIATAN}
            onChange={id => setForm({ ...form, ID_KEGIATAN: id })}
            allowNone={isLegacy}
          />
          {isLegacy && !form.ID_KEGIATAN && (
            <div>
              <label htmlFor="edit-salur-program" className="block text-sm font-medium">Program</label>
              <select id="edit-salur-program" className="min-h-11 w-full rounded-lg border p-2" value={form.PROGRAM} onChange={e => setForm({...form, PROGRAM: e.target.value})}>
                <option value="">-- Pilih Program --</option>
                {refData.program.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium">Bentuk Penerimaan</label>
            <div className="flex gap-4 mt-1">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.BENTUK_PENERIMAAN.uang} onChange={() => setForm(toggleBentuk(form, 'uang'))} /> Uang
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.BENTUK_PENERIMAAN.barang} onChange={() => setForm(toggleBentuk(form, 'barang'))} /> Barang
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
