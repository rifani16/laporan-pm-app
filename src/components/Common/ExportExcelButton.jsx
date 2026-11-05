import { useState } from 'react';
import { Download } from 'lucide-react';
import { downloadExcel, todayStamp } from '../../services/exportExcel';
import { useToast } from '../../hooks/useToast';

export default function ExportExcelButton({ fileName, rows, columns }) {
  const { showToast } = useToast();
  const [exporting, setExporting] = useState(false);

  const handleClick = async () => {
    setExporting(true);
    try {
      const safeName = fileName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      await downloadExcel(`${safeName}-${todayStamp()}.xlsx`, rows, columns);
    } catch (err) {
      showToast('Gagal membuat file Excel: ' + err.message, 'error');
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={exporting || rows.length === 0}
      title={rows.length === 0 ? 'Tidak ada data untuk diunduh' : undefined}
      className="inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
    >
      <Download size={16} aria-hidden="true" />
      {exporting ? 'Menyiapkan...' : `Unduh Excel (${rows.length.toLocaleString('id-ID')})`}
    </button>
  );
}
