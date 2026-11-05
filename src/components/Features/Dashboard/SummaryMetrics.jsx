export default function SummaryMetrics({ salurData }) {
  const totalPenerima = new Set(salurData.map(s => s['ID PM']).filter(Boolean)).size;
  const totalTransaksi = salurData.length;
  const totalDana = salurData.reduce((sum, s) => sum + (Number(s['JUMLAH PENERIMAAN']) || 0), 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white rounded-lg shadow p-5">
        <p className="text-gray-500 text-sm">Total Penerima Manfaat</p>
        <p className="numeric text-3xl font-bold text-gray-800">{totalPenerima.toLocaleString('id-ID')}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-5">
        <p className="text-gray-500 text-sm">Total Transaksi Penyaluran</p>
        <p className="numeric text-3xl font-bold text-gray-800">{totalTransaksi.toLocaleString('id-ID')}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-5">
        <p className="text-gray-500 text-sm">Total Dana Tersalurkan</p>
        <p className="numeric text-3xl font-bold text-gray-800">Rp {totalDana.toLocaleString('id-ID')}</p>
      </div>
    </div>
  );
}
