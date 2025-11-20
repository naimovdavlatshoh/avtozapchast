import React, { useEffect, useState, useCallback, useRef } from "react";
import {
    GetDailyDebtsList,
    SearchDailyDebts,
    CloseDailyDebt,
    DeleteDailyDebt,
} from "../../service/data";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Pagination from "../../components/common/Pagination";
import Loader from "../../components/ui/loader/Loader";
import { formatDateOnly } from "../../utils/dateFormat";
import { Link, useNavigate } from "react-router";
import Input from "../../components/form/input/InputField";
import { MdArrowBack, MdClear, MdDelete } from "react-icons/md";
import { toast } from "react-hot-toast";
import { Modal } from "../../components/ui/modal";
import { useModal } from "../../hooks/useModal";

type DailyDebtItem = {
    daily_debt_item_id: number;
    daily_debt_id: number;
    product_id: number;
    product_name: string;
    barcode: number;
    product_code: string;
    amount: number;
    selling_price: number;
    selling_price_usd: string;
};

type DailyDebt = {
    daily_debt_id: number;
    client_name: string;
    client_phone_number: string;
    client_car_number: string;
    exchange_rate: number;
    debt_status: number;
    is_active: number;
    created_at: string;
    updated_at: string;
    items: DailyDebtItem[];
};

type DailyDebtsResponse = {
    page: number;
    limit: number;
    count: number;
    pages: number;
    result: DailyDebt[];
};

const DailyDebtsPage: React.FC = () => {
    const [data, setData] = useState<DailyDebtsResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [searchKeyword, setSearchKeyword] = useState<string>("");
    const [isSearching, setIsSearching] = useState<boolean>(false);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const closeModal = useModal(false);
    const deleteModal = useModal(false);
    const [selectedDebtId, setSelectedDebtId] = useState<number | null>(null);
    const [isClosing, setIsClosing] = useState<boolean>(false);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);
    const [status, setStatus] = useState<string>("active");
    const navigate = useNavigate();

    const [page, setPage] = useState<number>(1);
    const limit = 10;

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await GetDailyDebtsList(page, limit, status);
            setData(res);
        } catch (e: any) {
            setError(e?.message || "Xatolik yuz berdi");
        } finally {
            setLoading(false);
        }
    }, [page, limit, status]);

    const handleSearch = useCallback(async (keyword: string) => {
        if (!keyword.trim() || keyword.trim().length < 3) {
            setIsSearching(false);
            setPage(1);
            setData(null);
            return;
        }

        setLoading(true);
        try {
            const response = await SearchDailyDebts(keyword.trim());
            if (response?.data?.result) {
                // Search natijasini list formatiga o'zgartirish
                const searchResults: DailyDebt[] = Array.isArray(
                    response.data.result
                )
                    ? response.data.result
                    : [response.data.result];

                setData({
                    page: 1,
                    limit: searchResults.length,
                    count: searchResults.length,
                    pages: 1,
                    result: searchResults,
                });
            } else {
                setData({
                    page: 1,
                    limit: 0,
                    count: 0,
                    pages: 1,
                    result: [],
                });
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Qidiruvda xatolik");
            setData(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!isSearching) {
            fetchData();
        }
    }, [page, isSearching, status, fetchData]);

    const handleSearchChange = (value: string) => {
        setSearchKeyword(value);

        // Oldingi timeout ni tozalash
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (value.trim().length === 0) {
            setIsSearching(false);
            setPage(1);
            fetchData();
        } else if (value.trim().length >= 3) {
            setIsSearching(true);
            setPage(1);
            // Debounce bilan search qilish - 500ms kechikish
            searchTimeoutRef.current = setTimeout(() => {
                handleSearch(value);
            }, 500);
        } else {
            // 3 ta harfdan kam bo'lsa, search ni o'chirish
            setIsSearching(false);
        }
    };

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    const handleCloseDebtClick = (dailyDebtId: number) => {
        setSelectedDebtId(dailyDebtId);
        closeModal.openModal();
    };

    const handleCloseDebtConfirm = async () => {
        if (!selectedDebtId) return;

        setIsClosing(true);
        try {
            const response = await CloseDailyDebt(selectedDebtId);
            if (response) {
                toast.success("Qarzdorlik muvaffaqiyatli yopildi!");
                closeModal.closeModal();
                setSelectedDebtId(null);
                // Ro'yxatni yangilash
                if (isSearching) {
                    handleSearch(searchKeyword);
                } else {
                    fetchData();
                }
            }
        } catch (error: any) {
            closeModal.closeModal();
            toast.error(error.response?.data?.error || "Xatolik yuz berdi");
        } finally {
            setIsClosing(false);
        }
    };

    const handleCloseDebtCancel = () => {
        closeModal.closeModal();
        setSelectedDebtId(null);
    };

    const handleDeleteDebtClick = (dailyDebtId: number) => {
        setSelectedDebtId(dailyDebtId);
        deleteModal.openModal();
    };

    const handleDeleteDebtConfirm = async () => {
        if (!selectedDebtId) return;

        setIsDeleting(true);
        try {
            const response = await DeleteDailyDebt(selectedDebtId);
            if (response) {
                toast.success("Qarzdorlik muvaffaqiyatli o'chirildi!");
                deleteModal.closeModal();
                setSelectedDebtId(null);
                // Ro'yxatni yangilash
                if (isSearching) {
                    handleSearch(searchKeyword);
                } else {
                    fetchData();
                }
            }
        } catch (error: any) {
            deleteModal.closeModal();
            toast.error(error.response?.data?.error || "Xatolik yuz berdi");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteDebtCancel = () => {
        deleteModal.closeModal();
        setSelectedDebtId(null);
    };

    return (
        <div className={localStorage.getItem("role_id") === "2" ? "p-5" : ""}>
            {localStorage.getItem("role_id") === "1" && (
                <PageBreadcrumb pageTitle="Vaqtincha qarzdorlik" />
            )}
            {localStorage.getItem("role_id") === "2" && (
                <button
                    onClick={() => navigate("/daily-debts")}
                    className="flex items-center gap-2 px-4 mb-5 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors"
                >
                    <MdArrowBack className="text-xl" />
                </button>
            )}

            <div className="space-y-6">
                <ComponentCard
                    title={status == "active" ? "Faol qarzdorliklar" : "Sotilganlar"}
                    desc={
                        <div className="flex gap-4 items-center justify-between">
                            <div className="flex gap-4 items-center">
                                {/* Status Filter Tabs */}
                                <div className="flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
                                    <button
                                        onClick={() => {
                                            setStatus("active");
                                            setPage(1);
                                            setIsSearching(false);
                                            setSearchKeyword("");
                                        }}
                                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                            status === "active"
                                                ? "bg-blue-500  text-white"
                                                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                        }`}
                                    >
                                        Faol
                                    </button>
                                    <button
                                        onClick={() => {
                                            setStatus("closed");
                                            setPage(1);
                                            setIsSearching(false);
                                            setSearchKeyword("");
                                        }}
                                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                            status === "closed"
                                                ? "bg-blue-500  text-white"
                                                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                        }`}
                                    >
                                        Sotilganlar
                                    </button>
                                </div>

                                <div className="flex gap-2">
                                    <div className="relative">
                                        <Input
                                            type="text"
                                            placeholder="Qidirish... (3+ harf)"
                                            value={searchKeyword}
                                            onChange={(e) =>
                                                handleSearchChange(
                                                    e.target.value
                                                )
                                            }
                                            className="w-64"
                                        />
                                    </div>
                                    {isSearching && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSearchKeyword("");
                                                setIsSearching(false);
                                                setPage(1);
                                                fetchData();
                                            }}
                                            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 flex items-center"
                                        >
                                            <MdClear />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <Link
                                to={
                                    localStorage.getItem("role_id") === "2"
                                        ? "/operator-daily-debts/create"
                                        : "/daily-debts/create"
                                }
                                className="bg-blue-500 text-white px-5 py-3 rounded-md hover:bg-blue-600"
                            >
                                + Qo'shish
                            </Link>
                        </div>
                    }
                >
                    {loading ? (
                        <div className="flex justify-center items-center py-8">
                            <Loader />
                        </div>
                    ) : error ? (
                        <div className="text-red-500">{error}</div>
                    ) : (
                        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
                            <div className="max-w-full overflow-x-auto">
                                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                        <tr>
                                            <th
                                                scope="col"
                                                className="px-6 py-3"
                                            >
                                                #
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3"
                                            >
                                                Mijoz
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3"
                                            >
                                                Telefon
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3"
                                            >
                                                Mashina raqami
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3"
                                            >
                                                Kurs
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3"
                                            >
                                                Holat
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3"
                                            >
                                                Faol
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3"
                                            >
                                                Yaratilgan sana
                                            </th>

                                            <th
                                                scope="col"
                                                className="px-6 py-3"
                                            >
                                                Amallar
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data?.result?.length ? (
                                            data.result.map((row, idx) => (
                                                <tr
                                                    key={row.daily_debt_id}
                                                    className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                                                >
                                                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                                        {(page - 1) * limit +
                                                            idx +
                                                            1}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {row.client_name}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {
                                                            row.client_phone_number
                                                        }
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {row.client_car_number}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {row.exchange_rate}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {row.debt_status === 0
                                                            ? "Yopiq"
                                                            : "Ochiq"}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {row.is_active === 1
                                                            ? "Ha"
                                                            : "Yo'q"}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {formatDateOnly(
                                                            row.created_at
                                                        )}
                                                    </td>

                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-2">
                                                            <Link
                                                                to={
                                                                    localStorage.getItem(
                                                                        "role_id"
                                                                    ) === "1"
                                                                        ? `/daily-debts/${row.daily_debt_id}`
                                                                        : `/operator-daily-debts/${row.daily_debt_id}`
                                                                }
                                                                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-purple-600 bg-purple-100 rounded hover:bg-purple-200 transition-colors"
                                                                title="Batafsil"
                                                            >
                                                                Batafsil
                                                            </Link>
                                                            {row.debt_status !==
                                                                0 && (
                                                                <button
                                                                    onClick={() =>
                                                                        handleCloseDebtClick(
                                                                            row.daily_debt_id
                                                                        )
                                                                    }
                                                                    className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-orange-600 bg-orange-100 rounded hover:bg-orange-200 transition-colors"
                                                                    title="Yopish"
                                                                >
                                                                    Yopish
                                                                </button>
                                                            )}
                                                            {/* <Link
                                                                to={
                                                                    localStorage.getItem(
                                                                        "role_id"
                                                                    ) === "1"
                                                                        ? `/daily-debts/${row.daily_debt_id}/add-items`
                                                                        : `/operator-daily-debts/${row.daily_debt_id}/add-items`
                                                                }
                                                                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-green-600 bg-green-100 rounded hover:bg-green-200 transition-colors"
                                                                title="Mahsulot qo'shish"
                                                            >
                                                                + Qo'shish
                                                            </Link> */}
                                                            <button
                                                                onClick={() =>
                                                                    handleDeleteDebtClick(
                                                                        row.daily_debt_id
                                                                    )
                                                                }
                                                                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-red-600 bg-red-100 rounded hover:bg-red-200 transition-colors"
                                                                title="O'chirish"
                                                            >
                                                                <MdDelete
                                                                    size={16}
                                                                />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td
                                                    colSpan={9}
                                                    className="px-6 py-4 text-center text-gray-500"
                                                >
                                                    Ma'lumot topilmadi
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {data && data.pages > 1 && (
                        <div className="mt-4">
                            <Pagination
                                currentPage={page}
                                totalPages={data.pages}
                                onPageChange={setPage}
                            />
                        </div>
                    )}
                </ComponentCard>
            </div>

            {/* Close Debt Confirmation Modal */}
            <Modal
                isOpen={closeModal.isOpen}
                onClose={handleCloseDebtCancel}
                className="max-w-md w-full"
            >
                <div className="p-6">
                    <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-orange-100 dark:bg-orange-900/20 rounded-full">
                        <svg
                            className="w-6 h-6 text-orange-600 dark:text-orange-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                            />
                        </svg>
                    </div>

                    <div className="text-center">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            Qarzdorlikni yopish
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            Qarzdorlikni yopishni tasdiqlaysizmi? Bu amalni
                            keyinroq bekor qilish mumkin.
                        </p>

                        <div className="flex justify-center space-x-3">
                            <button
                                type="button"
                                onClick={handleCloseDebtCancel}
                                disabled={isClosing}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Bekor qilish
                            </button>
                            <button
                                type="button"
                                onClick={handleCloseDebtConfirm}
                                disabled={isClosing}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isClosing ? "Yopilmoqda..." : "Yopish"}
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Delete Debt Confirmation Modal */}
            <Modal
                isOpen={deleteModal.isOpen}
                onClose={handleDeleteDebtCancel}
                className="max-w-md w-full"
            >
                <div className="p-6">
                    <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full">
                        <svg
                            className="w-6 h-6 text-red-600 dark:text-red-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                            />
                        </svg>
                    </div>

                    <div className="text-center">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            Qarzdorlikni o'chirish
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            Qarzdorlikni o'chirishni tasdiqlaysizmi? Bu amalni
                            qaytarib bo'lmaydi.
                        </p>

                        <div className="flex justify-center space-x-3">
                            <button
                                type="button"
                                onClick={handleDeleteDebtCancel}
                                disabled={isDeleting}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Bekor qilish
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteDebtConfirm}
                                disabled={isDeleting}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isDeleting ? "O'chirilmoqda..." : "O'chirish"}
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default DailyDebtsPage;
