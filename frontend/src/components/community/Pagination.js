import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null; // Hide pagination if only one page

  return (
    <div className="flex justify-center mt-6 space-x-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`px-4 py-2 rounded-md flex items-center gap-2 transition ${
          currentPage === 1 ? "bg-gray-700 cursor-not-allowed opacity-50" : "bg-yellow-500 hover:bg-yellow-600"
        }`}
      >
        <FaChevronLeft /> Prev
      </button>

      <span className="text-gray-300 px-4 py-2">
        Page {currentPage} of {totalPages}
      </span>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className={`px-4 py-2 rounded-md flex items-center gap-2 transition ${
          currentPage >= totalPages ? "bg-gray-700 cursor-not-allowed opacity-50" : "bg-yellow-500 hover:bg-yellow-600"
        }`}
      >
        Next <FaChevronRight />
      </button>
    </div>
  );
};

export default Pagination;
