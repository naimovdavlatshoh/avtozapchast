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
    const getVisiblePages = () => {
        if (totalPages <= 7) {
            // Agar 7 ta yoki kamroq sahifa bo'lsa, hammasini ko'rsatish
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        const pages: (number | string)[] = [];

        // Boshidan 2 ta sahifa
        pages.push(1, 2);

        // O'rtada ellipsis va joriy sahifa
        if (currentPage <= 4) {
            // Agar joriy sahifa 4 yoki kichik bo'lsa, 3, 4, 5 ko'rsatish
            for (let i = 3; i <= Math.min(5, totalPages); i++) {
                pages.push(i);
            }
            if (totalPages > 5) {
                pages.push("...");
            }
        } else if (currentPage >= totalPages - 3) {
            // Agar joriy sahifa oxiridan 3 ta yoki kichik bo'lsa
            if (totalPages > 5) {
                pages.push("...");
            }
            for (let i = Math.max(totalPages - 4, 3); i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // O'rtada joriy sahifa
            pages.push("...");
            pages.push(currentPage - 1, currentPage, currentPage + 1);
            pages.push("...");
        }

        // Oxiridan 2 ta sahifa (agar kerak bo'lsa)
        if (currentPage < totalPages - 3) {
            pages.push(totalPages - 1, totalPages);
        }

        return pages;
    };

    const visiblePages = getVisiblePages();

    return (
        <div className="flex justify-center items-center gap-2">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-md border bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <AngleLeftIcon />
            </button>

            {visiblePages.map((p, index) => {
                if (p === "...") {
                    return (
                        <span
                            key={`ellipsis-${index}`}
                            className="px-2 text-gray-500"
                        >
                            ...
                        </span>
                    );
                }

                return (
                    <button
                        key={p}
                        onClick={() => onPageChange(p as number)}
                        className={`px-3 py-1 rounded-md border ${
                            p === currentPage
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white hover:bg-gray-100"
                        }`}
                    >
                        {p}
                    </button>
                );
            })}

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-md border bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <AngleRightIcon />
            </button>
        </div>
    );
};

export default Pagination;
