import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Button } from "./button"; // Assuming this path is correct

const DEBUG_PAGINATION_PREFIX = "[Pagination DEBUG]";

export const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  console.log(`${DEBUG_PAGINATION_PREFIX} Rendering. currentPage: ${currentPage}, totalPages: ${totalPages}`);

  if (totalPages <= 1) {
    console.log(`${DEBUG_PAGINATION_PREFIX} totalPages <= 1, rendering null.`);
    return null;
  }

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      pageNumbers.push(1);
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      if (currentPage <= 2) end = 4;
      if (currentPage >= totalPages - 1) start = totalPages - 3;
      if (start > 2) pageNumbers.push("ellipsis1");
      for (let i = start; i <= end; i++) pageNumbers.push(i);
      if (end < totalPages - 1) pageNumbers.push("ellipsis2");
      pageNumbers.push(totalPages);
    }
    console.log(`${DEBUG_PAGINATION_PREFIX} Generated pageNumbers:`, pageNumbers);
    return pageNumbers;
  };

  const pageNumbers = getPageNumbers();

  const handlePrevClick = () => {
    console.log(`${DEBUG_PAGINATION_PREFIX} Previous button clicked. Current page: ${currentPage}. Calling onPageChange with ${currentPage - 1}`);
    onPageChange(currentPage - 1);
  };

  const handleNextClick = () => {
    console.log(`${DEBUG_PAGINATION_PREFIX} Next button clicked. Current page: ${currentPage}. Calling onPageChange with ${currentPage + 1}`);
    onPageChange(currentPage + 1);
  };

  const handlePageClick = (page) => {
    console.log(`${DEBUG_PAGINATION_PREFIX} Page ${page} button clicked. Current page: ${currentPage}. Calling onPageChange with ${page}`);
    onPageChange(page);
  }

  return (
    <div className="flex items-center justify-center space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrevClick}
        disabled={currentPage === 1}
        className="hidden bg-brand-yellow/80 hover:bg-brand-yellow/50 text-white hover:text-white sm:flex"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="ml-1">Previous</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrevClick}
        disabled={currentPage === 1}
        className="sm:hidden"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="flex items-center space-x-1">
        {pageNumbers.map((page, index) => {
          if (page === "ellipsis1" || page === "ellipsis2") {
            return (
              <Button
                key={`ellipsis-${index}`}
                variant="outline"
                size="sm"
                disabled
                className="w-9 "
              >
                <MoreHorizontal className="h-4 w-4 " />
              </Button>
            );
          }

          return (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => handlePageClick(page)}
              className={`w-9 ${currentPage === page
                ? "bg-brand-yellow/80 hover:bg-brand-yellow/50 text-white hover:text-white"
                : " "
                }`}
            >
              {page}
            </Button>
          );
        })}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={handleNextClick}
        disabled={currentPage === totalPages}
        className="hidden bg-brand-yellow/80 hover:bg-brand-yellow/50 text-white hover:text-white sm:flex"
      >
        <span className="mr-1">Next</span>
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleNextClick}
        disabled={currentPage === totalPages}
        className="sm:hidden"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};