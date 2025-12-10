import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePagination } from "@/hooks/use-pagination";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  paginationItemsToDisplay?: number;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  limit?: number;
};

export default function CMSPagination({
  currentPage,
  totalPages,
  paginationItemsToDisplay = 5,
  onPageChange,
  onLimitChange,
  limit,
}: PaginationProps) {
  const { pages, showLeftEllipsis, showRightEllipsis } = usePagination({
    currentPage,
    paginationItemsToDisplay,
    totalPages,
  });

  return (
    <div className="flex items-center justify-between gap-3">
      {/* Page number information */}
      <p
        aria-live="polite"
        className="flex-1 whitespace-nowrap text-muted-foreground text-sm"
      >
        Page <span className="text-foreground">{currentPage}</span> of{" "}
        <span className="text-foreground">{totalPages}</span>
      </p>

      {/* Pagination */}
      <div className="grow">
        <Pagination>
          <PaginationContent>
            {/* Previous page button */}
            <PaginationItem>
              <PaginationLink
                aria-disabled={currentPage === 1 ? true : undefined}
                aria-label="Go to previous page"
                className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
                href={
                  currentPage === 1 ? undefined : `#/page/${currentPage - 1}`
                }
                onClick={(e) => {
                  if (onPageChange) {
                    e.preventDefault();

                    if (currentPage > 1) onPageChange(currentPage - 1);
                  }
                }}
                role={currentPage === 1 ? "link" : undefined}
              >
                <ChevronLeftIcon aria-hidden="true" size={16} />
              </PaginationLink>
            </PaginationItem>

            {/* Left ellipsis (...) */}
            {showLeftEllipsis && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}

            {/* Page number links */}
            {pages.map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  href={`#/page/${page}`}
                  isActive={page === currentPage}
                  onClick={(e) => {
                    if (onPageChange) {
                      e.preventDefault();
                      onPageChange(page);
                    }
                  }}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}

            {/* Right ellipsis (...) */}
            {showRightEllipsis && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}

            {/* Next page button */}
            <PaginationItem>
              <PaginationLink
                aria-disabled={currentPage === totalPages ? true : undefined}
                aria-label="Go to next page"
                className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
                href={
                  currentPage === totalPages
                    ? undefined
                    : `#/page/${currentPage + 1}`
                }
                onClick={(e) => {
                  if (onPageChange) {
                    e.preventDefault();

                    if (currentPage < totalPages) onPageChange(currentPage + 1);
                  }
                }}
                role={currentPage === totalPages ? "link" : undefined}
              >
                <ChevronRightIcon aria-hidden="true" size={16} />
              </PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      {/* Results per page */}
      <div className="flex flex-1 justify-end">
        <Select
          aria-label="Results per page"
          defaultValue={limit?.toString() || "10"}
          onValueChange={(val) => onLimitChange?.(Number(val))}
        >
          <SelectTrigger
            className="w-fit whitespace-nowrap"
            id="results-per-page"
          >
            <SelectValue placeholder="Select number of results" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="10">10 / page</SelectItem>

            <SelectItem value="20">20 / page</SelectItem>

            <SelectItem value="50">50 / page</SelectItem>

            <SelectItem value="100">100 / page</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
