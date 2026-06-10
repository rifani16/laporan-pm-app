import { useState } from 'react';
import { useData } from '@/hooks/useData';
import { useToast } from '@/hooks/useToast';

export default function TambahPmModal({ onClose, onSuccess }) {
  const { refData, createMaster } = useData();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    'NAMA PM': '',
    'NIK': '',
    'NAMA PM ALT': '',
    'NIK ALT': '',
    'NO KK': '',
    'ALAMAT': '',
    'DAERAH': '',
    'NO HP': '',
    'ASNAF': '',
    'PEKERJAAN': '',
    'CATATAN': ''   // field baru
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form['NAMA PM']) {
      showToast('Nama PM wajib diisi', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const result = await createMaster(form);
      if (result.success) {
        showToast('Data PM berhasil ditambahkan', 'success');
        onSuccess();
        onClose();
      } else {
        showToast('Gagal: ' + (result.error || 'Unknown error'), 'error');
      }
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full p-5 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Tambah Penerima Manfaat Baru</h2>
        <form onSubmit={handleSubmit}>
          {/* Baris 1: NAMA PM dan NIK */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div><label className="block text-sm font-medium">NAMA PM *</label><input className="w-full border rounded p-2" value={form['NAMA PM']} onChange={e => handleChange('NAMA PM', e.target.value)} required /></div>
            <div><label className="block text-sm font-medium">NIK</label><input className="w-full border rounded p-2" value={form['NIK']} onChange={e => handleChange('NIK', e.target.value)} /></div>
          </div>
          {/* Baris 2: NAMA PM ALT dan NIK ALT */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div><label className="block text-sm font-medium">NAMA PM ALT</label><input className="w-full border rounded p-2" value={form['NAMA PM ALT']} onChange={e => handleChange('NAMA PM ALT', e.target.value)} /></div>
            <div><label className="block text-sm font-medium">NIK ALT</label><input className="w-full border rounded p-2" value={form['NIK ALT']} onChange={e => handleChange('NIK ALT', e.target.value)} /></div>
          </div>
          {/* Baris 3: NO KK dan NO HP */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div><label className="block text-sm font-medium">NO KK</label><input className="w-full border rounded p-2" value={form['NO KK']} onChange={e => handleChange('NO KK', e.target.value)} /></div>
            <div><label className="block text-sm font-medium">NO HP</label><input className="w-full border rounded p-2" value={form['NO HP']} onChange={e => handleChange('NO HP', e.target.value)} /></div>
          </div>
          {/* Baris 4: ALAMAT DAN DAERAH */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div><label className="block text-sm font-medium">ALAMAT</label><input className="w-full border rounded p-2" value={form['ALAMAT']} onChange={e => handleChange('ALAMAT', e.target.value)} /></div>
            <div><label className="block text-sm font-medium">DAERAH</label><select className="w-full border rounded p-2" value={form['DAERAH']} onChange={e => handleChange('DAERAH', e.target.value)}><option value="">-- Pilih Daerah --</option>{refData.daerah.map(d => <option key={d}>{d}</option>)}</select></div>
          </div>
          {/* Baris 5: ASNAF dan PEKERJAAN */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div><label className="block text-sm font-medium">ASNAF</label><select className="w-full border rounded p-2" value={form['ASNAF']} onChange={e => handleChange('ASNAF', e.target.value)}><option value="">-- Pilih Asnaf --</option>{refData.asnaf.map(a => <option key={a}>{a}</option>)}</select></div>
            <div><label className="block text-sm font-medium">PEKERJAAN</label><input className="w-full border rounded p-2" value={form['PEKERJAAN']} onChange={e => handleChange('PEKERJAAN', e.target.value)} /></div>
          </div>
          {/* Baris 6: CATATAN (full width) */}
          <div className="mb-3">
            <label className="block text-sm font-medium">CATATAN</label>
            <textarea className="w-full border rounded p-2" rows={2} value={form['CATATAN']} onChange={e => handleChange('CATATAN', e.target.value)} placeholder="Catatan tambahan (opsional)" />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Batal</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-teal-600 text-white rounded">{submitting ? 'Menyimpan...' : 'Simpan'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}