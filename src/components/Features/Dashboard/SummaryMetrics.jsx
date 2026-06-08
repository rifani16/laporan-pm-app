export default function SummaryMetrics({ salurData}) {
  // Hitung jumlah unik ID PM dari data salur yang sudah difilter
  const uniquePmIds = new Set();
  salurData.forEach(s => {
    if (s['ID PM']) uniquePmIds.add(s['ID PM']);
  });
  const totalPenerima = uniquePmIds.size;
  const totalTransaksi = salurData.length;
  const totalDana = salurData.reduce((sum, s) => sum + (Number(s['JUMLAH PENERIMAAN']) || 0), 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white rounded-lg shadow p-5 border-l-8 border-teal-500">
        <p className="text-gray-500 text-sm">Total Penerima Manfaat</p>
        <p className="text-3xl font-bold text-gray-800">{totalPenerima}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-5 border-l-8 border-teal-500">
        <p className="text-gray-500 text-sm">Total Transaksi Penyaluran</p>
        <p className="text-3xl font-bold text-gray-800">{totalTransaksi}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-5 border-l-8 border-teal-500">
        <p className="text-gray-500 text-sm">Total Dana Tersalurkan</p>
        <p className="text-3xl font-bold text-gray-800">Rp {totalDana.toLocaleString()}</p>
      </div>
    </div>
  );
}