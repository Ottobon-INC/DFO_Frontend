import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems?: number;
    itemsPerPage?: number;
}

export const Pagination: React.FC<PaginationProps> = ({ 
    currentPage, 
    totalPages, 
    onPageChange,
    totalItems,
    itemsPerPage
}) => {
    if (totalPages <= 1) return null;

    const startItem = itemsPerPage ? ((currentPage - 1) * itemsPerPage) + 1 : undefined;
    const endItem = itemsPerPage && totalItems ? Math.min(currentPage * itemsPerPage, totalItems) : undefined;

    return (
        <div className="flex items-center justify-between px-4 py-3 border-t border-brand-border sm:px-6">
            {/* Mobile view */}
            <div className="flex flex-1 justify-between sm:hidden">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-md border border-brand-border bg-brand-surface px-4 py-2 text-sm font-medium text-brand-textPrimary hover:bg-brand-bg/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Previous
                </button>
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative ml-3 inline-flex items-center rounded-md border border-brand-border bg-brand-surface px-4 py-2 text-sm font-medium text-brand-textPrimary hover:bg-brand-bg/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Next
                </button>
            </div>
            
            {/* Desktop view */}
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                    {totalItems !== undefined && startItem !== undefined && endItem !== undefined ? (
                        <p className="text-sm text-brand-textSecondary">
                            Showing <span className="font-medium text-brand-textPrimary">{startItem}</span> to{' '}
                            <span className="font-medium text-brand-textPrimary">{endItem}</span> of{' '}
                            <span className="font-medium text-brand-textPrimary">{totalItems}</span> results
                        </p>
                    ) : (
                        <p className="text-sm text-brand-textSecondary">
                            Page <span className="font-medium text-brand-textPrimary">{currentPage}</span> of{' '}
                            <span className="font-medium text-brand-textPrimary">{totalPages}</span>
                        </p>
                    )}
                </div>
                <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        <button
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center rounded-l-md px-2 py-2 text-brand-textSecondary ring-1 ring-inset ring-brand-border hover:bg-brand-bg/50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="sr-only">Previous</span>
                            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                        </button>
                        
                        <button
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="relative inline-flex items-center rounded-r-md px-2 py-2 text-brand-textSecondary ring-1 ring-inset ring-brand-border hover:bg-brand-bg/50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="sr-only">Next</span>
                            <ChevronRight className="h-4 w-4" aria-hidden="true" />
                        </button>
                    </nav>
                </div>
            </div>
        </div>
    );
};
