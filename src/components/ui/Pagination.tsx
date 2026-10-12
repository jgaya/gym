import React from "react";
import { Button } from "./Button";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  className = "",
}: PaginationProps) {
  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generar rango de páginas visibles
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 text-sm text-content-muted ${className}`}
    >
      <div>
        Mostrando <span className="font-semibold text-content">{startItem}</span> a{" "}
        <span className="font-semibold text-content">{endItem}</span> de{" "}
        <span className="font-semibold text-content">{totalItems}</span> registros
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Página anterior"
        >
          Anterior
        </Button>

        <div className="hidden sm:flex items-center gap-1">
          {getPageNumbers().map((p, idx) => {
            if (p === "...") {
              return (
                <span key={`ellipsis-${idx}`} className="px-2 py-1 text-content-muted">
                  ...
                </span>
              );
            }

            const pageNum = p as number;
            const isCurrent = pageNum === currentPage;

            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => onPageChange(pageNum)}
                aria-current={isCurrent ? "page" : undefined}
                className={`h-8 w-8 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  isCurrent
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-surface text-content hover:bg-surface-hover"
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <span className="sm:hidden text-xs font-medium text-content">
          Pág. {currentPage} / {totalPages || 1}
        </span>

        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages || totalPages === 0}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Página siguiente"
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}
