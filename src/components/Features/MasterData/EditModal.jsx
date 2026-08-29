import { useState } from 'react';
import { useData } from '@/hooks/useData';
import { useToast } from '@/hooks/useToast';
import Dialog from '@/components/Common/Dialog';

export default function EditModal({ item, onClose, onSave }) {
  const { refData } = useData();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    'NAMA PM': item['NAMA PM'],
    'NIK': item['NIK'],
    'NAMA PM ALT': item['NAMA PM ALT'],
    'NIK ALT': item['NIK ALT'],
    'NO KK': item['NO KK'],
    'ALAMAT': item['ALAMAT'],
    'DAERAH': item['DAERAH'],
    'NO HP': item['NO HP'],
    'ASNAF': item['ASNAF'],
    'PEKERJAAN': item['PEKERJAAN'],
    'CATATAN': item['CATATAN'] || ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async () => {
    for (const field of ['NIK', 'NIK ALT', 'NO KK']) {
      if (form[field] && String(form[field]).length !== 16) {
        showToast(`${field} harus terdiri dari 16 digit`, 'error');
        return;
      }
    }
    setSubmitting(true);
    try {
      const result = await onSave(item['ID PM'], form);
      if (result.success) {
        showToast('Data PM berhasil diperbarui', 'success');
        onClose();
      } else {
        showToast('Gagal update: ' + (result.error || 'Unknown error'), 'error');
      }
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog title="Edit Data PM" onClose={onClose} closeDisabled={submitting} maxWidth="max-w-lg">
        <div className="space-y-3">
          {/* Sama seperti Tambah, tapi tanpa ID PM dan tidak perlu checkbox dll */}
          {/* Render semua field termasuk CATATAN */}
          {Object.keys(form).map(k => {
            const fieldId = `edit-pm-${k.toLowerCase().replace(/\s+/g, '-')}`;
            return (
            <div key={k}>
              <label htmlFor={fieldId} className="block text-sm font-medium">{k}</label>
              {k === 'ASNAF' ? (
                <select id={fieldId} className="min-h-11 w-full rounded-lg border p-2" value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })}>
                  <option value="">-- Pilih Asnaf --</option>
                  {refData.asnaf.map(a => <option key={a}>{a}</option>)}
                </select>
              ) : k === 'DAERAH' ? (
                <select id={fieldId} className="min-h-11 w-full rounded-lg border p-2" value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })}>
                  <option value="">-- Pilih Daerah --</option>
                  {refData.daerah.map(d => <option key={d}>{d}</option>)}
                </select>
              ) : k === 'CATATAN' ? (
                <textarea id={fieldId} className="w-full rounded-lg border p-2" rows={2} value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} placeholder="Catatan tambahan" />
              ) : ['NIK', 'NIK ALT', 'NO KK'].includes(k) ? (
                <input id={fieldId} inputMode="numeric" maxLength={16} className="min-h-11 w-full rounded-lg border p-2 numeric" value={form[k] || ''} onChange={e => setForm({ ...form, [k]: e.target.value.replace(/\D/g, '').slice(0, 16) })} />
              ) : (
                <input id={fieldId} className="min-h-11 w-full rounded-lg border p-2" value={form[k] || ''} onChange={e => setForm({ ...form, [k]: e.target.value })} />
              )}
            </div>
            );
          })}
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} disabled={submitting} className="min-h-11 px-4 py-2 border rounded-lg">Batal</button>
          <button onClick={handleSave} disabled={submitting} className={`min-h-11 px-4 py-2 rounded-lg text-white ${submitting ? 'bg-gray-400' : 'bg-teal-600'}`}>
            {submitting ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
    </Dialog>
  );
}
