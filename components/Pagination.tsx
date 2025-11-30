import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  showItemsPerPage?: boolean;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  showItemsPerPage = true,
}: PaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const goToFirstPage = () => onPageChange(1);
  const goToLastPage = () => onPageChange(totalPages);
  const goToPreviousPage = () => onPageChange(Math.max(1, currentPage - 1));
  const goToNextPage = () => onPageChange(Math.min(totalPages, currentPage + 1));

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxPagesToShow = 7;

    if (totalPages <= maxPagesToShow) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page, last page, and pages around current page
      if (currentPage <= 3) {
        // Near the start
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Middle
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  if (totalPages <= 1) {
    return null; // Don't show pagination if there's only one page
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
      {/* Items info */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Showing <span className="font-medium text-gray-900 dark:text-white">{startItem}</span> to{' '}
        <span className="font-medium text-gray-900 dark:text-white">{endItem}</span> of{' '}
        <span className="font-medium text-gray-900 dark:text-white">{totalItems}</span> results
      </div>

      <div className="flex items-center gap-4">
        {/* Items per page selector */}
        {showItemsPerPage && onItemsPerPageChange && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">Show:</label>
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        )}

        {/* Pagination controls */}
        <nav className="flex items-center gap-1">
          {/* First page */}
          <button
            onClick={goToFirstPage}
            disabled={currentPage === 1}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
            title="First page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>

          {/* Previous page */}
          <button
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
            title="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Page numbers */}
          {pageNumbers.map((page, index) =>
            page === '...' ? (
              <span
                key={`ellipsis-${index}`}
                className="px-3 py-1 text-gray-600 dark:text-gray-400"
              >
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page as number)}
                className={`min-w-[2.5rem] px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {page}
              </button>
            )
          )}

          {/* Next page */}
          <button
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
            title="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* Last page */}
          <button
            onClick={goToLastPage}
            disabled={currentPage === totalPages}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
            title="Last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        </nav>
      </div>
    </div>
  );
}
