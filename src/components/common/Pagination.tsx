import React from "react";
import { AngleLeftIcon, AngleRightIcon } from "../../icons";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
}) => {
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    return (
        <div className="flex justify-center items-center gap-2">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-md border bg-white hover:bg-gray-100 disabled:opacity-50"
            >
                <AngleLeftIcon />
            </button>

            {pages.map((p) => (
                <button
                    key={p}
                    onClick={() => onPageChange(p)}
                    className={`px-3 py-1 rounded-md border ${
                        p === currentPage
                            ? "bg-blue-600 text-white"
                            : "bg-white hover:bg-gray-100"
                    }`}
                >
                    {p}
                </button>
            ))}

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-md border bg-white hover:bg-gray-100 disabled:opacity-50"
            >
                <AngleRightIcon />
            </button>
        </div>
    );
};

export default Pagination;
