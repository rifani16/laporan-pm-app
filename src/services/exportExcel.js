// Kolom: { header, value: row => any, number?: boolean, width? }.
// Teks selalu ditulis sebagai String supaya NIK 16 digit tidak dibulatkan Excel.
export const toExcelColumns = (columns) => columns.map(({ header, value, number, width }) => ({
  header: { value: header, fontWeight: 'bold' },
  cell: (row) => {
    const raw = value(row);
    if (raw === '' || raw == null) return { value: null };
    return number
      ? { value: Number(raw) || 0, type: Number, format: '#,##0' }
      : { value: String(raw), type: String };
  },
  width
}));

export async function downloadExcel(fileName, rows, columns) {
  const { default: writeExcelFile } = await import('write-excel-file/browser');
  await writeExcelFile(rows, { columns: toExcelColumns(columns), stickyRowsCount: 1 }).toFile(fileName);
}

export const todayStamp = () => new Date().toLocaleDateString('sv-SE');
