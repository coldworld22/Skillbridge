import React from "react";
import { Button } from "@/components/ui/button";

function PaginationControls({
  currentPage,
  totalPages,
  goToPage,
  startIndex,
  endIndex,
  totalResults,
}) {
  const renderPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    let startPage;
    let endPage;

    if (totalPages <= maxPagesToShow) {
      startPage = 1;
      endPage = totalPages;
    } else {
      const maxPagesBeforeCurrent = Math.floor(maxPagesToShow / 2);
      const maxPagesAfterCurrent = Math.ceil(maxPagesToShow / 2) - 1;

      if (currentPage <= maxPagesBeforeCurrent) {
        startPage = 1;
        endPage = maxPagesToShow;
      } else if (currentPage + maxPagesAfterCurrent >= totalPages) {
        startPage = totalPages - maxPagesToShow + 1;
        endPage = totalPages;
      } else {
        startPage = currentPage - maxPagesBeforeCurrent;
        endPage = currentPage + maxPagesAfterCurrent;
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => goToPage(i)}
          className={`px-3 py-1 rounded-md ${
            currentPage === i
              ? "bg-yellow-500 text-white"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          {i}
        </button>
      );
    }

    return pages;
  };

  return (
    <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between">
      <div className="text-sm text-gray-700 mb-4 sm:mb-0">
        Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
        <span className="font-medium">{endIndex}</span> of{' '}
        <span className="font-medium">{totalResults}</span> results
      </div>

      <div className="flex items-center space-x-2">
        <Button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1.5 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Previous
        </Button>

        <div className="flex space-x-1">{renderPageNumbers()}</div>

        <Button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Next
        </Button>
      </div>
    </div>
  );
}

export default PaginationControls;
