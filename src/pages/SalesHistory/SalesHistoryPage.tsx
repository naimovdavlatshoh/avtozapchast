import React, { useState, useEffect } from "react";
import { GetDataSimple, PostDataTokenJson } from "../../service/data";
import { formatNumber } from "../../utils/numberFormat";
import { formatDate } from "../../utils/dateFormat";
import { MdArrowBack, MdDelete } from "react-icons/md";
import { Link, useNavigate } from "react-router";
import Pagination from "../../components/common/Pagination";
import { Modal } from "../../components/ui/modal";
import { toast } from "react-hot-toast";
import DatePicker from "../../components/form/date-picker";

interface SaleItem {
    sale_item_id: number;
    product_id: number;
    product_name: string;
    amount: number;
    barcode: number;
    product_code: string;
    created_at: string;
}

interface Sale {
    sale_id: number;
    user_id: number;
    client_id: number | null;
    total_price: number;
    discount: number;
    total_price_with_discount: number;
    comments: string | null;
    is_debt: number;
    is_active: number;
    created_at: string;
    updated_at: string | null;
    items: SaleItem[];
    returns: any[];
}

interface SalesData {
    sale_date: string;
    total_sales: string;
    total_discount: string;
    debt_sales_count: number;
    debt_sales_sum: string;
    sales: Sale[];
}

interface SalesResponse {
    page: number;
    limit: number;
    count: number;
    pages: number;
    result: SalesData;
}

const SalesHistoryPage: React.FC = () => {
    const [salesData, setSalesData] = useState<SalesResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const navigate = useNavigate();

    // Date filter state - default to today (local timezone)
    const today = new Date();
    const todayString =
        today.getFullYear() +
        "-" +
        String(today.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(today.getDate()).padStart(2, "0");
    const [startDate, setStartDate] = useState(todayString);
    const [endDate, setEndDate] = useState(todayString);

    // Delete modal state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchSalesHistory = async (page: number = 1) => {
        try {
            setLoading(true);

            // URL parametrlarini tayyorlash
            let url = `api/sale/list?page=${page}&limit=30`;

            if (startDate) {
                url += `&start_date=${startDate}`;
            }

            if (endDate) {
                url += `&end_date=${endDate}`;
            }

            const response = await GetDataSimple(url);
            if (response?.result) {
                setSalesData(response);
            }
        } catch (error) {
            console.error("Sotuv tarixini yuklashda xatolik:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSalesHistory(currentPage);
    }, [currentPage, startDate, endDate]);

    const handleBack = () => {
        navigate(-1);
    };

    // Print check function
    const handlePrintCheck = (sale: Sale) => {
        // Sale ma'lumotlarini check formatiga aylantirish
        const saleData = {
            cart: sale.items.map((item) => ({
                product_id: item.product_id,
                product_name: item.product_name,
                product_code: item.product_code,
                selling_price: 0, // Bu ma'lumot API dan kelmaydi
                last_receipt_price: 0,
                total_amount: item.amount,
                quantity: item.amount,
                total: 0, // Bu ma'lumot API dan kelmaydi
                image_id: undefined,
            })),
            isDebt: sale.is_debt === 1,
            selectedClient: sale.client_id ? { client_name: "Mijoz" } : null,
            debtAmount:
                sale.is_debt === 1
                    ? sale.total_price_with_discount.toString()
                    : "0",
            comments: sale.comments || "",
            discount: sale.discount.toString(),
            totalAmount: sale.total_price_with_discount,
            totalItems: sale.items.length,
            saleId: sale.sale_id,
            timestamp: formatDate(sale.created_at),
        };

        // Check sahifasini yangi oynada ochish
        const checkUrl = `/#/check?saleData=${encodeURIComponent(
            JSON.stringify(saleData)
        )}`;
        window.open(checkUrl, "_blank");
    };

    // Delete functions
    const handleDeleteSale = (sale: Sale) => {
        setSelectedSale(sale);
        setIsDeleteModalOpen(true);
    };

    const handleCloseDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setSelectedSale(null);
    };

    const handleConfirmDelete = async () => {
        if (!selectedSale) return;

        setIsDeleting(true);
        try {
            const response = await PostDataTokenJson(
                `api/sale/delete/${selectedSale.sale_id}`,
                {}
            );
            if (response) {
                toast.success("Sotuv muvaffaqiyatli bekor qilindi");
                // Sahifani qayta yuklash
                fetchSalesHistory(currentPage);
                handleCloseDeleteModal();
            }
        } catch (error: any) {
            toast.error(
                error?.response?.data?.error ||
                    "Sotuvni o'chirishda xatolik yuz berdi"
            );
            handleCloseDeleteModal();
        } finally {
            setIsDeleting(false);
        }
    };

    const getStatusBadge = (isDebt: number) => {
        if (isDebt === 1) {
            return (
                <span className="px-2 py-1 text-xs font-semibold text-orange-800 bg-orange-100 rounded-full">
                    Qarzga
                </span>
            );
        }
        return (
            <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">
                Naqd
            </span>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Sotuv tarixi yuklanmoqda...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="px-6 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleBack}
                                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Orqaga"
                            >
                                <MdArrowBack className="text-2xl" />
                            </button>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Sotuv tarixi
                            </h1>
                        </div>

                        {/* Date Pickers */}
                        <div className="flex items-center gap-4">
                            <label htmlFor="">Boshlanish sanasi:</label>
                            <div className="w-48">
                                <DatePicker
                                    id="start-date"
                                    label=""
                                    defaultDate={startDate}
                                    onChange={(selectedDates) => {
                                        if (
                                            selectedDates &&
                                            selectedDates.length > 0
                                        ) {
                                            const date = selectedDates[0];
                                            const year = date.getFullYear();
                                            const month = String(
                                                date.getMonth() + 1
                                            ).padStart(2, "0");
                                            const day = String(
                                                date.getDate()
                                            ).padStart(2, "0");
                                            setStartDate(
                                                `${year}-${month}-${day}`
                                            );
                                        }
                                    }}
                                    placeholder="Boshlanish sanasi"
                                />
                            </div>
                            {"-"}
                            <label htmlFor="">Tugash sanasi:</label>
                            <div className="w-48">
                                <DatePicker
                                    id="end-date"
                                    label=""
                                    defaultDate={endDate}
                                    onChange={(selectedDates) => {
                                        if (
                                            selectedDates &&
                                            selectedDates.length > 0
                                        ) {
                                            const date = selectedDates[0];
                                            const year = date.getFullYear();
                                            const month = String(
                                                date.getMonth() + 1
                                            ).padStart(2, "0");
                                            const day = String(
                                                date.getDate()
                                            ).padStart(2, "0");
                                            setEndDate(
                                                `${year}-${month}-${day}`
                                            );
                                        }
                                    }}
                                    placeholder="Tugash sanasi"
                                />
                            </div>
                            <button
                                onClick={() => {
                                    setStartDate(todayString);
                                    setEndDate(todayString);
                                    setCurrentPage(1);
                                }}
                                className="px-4 py-3 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                            >
                                Bugungi kun
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-6">
                {salesData && (
                    <>
                        {/* Umumiy statistika */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            <div className="bg-white p-6 rounded-lg shadow-sm">
                                <h3 className="text-sm font-medium text-gray-500 mb-2">
                                    Jami sotuvlar
                                </h3>
                                <p className="text-2xl font-bold text-blue-600">
                                    {formatNumber(salesData.result.total_sales)}{" "}
                                    so'm
                                </p>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow-sm">
                                <h3 className="text-sm font-medium text-gray-500 mb-2">
                                    Jami chegirma
                                </h3>
                                <p className="text-2xl font-bold text-orange-600">
                                    {formatNumber(
                                        salesData.result.total_discount
                                    )}{" "}
                                    so'm
                                </p>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow-sm">
                                <h3 className="text-sm font-medium text-gray-500 mb-2">
                                    Qarzga sotishlar
                                </h3>
                                <p className="text-2xl font-bold text-red-600">
                                    {salesData.result.debt_sales_count} dona
                                </p>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow-sm">
                                <h3 className="text-sm font-medium text-gray-500 mb-2">
                                    Qarz summasi
                                </h3>
                                <p className="text-2xl font-bold text-red-600">
                                    {formatNumber(
                                        salesData.result.debt_sales_sum
                                    )}{" "}
                                    so'm
                                </p>
                            </div>
                        </div>

                        {/* Sotuvlar ro'yxati */}
                        <div className="bg-white rounded-lg shadow-sm">
                            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Sotuvlar ro'yxati
                                </h2>
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={salesData.pages}
                                    onPageChange={setCurrentPage}
                                />
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                ID
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Sana
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Jami summa
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Chegirma
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Holat
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Izoh
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Harakatlar
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {salesData.result.sales.map((sale) => (
                                            <tr
                                                key={sale.sale_id}
                                                className="hover:bg-gray-50"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    #{sale.sale_id}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {formatDate(
                                                        sale.created_at
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {formatNumber(
                                                        sale.total_price_with_discount
                                                    )}{" "}
                                                    so'm
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {formatNumber(
                                                        sale.discount
                                                    )}{" "}
                                                    so'm
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getStatusBadge(
                                                        sale.is_debt
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {sale.comments || "-"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <Link
                                                            to={`/sales-history/${sale.sale_id}`}
                                                            className="inline-flex items-center gap-2 px-2 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md"
                                                        >
                                                            <svg
                                                                className="w-4 h-4"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={
                                                                        2
                                                                    }
                                                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                                />
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={
                                                                        2
                                                                    }
                                                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                                />
                                                            </svg>
                                                        </Link>
                                                        <button
                                                            onClick={() =>
                                                                handlePrintCheck(
                                                                    sale
                                                                )
                                                            }
                                                            className="inline-flex items-center gap-2 px-2 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md"
                                                            title="Chekni chop etish"
                                                        >
                                                            <svg
                                                                className="w-4 h-4"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={
                                                                        2
                                                                    }
                                                                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                                                                />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                handleDeleteSale(
                                                                    sale
                                                                )
                                                            }
                                                            className="inline-flex items-center gap-2 px-2 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md"
                                                            title="Sotuvni bekor qilish"
                                                        >
                                                            <MdDelete className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="mt-4"></div>
                        </div>
                    </>
                )}
            </div>

            {/* Delete Modal */}
            <Modal isOpen={isDeleteModalOpen} onClose={handleCloseDeleteModal}>
                <div className="p-6">
                    <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                            <MdDelete className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                Sotuvni bekor qilish
                            </h3>
                            <p className="text-sm text-gray-500">
                                Bu amalni qaytarib bo'lmaydi
                            </p>
                        </div>
                    </div>

                    {selectedSale && (
                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                            <h4 className="font-medium text-gray-900 mb-2">
                                Sotuv ma'lumotlari:
                            </h4>
                            <div className="space-y-1 text-sm text-gray-600">
                                <p>
                                    <span className="font-medium">ID:</span> #
                                    {selectedSale.sale_id}
                                </p>
                                <p>
                                    <span className="font-medium">Sana:</span>{" "}
                                    {formatDate(selectedSale.created_at)}
                                </p>
                                <p>
                                    <span className="font-medium">
                                        Jami summa:
                                    </span>{" "}
                                    {formatNumber(
                                        selectedSale.total_price_with_discount
                                    )}{" "}
                                    so'm
                                </p>
                                <p>
                                    <span className="font-medium">
                                        Mahsulotlar:
                                    </span>{" "}
                                    {selectedSale.items.length} dona
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3">
                        <button
                            onClick={handleCloseDeleteModal}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Bekor qilish
                        </button>
                        <button
                            onClick={handleConfirmDelete}
                            disabled={isDeleting}
                            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                                isDeleting
                                    ? "bg-red-400 cursor-not-allowed"
                                    : "bg-red-600 hover:bg-red-700"
                            }`}
                        >
                            {isDeleting ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    O'chirilmoqda...
                                </div>
                            ) : (
                                "Ha, o'chirish"
                            )}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default SalesHistoryPage;
