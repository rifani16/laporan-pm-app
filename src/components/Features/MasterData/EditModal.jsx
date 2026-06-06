import { useState } from 'react';
import { useData } from '@/hooks/useData';
import { useToast } from '@/hooks/useToast';

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
    'NO HP': item['NO HP'],
    'ASNAF': item['ASNAF'],
    'PEKERJAAN': item['PEKERJAAN'],
    'DAERAH': item['DAERAH']
  });

  const handleSave = async () => {
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
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full p-5">
        <h2 className="text-xl font-bold mb-4">Edit Data PM</h2>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {Object.keys(form).map(k => (
            <div key={k}>
              <label className="block text-sm font-medium">{k}</label>
              {k === 'ASNAF' ? (
                <select className="w-full border rounded p-2" value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })}>
                  {refData.asnaf.map(a => <option key={a}>{a}</option>)}
                </select>
              ) : k === 'DAERAH' ? (
                <select className="w-full border rounded p-2" value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })}>
                  {refData.daerah.map(d => <option key={d}>{d}</option>)}
                </select>
              ) : (
                <input className="w-full border rounded p-2" value={form[k] || ''} onChange={e => setForm({ ...form, [k]: e.target.value })} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 border rounded">Batal</button>
          <button onClick={handleSave} className="px-4 py-2 bg-teal-600 text-white rounded">Simpan</button>
        </div>
      </div>
    </div>
  );
}