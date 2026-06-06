import { useState } from 'react';
import { useData } from '@/hooks/useData';
import { useToast } from '@/hooks/useToast';

export default function EditSalurModal({ data, onClose, onSave }) {
  const { masterData, refData } = useData();
  const { showToast } = useToast();

  // Helper functions (bukan hooks)
  const parseBentukPenerimaan = (str) => {
    if (!str) return { uang: false, barang: false };
    return {
      uang: str.includes('Uang'),
      barang: str.includes('Barang')
    };
  };

  // Nilai awal dengan fallback aman
  const initialJumlah = (data && data['JUMLAH_PENERIMAAN'] != null) ? data['JUMLAH_PENERIMAAN'] : '';
  const initialPmId = (data && data['ID PM']) ? data['ID PM'] : '';
  const initialNama = (data && data['NAMA PM']) ? data['NAMA PM'] : '';
  const initialProgram = (data && data['PROGRAM']) ? data['PROGRAM'] : '';
  const initialBentuk = (data && data['BENTUK PENERIMAAN']) ? parseBentukPenerimaan(data['BENTUK PENERIMAAN']) : { uang: false, barang: false };

  // Semua hooks dipanggil di sini (sebelum conditional return)
  const [selectedPmId, setSelectedPmId] = useState(initialPmId);
  const [namaChoice, setNamaChoice] = useState(initialNama);
  const [form, setForm] = useState({
    PROGRAM: initialProgram,
    BENTUK_PENERIMAAN: initialBentuk,
    JUMLAH_PENERIMAAN: initialJumlah
  });
  const [submitting, setSubmitting] = useState(false);

  // Conditional return setelah semua hooks
  if (!data) return null;

  const selectedPm = masterData.find(p => p['ID PM'] === selectedPmId);
  const namaOptions = selectedPm
    ? [
        { label: selectedPm['NAMA PM'], nik: selectedPm['NIK'], daerah: selectedPm['DAERAH'], alamat: selectedPm['ALAMAT'] },
        { label: selectedPm['NAMA PM ALT'], nik: selectedPm['NIK ALT'], daerah: selectedPm['DAERAH'], alamat: selectedPm['ALAMAT'] }
      ].filter(o => o.label)
    : [];

  const handlePmChange = (e) => {
    const newId = e.target.value;
    setSelectedPmId(newId);
    setNamaChoice('');
    // Optional: reset bentuk dan jumlah saat ganti PM
  };

  const handleCheckboxChange = (type) => {
    setForm(prev => ({
      ...prev,
      BENTUK_PENERIMAAN: {
        ...prev.BENTUK_PENERIMAAN,
        [type]: !prev.BENTUK_PENERIMAAN[type]
      }
    }));
  };

  const handleSubmit = async () => {
    if (!selectedPmId) {
      showToast('Pilih ID PM', 'error');
      return;
    }
    if (!namaChoice) {
      showToast('Pilih nama penerima', 'error');
      return;
    }
    if (!form.PROGRAM) {
      showToast('Pilih program', 'error');
      return;
    }
    const { uang, barang } = form.BENTUK_PENERIMAAN;
    if (!uang && !barang) {
      showToast('Pilih bentuk penerimaan', 'error');
      return;
    }
    const jumlah = Number(form.JUMLAH_PENERIMAAN);
    if (isNaN(jumlah) || jumlah <= 0) {
      showToast('Jumlah penerimaan harus >0', 'error');
      return;
    }

    const bentukArr = [];
    if (uang) bentukArr.push('Uang');
    if (barang) bentukArr.push('Barang');
    const bentukPenerimaan = bentukArr.join(', ');

    const selected = namaOptions.find(o => o.label === namaChoice);
    if (!selected) {
      showToast('Nama penerima tidak valid', 'error');
      return;
    }

    const payload = {
      'ID SALUR': data['ID SALUR'],
      'ID PM': selectedPmId,
      'NAMA PM': namaChoice,
      'NIK': selected.nik,
      'DAERAH': selected.daerah,
      'ALAMAT': selected.alamat,
      'PROGRAM': form.PROGRAM,
      'BENTUK PENERIMAAN': bentukPenerimaan,
      'JUMLAH_PENERIMAAN': jumlah
    };

    console.log('Payload edit:', payload);

    setSubmitting(true);
    try {
      const result = await onSave(payload);
      if (result && result.success) {
        showToast('Transaksi berhasil diperbarui', 'success');
        onClose();
      } else {
        showToast('Gagal: ' + (result?.error || 'Unknown error'), 'error');
      }
    } catch (err) {
      console.error(err);
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
          {/* ID PM */}
          <div>
            <label className="block text-sm font-medium">ID PM</label>
            <select
              className="w-full border rounded p-2"
              value={selectedPmId}
              onChange={handlePmChange}
            >
              <option value="">-- Pilih ID PM --</option>
              {masterData.map(pm => (
                <option key={pm['ID PM']} value={pm['ID PM']}>
                  {pm['ID PM']} - {pm['NAMA PM']}
                </option>
              ))}
            </select>
          </div>
          {/* Nama Penerima */}
          {selectedPmId && (
            <div>
              <label className="block text-sm font-medium">Nama Penerima</label>
              <select
                className="w-full border rounded p-2"
                value={namaChoice}
                onChange={e => setNamaChoice(e.target.value)}
              >
                <option value="">-- Pilih Nama --</option>
                {namaOptions.map(o => (
                  <option key={o.label} value={o.label}>{o.label}</option>
                ))}
              </select>
            </div>
          )}
          {/* Program */}
          <div>
            <label className="block text-sm font-medium">Program</label>
            <select
              className="w-full border rounded p-2"
              value={form.PROGRAM}
              onChange={e => setForm({ ...form, PROGRAM: e.target.value })}
            >
              <option value="">-- Pilih Program --</option>
              {refData.program.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          {/* Bentuk Penerimaan */}
          <div>
            <label className="block text-sm font-medium">Bentuk Penerimaan</label>
            <div className="flex gap-4 mt-1">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.BENTUK_PENERIMAAN.uang}
                  onChange={() => handleCheckboxChange('uang')}
                /> Uang
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.BENTUK_PENERIMAAN.barang}
                  onChange={() => handleCheckboxChange('barang')}
                /> Barang
              </label>
            </div>
          </div>
          {/* Jumlah Penerimaan */}
          <div>
            <label className="block text-sm font-medium">Jumlah Penerimaan (Rp)</label>
            <input
              type="number"
              className="w-full border rounded p-2"
              value={form.JUMLAH_PENERIMAAN}
              onChange={e => setForm({ ...form, JUMLAH_PENERIMAAN: e.target.value })}
              placeholder="Nominal dalam Rupiah"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 border rounded">Batal</button>
          <button onClick={handleSubmit} disabled={submitting} className="px-4 py-2 bg-teal-600 text-white rounded">
            {submitting ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  );
}