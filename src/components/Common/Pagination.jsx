export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    const half = Math.floor(maxVisible / 2);

    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (start > 1) {
      pages.unshift('...');
      if (start > 2) pages.unshift(1);
    }
    if (end < totalPages) {
      pages.push('...');
      if (end < totalPages - 1) pages.push(totalPages);
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <nav aria-label="Navigasi halaman" className="flex flex-wrap items-center justify-center gap-2 border-t bg-white p-3">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="min-h-11 rounded-lg bg-gray-200 px-3 py-2 disabled:opacity-50 hover:bg-gray-300"
      >
        Sebelumnya
      </button>
      {pageNumbers.map((page, idx) =>
        page === '...' ? (
          <span key={`ellipsis-${idx}`} className="px-2 py-1">
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            aria-current={currentPage === page ? 'page' : undefined}
            aria-label={`Halaman ${page}`}
            className={`min-h-11 min-w-11 rounded-lg px-3 py-2 ${
              currentPage === page
                ? 'bg-teal-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            {page}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="min-h-11 rounded-lg bg-gray-200 px-3 py-2 disabled:opacity-50 hover:bg-gray-300"
      >
        Berikutnya
      </button>
    </nav>
  );
}
