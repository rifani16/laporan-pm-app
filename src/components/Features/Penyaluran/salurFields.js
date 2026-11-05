export const EMPTY_SALUR_FORM = {
  PROGRAM: '',
  BENTUK_PENERIMAAN: { uang: false, barang: false },
  JUMLAH_PENERIMAAN: '',
  KETERANGAN: ''
};

export const getNamaOptions = (pm) => (pm
  ? [
      { label: pm['NAMA PM'], nik: pm['NIK'] },
      { label: pm['NAMA PM ALT'], nik: pm['NIK ALT'] }
    ].filter(o => o.label)
  : []);

export const toggleBentuk = (form, type) => ({
  ...form,
  BENTUK_PENERIMAAN: { ...form.BENTUK_PENERIMAAN, [type]: !form.BENTUK_PENERIMAAN[type] }
});

// Hasil: { error } bila form belum valid, atau { payload } siap kirim.
export function buildSalurPayload(pm, namaPenerima, form) {
  if (!pm) return { error: 'Pilih ID PM' };
  if (!namaPenerima) return { error: 'Pilih nama penerima' };
  if (!form.PROGRAM) return { error: 'Pilih program' };
  const { uang, barang } = form.BENTUK_PENERIMAAN;
  if (!uang && !barang) return { error: 'Pilih bentuk penerimaan' };
  const jumlah = Number(form.JUMLAH_PENERIMAAN);
  if (isNaN(jumlah) || jumlah <= 0) return { error: 'Jumlah penerimaan harus >0' };
  const selected = getNamaOptions(pm).find(o => o.label === namaPenerima);
  if (!selected) return { error: 'Nama penerima tidak valid' };

  return {
    payload: {
      'ID PM': pm['ID PM'],
      'NAMA PENERIMA': namaPenerima,
      'NIK PENERIMA': selected.nik,
      'DAERAH': pm['DAERAH'] || '',
      'ALAMAT': pm['ALAMAT'] || '',
      'PROGRAM': form.PROGRAM,
      'BENTUK PENERIMAAN': [uang && 'Uang', barang && 'Barang'].filter(Boolean).join(', '),
      'JUMLAH PENERIMAAN': jumlah,
      'KETERANGAN': form.KETERANGAN
    }
  };
}
