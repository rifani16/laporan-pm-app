import { useState } from 'react';
import EditModal from './EditModal';
import DetailPmModal from './DetailPmModal';
import Pagination from '@/components/Common/Pagination';

export default function MasterTable({ data, onUpdate }) {
  const [editItem, setEditItem] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const totalPages = Math.ceil(data.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginated = data.slice(startIndex, startIndex + rowsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">No</th>
              <th className="p-2 text-left">Nama PM</th>
              <th className="p-2 text-left">Daerah</th>
              <th className="p-2 text-left">Total Penerimaan</th>
              <th className="p-2 text-left">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((pm, idx) => (
              <tr key={pm['ID PM']} className="border-b">
                <td className="p-2">{startIndex + idx + 1}</td>
                <td className="p-2 font-medium">{pm['NAMA PM']}</td>
                <td className="p-2">{pm['DAERAH'] || '-'}</td>
                <td className="p-2">Rp {(pm['TOTAL PENERIMAAN'] || 0).toLocaleString()}</td>
                <td className="p-2 space-x-1">
                  <button onClick={() => setDetailItem(pm)} className="bg-blue-600 text-white px-2 py-1 rounded text-xs">Detail</button>
                  <button onClick={() => setEditItem(pm)} className="bg-teal-600 text-white px-2 py-1 rounded text-xs">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
      {editItem && <EditModal item={editItem} onClose={() => setEditItem(null)} onSave={onUpdate} />}
      {detailItem && <DetailPmModal pm={detailItem} onClose={() => setDetailItem(null)} />}
    </div>
  );
}