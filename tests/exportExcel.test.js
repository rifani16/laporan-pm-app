import { describe, it, expect } from 'vitest';
import { toExcelColumns } from '../src/services/exportExcel.js';

describe('toExcelColumns', () => {
  const [nik, jumlah] = toExcelColumns([
    { header: 'NIK', value: r => r.nik },
    { header: 'Jumlah', value: r => r.jumlah, number: true }
  ]);

  it('writes NIK as text so Excel keeps all 16 digits', () => {
    expect(nik.cell({ nik: 3201234567890123 })).toEqual({ value: '3201234567890123', type: String });
  });

  it('writes amounts as formatted numbers', () => {
    expect(jumlah.cell({ jumlah: '1500000' })).toEqual({ value: 1500000, type: Number, format: '#,##0' });
  });

  it('leaves empty values as empty cells', () => {
    expect(nik.cell({ nik: '' })).toEqual({ value: null });
    expect(jumlah.cell({})).toEqual({ value: null });
  });
});
