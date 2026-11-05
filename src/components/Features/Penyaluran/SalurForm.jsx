import { useState, useMemo, useId } from 'react';
import { useData } from '@/hooks/useData';
import { useToast } from '@/hooks/useToast';
import { EMPTY_SALUR_FORM, getNamaOptions, toggleBentuk, buildSalurPayload } from './salurFields';
import KegiatanSelect from './KegiatanSelect';

export default function SalurForm() {
  const { masterData, kegiatanList, createSalur } = useData();
  const { showToast } = useToast();
  const [selectedPmId, setSelectedPmId] = useState('');
  const [namaPenerima, setNamaPenerima] = useState('');
  const [form, setForm] = useState(EMPTY_SALUR_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const pmListId = useId();

  const pmOptions = useMemo(() => {
    return masterData.map(pm => ({
      id: pm['ID PM'],
      label: `${pm['ID PM']} - ${pm['NAMA PM']}${pm['DAERAH'] ? ` (${pm['DAERAH']})` : ''}`
    }));
  }, [masterData]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    const match = pmOptions.find(opt => opt.label === value);
    setSearchTerm(value);
    setSelectedPmId(match ? match.id : '');
    setNamaPenerima('');
    if (match) setForm(EMPTY_SALUR_FORM);
  };

  const selectedPm = masterData.find(p => p['ID PM'] === selectedPmId);
  const namaOptions = getNamaOptions(selectedPm);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { error, payload } = buildSalurPayload(selectedPm, namaPenerima, form);
    if (error) return showToast(error, 'error');

    setSubmitting(true);
    try {
      const result = await createSalur(payload);
      if (result.success) {
        showToast('Transaksi penyaluran berhasil disimpan', 'success');
        setSelectedPmId('');
        setSearchTerm('');
        setNamaPenerima('');
        setForm(EMPTY_SALUR_FORM);
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
      <h2 className="mb-4 text-xl font-bold">Form Penyaluran Bantuan</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="pm-search" className="block text-sm font-medium">Cari / Pilih ID PM atau Nama PM</label>
          <input
            id="pm-search"
            type="text"
            list={pmListId}
            className="min-h-11 w-full rounded-lg border bg-white p-2"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Ketik ID PM atau nama..."
            autoComplete="off"
          />
          <datalist id={pmListId}>
            {pmOptions.map(opt => <option key={opt.id} value={opt.label} />)}
          </datalist>
          {searchTerm && !selectedPm && (
            <p className="mt-1 text-sm text-gray-600">Pilih PM dari daftar saran yang muncul saat mengetik.</p>
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

        <KegiatanSelect
          kegiatanList={kegiatanList}
          value={form.ID_KEGIATAN}
          onChange={id => setForm({ ...form, ID_KEGIATAN: id })}
        />

        <div>
          <label className="block text-sm font-medium">Bentuk Penerimaan</label>
          <div className="flex gap-4 mt-1">
            <label className="flex min-h-11 items-center gap-2">
              <input type="checkbox" checked={form.BENTUK_PENERIMAAN.uang} onChange={() => setForm(toggleBentuk(form, 'uang'))} />
              Uang
            </label>
            <label className="flex min-h-11 items-center gap-2">
              <input type="checkbox" checked={form.BENTUK_PENERIMAAN.barang} onChange={() => setForm(toggleBentuk(form, 'barang'))} />
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
