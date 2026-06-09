import { useState, useMemo, useRef, useEffect } from 'react';
import { useData } from '@/hooks/useData';
import { useToast } from '@/hooks/useToast';

export default function SalurForm() {
  const { masterData, refData, createSalur } = useData();
  const { showToast } = useToast();
  const [selectedPmId, setSelectedPmId] = useState('');
  const [namaPenerima, setNamaPenerima] = useState('');
  const [form, setForm] = useState({
    PROGRAM: '',
    BENTUK_PENERIMAAN: { uang: false, barang: false },
    JUMLAH_PENERIMAAN: '',
    KETERANGAN: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef(null);

  const pmOptions = useMemo(() => {
    return masterData.map(pm => ({
      id: pm['ID PM'],
      label: `${pm['ID PM']} - ${pm['NAMA PM']}`,
      nama: pm['NAMA PM']
    }));
  }, [masterData]);

  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return pmOptions;
    const term = searchTerm.toLowerCase();
    return pmOptions.filter(opt => 
      opt.id.toLowerCase().includes(term) || 
      opt.nama.toLowerCase().includes(term)
    );
  }, [searchTerm, pmOptions]);

  const handleSelectPm = (pm) => {
    setSelectedPmId(pm.id);
    setSearchTerm(pm.label);
    setShowDropdown(false);
    setNamaPenerima('');
    setForm({ PROGRAM: '', BENTUK_PENERIMAAN: { uang: false, barang: false }, JUMLAH_PENERIMAAN: '', KETERANGAN: '' });
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    setShowDropdown(true);
    if (e.target.value === '') {
      setSelectedPmId('');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedPm = masterData.find(p => p['ID PM'] === selectedPmId);
  const namaOptions = selectedPm
    ? [
        { label: selectedPm['NAMA PM'], nik: selectedPm['NIK'] },
        { label: selectedPm['NAMA PM ALT'], nik: selectedPm['NIK ALT'] }
      ].filter(o => o.label)
    : [];

  const handleCheckboxChange = (type) => {
    setForm(prev => ({
      ...prev,
      BENTUK_PENERIMAAN: {
        ...prev.BENTUK_PENERIMAAN,
        [type]: !prev.BENTUK_PENERIMAAN[type]
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPmId) return showToast('Pilih ID PM', 'error');
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
      'ID PM': selectedPmId,
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
      const result = await createSalur(payload);
      if (result.success) {
        showToast('Transaksi penyaluran berhasil disimpan', 'success');
        setSelectedPmId('');
        setSearchTerm('');
        setNamaPenerima('');
        setForm({ PROGRAM: '', BENTUK_PENERIMAAN: { uang: false, barang: false }, JUMLAH_PENERIMAAN: '', KETERANGAN: '' });
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
    <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
      <h2 className="text-xl font-bold mb-4">Form Penyaluran Bantuan</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative" ref={wrapperRef}>
          <label className="block text-sm font-medium">Cari/ Pilih ID PM atau Nama PM</label>
          <input
            type="text"
            className="w-full border rounded p-2 bg-white"
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={() => setShowDropdown(true)}
            placeholder="Ketik ID PM atau nama..."
            autoComplete="off"
          />
          {showDropdown && filteredOptions.length > 0 && (
            <ul className="absolute z-10 w-full bg-white border rounded shadow-md max-h-60 overflow-y-auto">
              {filteredOptions.map(opt => (
                <li key={opt.id} onClick={() => handleSelectPm(opt)} className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm">
                  {opt.label}
                </li>
              ))}
            </ul>
          )}
        </div>

        {selectedPm && (
          <div>
            <label className="block text-sm font-medium">Pilih Nama Penerima</label>
            <select
              className="w-full border rounded p-2 bg-white"
              value={namaPenerima}
              onChange={e => setNamaPenerima(e.target.value)}
              required
            >
              <option value="">-- Pilih Nama --</option>
              {namaOptions.map(o => <option key={o.label} value={o.label}>{o.label}</option>)}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium">Program</label>
          <select
            className="w-full border rounded p-2 bg-white"
            value={form.PROGRAM}
            onChange={e => setForm({ ...form, PROGRAM: e.target.value })}
            required
          >
            <option value="">Pilih Program</option>
            {refData.program.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Bentuk Penerimaan</label>
          <div className="flex gap-4 mt-1">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.BENTUK_PENERIMAAN.uang} onChange={() => handleCheckboxChange('uang')} />
              Uang
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.BENTUK_PENERIMAAN.barang} onChange={() => handleCheckboxChange('barang')} />
              Barang
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Jumlah Penerimaan (Rp)</label>
          <input
            type="number"
            className="w-full border rounded p-2 bg-white"
            value={form.JUMLAH_PENERIMAAN}
            onChange={e => setForm({ ...form, JUMLAH_PENERIMAAN: e.target.value })}
            placeholder="Nominal dalam Rupiah"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Keterangan</label>
          <textarea
            className="w-full border rounded p-2 bg-white"
            value={form.KETERANGAN}
            onChange={e => setForm({ ...form, KETERANGAN: e.target.value })}
            rows={2}
            placeholder="Catatan tambahan (opsional)"
          />
        </div>

        <button type="submit" disabled={submitting} className="bg-teal-600 text-white px-4 py-2 rounded w-full hover:bg-teal-700">
          {submitting ? 'Menyimpan...' : 'Simpan Penyaluran'}
        </button>
      </form>
    </div>
  );
}