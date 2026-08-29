import { useState } from 'react';
import { useData } from '@/hooks/useData';
import { useToast } from '@/hooks/useToast';
import Dialog from '@/components/Common/Dialog';

export default function TambahPmModal({ onClose }) {
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

  const handleIdentityNumber = (field, value) => {
    handleChange(field, value.replace(/\D/g, '').slice(0, 16));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form['NAMA PM']) {
      showToast('Nama PM wajib diisi', 'error');
      return;
    }
    for (const field of ['NIK', 'NIK ALT', 'NO KK']) {
      if (form[field] && form[field].length !== 16) {
        showToast(`${field} harus terdiri dari 16 digit`, 'error');
        return;
      }
    }
    setSubmitting(true);
    try {
      const result = await createMaster(form);
      if (result.success) {
        showToast('Data PM berhasil ditambahkan', 'success');
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
    <Dialog title="Tambah Penerima Manfaat Baru" onClose={onClose} closeDisabled={submitting} maxWidth="max-w-2xl">
        <form onSubmit={handleSubmit}>
          {/* Baris 1: NAMA PM dan NIK */}
          <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div><label htmlFor="tambah-nama-pm" className="block text-sm font-medium">Nama PM *</label><input id="tambah-nama-pm" className="min-h-11 w-full rounded-lg border p-2" value={form['NAMA PM']} onChange={e => handleChange('NAMA PM', e.target.value)} required /></div>
            <div><label htmlFor="tambah-nik" className="block text-sm font-medium">NIK</label><input id="tambah-nik" inputMode="numeric" maxLength={16} className="min-h-11 w-full rounded-lg border p-2 numeric" value={form['NIK']} onChange={e => handleIdentityNumber('NIK', e.target.value)} aria-describedby="tambah-nik-help" /><p id="tambah-nik-help" className="mt-1 text-xs text-gray-500">16 digit angka</p></div>
          </div>
          {/* Baris 2: NAMA PM ALT dan NIK ALT */}
          <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div><label htmlFor="tambah-nama-alt" className="block text-sm font-medium">Nama PM alternatif</label><input id="tambah-nama-alt" className="min-h-11 w-full rounded-lg border p-2" value={form['NAMA PM ALT']} onChange={e => handleChange('NAMA PM ALT', e.target.value)} /></div>
            <div><label htmlFor="tambah-nik-alt" className="block text-sm font-medium">NIK alternatif</label><input id="tambah-nik-alt" inputMode="numeric" maxLength={16} className="min-h-11 w-full rounded-lg border p-2 numeric" value={form['NIK ALT']} onChange={e => handleIdentityNumber('NIK ALT', e.target.value)} aria-describedby="tambah-nik-alt-help" /><p id="tambah-nik-alt-help" className="mt-1 text-xs text-gray-500">16 digit angka</p></div>
          </div>
          {/* Baris 3: NO KK dan NO HP */}
          <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div><label htmlFor="tambah-no-kk" className="block text-sm font-medium">Nomor KK</label><input id="tambah-no-kk" inputMode="numeric" maxLength={16} className="min-h-11 w-full rounded-lg border p-2 numeric" value={form['NO KK']} onChange={e => handleIdentityNumber('NO KK', e.target.value)} aria-describedby="tambah-kk-help" /><p id="tambah-kk-help" className="mt-1 text-xs text-gray-500">16 digit angka</p></div>
            <div><label htmlFor="tambah-no-hp" className="block text-sm font-medium">Nomor HP</label><input id="tambah-no-hp" inputMode="tel" className="min-h-11 w-full rounded-lg border p-2" value={form['NO HP']} onChange={e => handleChange('NO HP', e.target.value)} /></div>
          </div>
          {/* Baris 4: ALAMAT DAN DAERAH */}
          <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div><label htmlFor="tambah-alamat" className="block text-sm font-medium">Alamat</label><input id="tambah-alamat" className="min-h-11 w-full rounded-lg border p-2" value={form['ALAMAT']} onChange={e => handleChange('ALAMAT', e.target.value)} /></div>
            <div><label htmlFor="tambah-daerah" className="block text-sm font-medium">Daerah</label><select id="tambah-daerah" className="min-h-11 w-full rounded-lg border p-2" value={form['DAERAH']} onChange={e => handleChange('DAERAH', e.target.value)}><option value="">-- Pilih Daerah --</option>{refData.daerah.map(d => <option key={d}>{d}</option>)}</select></div>
          </div>
          {/* Baris 5: ASNAF dan PEKERJAAN */}
          <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div><label htmlFor="tambah-asnaf" className="block text-sm font-medium">Asnaf</label><select id="tambah-asnaf" className="min-h-11 w-full rounded-lg border p-2" value={form['ASNAF']} onChange={e => handleChange('ASNAF', e.target.value)}><option value="">-- Pilih Asnaf --</option>{refData.asnaf.map(a => <option key={a}>{a}</option>)}</select></div>
            <div><label htmlFor="tambah-pekerjaan" className="block text-sm font-medium">Pekerjaan</label><input id="tambah-pekerjaan" className="min-h-11 w-full rounded-lg border p-2" value={form['PEKERJAAN']} onChange={e => handleChange('PEKERJAAN', e.target.value)} /></div>
          </div>
          {/* Baris 6: CATATAN (full width) */}
          <div className="mb-3">
            <label htmlFor="tambah-catatan" className="block text-sm font-medium">Catatan</label>
            <textarea id="tambah-catatan" className="w-full rounded-lg border p-2" rows={2} value={form['CATATAN']} onChange={e => handleChange('CATATAN', e.target.value)} placeholder="Catatan tambahan (opsional)" />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={onClose} disabled={submitting} className="min-h-11 px-4 py-2 border rounded-lg">Batal</button>
            <button type="submit" disabled={submitting} className="min-h-11 px-4 py-2 bg-teal-600 text-white rounded-lg disabled:opacity-50">{submitting ? 'Menyimpan...' : 'Simpan'}</button>
          </div>
        </form>
    </Dialog>
  );
}
