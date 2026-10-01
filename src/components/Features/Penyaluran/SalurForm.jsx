import { useState, useMemo, useRef, useEffect, useId } from 'react';
import { useData } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

const MAX_VISIBLE_PM_OPTIONS = 50;

export default function SalurForm() {
  const { masterData, refData, createSalur } = useData();
  const { isSuperAdmin, userDaerah } = useAuth();
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
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapperRef = useRef(null);
  const listboxId = useId();

  const scopedMasterData = useMemo(() => {
    if (!isSuperAdmin && userDaerah) {
      return masterData.filter(pm => pm['DAERAH'] === userDaerah);
    }
    return masterData;
  }, [masterData, isSuperAdmin, userDaerah]);

  const pmOptions = useMemo(() => {
    return scopedMasterData.map(pm => ({
      id: pm['ID PM'],
      label: `${pm['ID PM']} - ${pm['NAMA PM']}${isSuperAdmin && pm['DAERAH'] ? ` (${pm['DAERAH']})` : ''}`,
      nama: pm['NAMA PM']
    }));
  }, [scopedMasterData, isSuperAdmin]);

  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return pmOptions;
    const term = searchTerm.toLowerCase();
    return pmOptions.filter(opt => 
      String(opt.id).toLowerCase().includes(term) ||
      String(opt.nama).toLowerCase().includes(term) ||
      String(opt.label).toLowerCase().includes(term)
    );
  }, [searchTerm, pmOptions]);

  const visibleOptions = useMemo(
    () => filteredOptions.slice(0, MAX_VISIBLE_PM_OPTIONS),
    [filteredOptions]
  );

  const clampedActiveIndex = visibleOptions.length === 0 ? 0 : Math.min(activeIndex, visibleOptions.length - 1);

  const handleSelectPm = (pm) => {
    setSelectedPmId(pm.id);
    setSearchTerm(pm.label);
    setShowDropdown(false);
    setActiveIndex(0);
    setNamaPenerima('');
    setForm({ PROGRAM: '', BENTUK_PENERIMAAN: { uang: false, barang: false }, JUMLAH_PENERIMAAN: '', KETERANGAN: '' });
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    setShowDropdown(true);
    setActiveIndex(0);
    setSelectedPmId('');
    setNamaPenerima('');
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setShowDropdown(true);
      if (visibleOptions.length > 0) {
        setActiveIndex(index => Math.min(index + 1, visibleOptions.length - 1));
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex(index => Math.max(index - 1, 0));
    } else if (event.key === 'Enter' && showDropdown && visibleOptions[clampedActiveIndex]) {
      event.preventDefault();
      handleSelectPm(visibleOptions[clampedActiveIndex]);
    } else if (event.key === 'Escape') {
      setShowDropdown(false);
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

  const selectedPm = scopedMasterData.find(p => p['ID PM'] === selectedPmId);
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
      'DAERAH': selectedPm['DAERAH'] || (!isSuperAdmin ? userDaerah : ''),
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
    <div className="max-w-2xl rounded-xl bg-white p-4 shadow sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Form Penyaluran Bantuan</h2>
        {!isSuperAdmin && userDaerah && (
          <span className="text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded font-medium">
            {userDaerah}
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative" ref={wrapperRef}>
          <label htmlFor="pm-search" className="block text-sm font-medium">Cari / Pilih ID PM atau Nama PM</label>
          <input
            id="pm-search"
            type="text"
            className="min-h-11 w-full rounded-lg border bg-white p-2"
            value={searchTerm}
            onChange={handleInputChange}
            onKeyDown={handleSearchKeyDown}
            onFocus={() => { setShowDropdown(true); setActiveIndex(0); }}
            placeholder="Ketik ID PM atau nama..."
            autoComplete="off"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={showDropdown}
            aria-haspopup="listbox"
            aria-controls={listboxId}
            aria-activedescendant={showDropdown && visibleOptions[activeIndex] ? `${listboxId}-option-${activeIndex}` : undefined}
          />
          {showDropdown && (
            <ul id={listboxId} role="listbox" className="absolute z-10 max-h-60 w-full overflow-y-auto rounded-lg border bg-white shadow-md">
              {visibleOptions.map((opt, index) => (
                <li
                  id={`${listboxId}-option-${index}`}
                  role="option"
                  aria-selected={activeIndex === index}
                  key={opt.id}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={event => { event.preventDefault(); handleSelectPm(opt); }}
                  className={`cursor-pointer px-3 py-3 text-sm ${activeIndex === index ? 'bg-teal-50 text-teal-900' : 'hover:bg-gray-100'}`}
                >
                  {opt.label}
                </li>
              ))}
              {visibleOptions.length === 0 && <li className="px-3 py-3 text-sm text-gray-500">PM tidak ditemukan.</li>}
              {filteredOptions.length > MAX_VISIBLE_PM_OPTIONS && (
                <li className="px-3 py-2 text-xs text-gray-500 bg-gray-50">
                  Ketik ID atau nama untuk mempersempit {filteredOptions.length} hasil.
                </li>
              )}
            </ul>
          )}
        </div>

        {selectedPm && (
          <div>
            <label htmlFor="nama-penerima" className="block text-sm font-medium">Pilih Nama Penerima</label>
            <select
              id="nama-penerima"
              className="min-h-11 w-full rounded-lg border bg-white p-2"
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
          <label htmlFor="program-salur" className="block text-sm font-medium">Program</label>
          <select
            id="program-salur"
            className="min-h-11 w-full rounded-lg border bg-white p-2"
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
            <label className="flex min-h-11 items-center gap-2">
              <input type="checkbox" checked={form.BENTUK_PENERIMAAN.uang} onChange={() => handleCheckboxChange('uang')} />
              Uang
            </label>
            <label className="flex min-h-11 items-center gap-2">
              <input type="checkbox" checked={form.BENTUK_PENERIMAAN.barang} onChange={() => handleCheckboxChange('barang')} />
              Barang
            </label>
          </div>
        </div>

        <div>
          <label htmlFor="jumlah-penerimaan" className="block text-sm font-medium">Jumlah Penerimaan (Rp)</label>
          <input
            id="jumlah-penerimaan"
            type="number"
            className="min-h-11 w-full rounded-lg border bg-white p-2 numeric"
            value={form.JUMLAH_PENERIMAAN}
            onChange={e => setForm({ ...form, JUMLAH_PENERIMAAN: e.target.value })}
            placeholder="Nominal dalam Rupiah"
            required
          />
        </div>

        <div>
          <label htmlFor="keterangan-salur" className="block text-sm font-medium">Keterangan</label>
          <textarea
            id="keterangan-salur"
            className="w-full rounded-lg border bg-white p-2"
            value={form.KETERANGAN}
            onChange={e => setForm({ ...form, KETERANGAN: e.target.value })}
            rows={2}
            placeholder="Catatan tambahan (opsional)"
          />
        </div>

        <button type="submit" disabled={submitting} className="min-h-11 w-full rounded-lg bg-teal-600 px-4 py-2 font-medium text-white hover:bg-teal-700 disabled:opacity-50">
          {submitting ? 'Menyimpan...' : 'Simpan Penyaluran'}
        </button>
      </form>
    </div>
  );
}
