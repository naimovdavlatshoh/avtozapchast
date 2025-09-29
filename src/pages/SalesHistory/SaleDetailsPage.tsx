import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { GetDataSimple, PostDataTokenJson } from "../../service/data";
import { formatNumber } from "../../utils/numberFormat";
import { formatDate } from "../../utils/dateFormat";
import { MdArrowBack, MdUndo, MdDelete } from "react-icons/md";
import { toast } from "react-hot-toast";
import { Modal } from "../../components/ui/modal";

interface SaleItem {
    sale_item_id: number;
    product_id: number;
    product_name: string;
    amount: number;
    barcode: number;
    product_code: string;
    created_at: string;
}

interface SaleItemReturn {
    sale_item_return_id: number;
    sale_id: number;
    sale_item_id: number;
    product_id: number;
    product_name: string;
    amount: number;
    total_refund: number;
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
    returns: SaleItemReturn[];
}

const SaleDetailsPage: React.FC = () => {
    const { saleId } = useParams<{ saleId: string }>();
    const navigate = useNavigate();
    const [sale, setSale] = useState<Sale | null>(null);
    const [loading, setLoading] = useState(true);

    // Return modal state
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<SaleItem | null>(null);
    const [returnAmount, setReturnAmount] = useState("");
    const [totalRefund, setTotalRefund] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Delete modal state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // View mode state (sold items vs returned items)
    const [viewMode, setViewMode] = useState<"sold" | "returned">("sold");

    useEffect(() => {
        if (saleId) {
            fetchSaleDetails(parseInt(saleId));
        }
    }, [saleId]);

    const fetchSaleDetails = async (id: number) => {
        try {
            setLoading(true);
            // Umumiy sales history API dan ma'lumotlarni olish
            const response = await GetDataSimple(
                `api/sale/list?page=1&limit=100`
            );
            if (response?.result?.sales) {
                // Kerakli sotuvni ID bo'yicha topish
                const foundSale = response.result.sales.find(
                    (sale: Sale) => sale.sale_id === id
                );
                if (foundSale) {
                    setSale(foundSale);
                } else {
                    setSale(null);
                }
            }
        } catch (error) {
            console.error("Sotuv tafsilotlarini yuklashda xatolik:", error);
            setSale(null);
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        navigate(-1);
    };

    const getStatusBadge = (isDebt: number) => {
        if (isDebt === 1) {
            return (
                <span className="px-3 py-1 text-sm font-semibold text-orange-800 bg-orange-100 rounded-full">
                    Qarzga
                </span>
            );
        }
        return (
            <span className="px-3 py-1 text-sm font-semibold text-green-800 bg-green-100 rounded-full">
                Naqd
            </span>
        );
    };

    // Return functions
    const handleReturnItem = (item: SaleItem) => {
        setSelectedItem(item);
        setReturnAmount("");
        setTotalRefund("");
        setIsReturnModalOpen(true);
    };

    const handleCloseReturnModal = () => {
        setIsReturnModalOpen(false);
        setSelectedItem(null);
        setReturnAmount("");
        setTotalRefund("");
    };

    const handleSubmitReturn = async () => {
        if (!selectedItem) return;

        if (!returnAmount.trim()) {
            toast.error("Otkaz qilinadigan miqdorni kiriting");
            return;
        }

        const amount = parseInt(returnAmount);
        if (amount <= 0 || amount > selectedItem.amount) {
            toast.error("Noto'g'ri miqdor kiritildi");
            return;
        }

        try {
            setIsSubmitting(true);
            const returnData = {
                sale_item_id: selectedItem.sale_item_id,
                amount: amount,
                ...(totalRefund.trim() && {
                    total_refund: parseFloat(totalRefund),
                }),
            };

            const response = await PostDataTokenJson(
                "api/sale/returnitem",
                returnData
            );

            if (response) {
                toast.success("Mahsulot muvaffaqiyatli otkaz qilindi");
                handleCloseReturnModal();
                // Sahifani qayta yuklash
                if (saleId) {
                    fetchSaleDetails(parseInt(saleId));
                }
            }
        } catch (error) {
            console.error("Otkaz qilishda xatolik:", error);
            toast.error("Otkaz qilishda xatolik yuz berdi");
            handleCloseReturnModal();
        } finally {
            setIsSubmitting(false);
        }
    };

    // Delete functions
    const handleDeleteSale = () => {
        setIsDeleteModalOpen(true);
    };

    const handleCloseDeleteModal = () => {
        setIsDeleteModalOpen(false);
    };

    const handleConfirmDelete = async () => {
        if (!sale) return;

        try {
            setIsDeleting(true);
            const response = await PostDataTokenJson(
                `api/sale/delete/${sale.sale_id}`,
                {}
            );

            if (response) {
                toast.success("Sotuv muvaffaqiyatli bekor qilindi");
                // Sales history sahifasiga qaytish
                navigate("/sales-history");
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.error);
            handleCloseDeleteModal();
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg">
                        Sotuv tafsilotlari yuklanmoqda...
                    </p>
                </div>
            </div>
        );
    }

    if (!sale) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                            className="w-8 h-8 text-red-600"
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
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        Sotuv topilmadi
                    </h2>
                    <p className="text-gray-600 mb-4">
                        Kechirasiz, so'ralgan sotuv ma'lumotlari topilmadi.
                    </p>
                    <button
                        onClick={handleBack}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <MdArrowBack className="w-4 h-4" />
                        Orqaga qaytish
                    </button>
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
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    Sotuv #{sale.sale_id} tafsilotlari
                                </h1>
                                <p className="text-gray-600 text-sm">
                                    {formatDate(sale.created_at)}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleDeleteSale}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                            title="Sotuvni bekor qilish"
                        >
                            <MdDelete className="w-4 h-4" />
                            Sotuvni bekor qilish
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                                <svg
                                    className="w-6 h-6 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                                    />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm text-blue-600 font-medium">
                                    Jami summa
                                </p>
                                <p className="text-2xl font-bold text-blue-900">
                                    {formatNumber(sale.total_price)} so'm
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                                <svg
                                    className="w-6 h-6 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm text-orange-600 font-medium">
                                    Chegirma
                                </p>
                                <p className="text-2xl font-bold text-orange-900">
                                    {formatNumber(sale.discount)} so'm
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                                <svg
                                    className="w-6 h-6 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm text-green-600 font-medium">
                                    To'lov summasi
                                </p>
                                <p className="text-2xl font-bold text-green-900">
                                    {formatNumber(
                                        sale.total_price_with_discount
                                    )}{" "}
                                    so'm
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sale Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <svg
                                    className="w-4 h-4 text-blue-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </div>
                            Sotuv ma'lumotlari
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-3 border-b border-gray-100">
                                <span className="text-gray-600 font-medium">
                                    Sotuv ID:
                                </span>
                                <span className="font-bold text-gray-900 text-lg">
                                    #{sale.sale_id}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-gray-100">
                                <span className="text-gray-600 font-medium">
                                    Sana:
                                </span>
                                <span className="font-medium text-gray-900">
                                    {formatDate(sale.created_at)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-3">
                                <span className="text-gray-600 font-medium">
                                    Holat:
                                </span>
                                {getStatusBadge(sale.is_debt)}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <svg
                                    className="w-4 h-4 text-purple-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                                    />
                                </svg>
                            </div>
                            Qo'shimcha ma'lumotlar
                        </h3>
                        <div className="space-y-4">
                            {sale.comments ? (
                                <div>
                                    <span className="text-gray-600 font-medium block mb-3">
                                        Izoh:
                                    </span>
                                    <div className="bg-gray-50 p-4 rounded-lg border">
                                        <p className="text-gray-900 text-sm leading-relaxed">
                                            {sale.comments}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-gray-500 py-8">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg
                                            className="w-8 h-8 text-gray-400"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                                            />
                                        </svg>
                                    </div>
                                    <p className="text-sm">Izoh yo'q</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mahsulotlar ro'yxati */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                                    <svg
                                        className="w-4 h-4 text-indigo-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                        />
                                    </svg>
                                </div>
                                {viewMode === "sold"
                                    ? `Sotilgan mahsulotlar (${sale.items.length} dona)`
                                    : `Qaytarilgan mahsulotlar (${
                                          sale.returns?.length || 0
                                      } dona)`}
                            </h3>

                            {/* View Mode Toggle Buttons */}
                            <div className="flex bg-gray-100 rounded-lg p-1">
                                <button
                                    onClick={() => setViewMode("sold")}
                                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                        viewMode === "sold"
                                            ? "bg-white text-blue-600 shadow-sm"
                                            : "text-gray-600 hover:text-gray-900"
                                    }`}
                                >
                                    Sotilganlar
                                </button>
                                <button
                                    onClick={() => setViewMode("returned")}
                                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                        viewMode === "returned"
                                            ? "bg-white text-blue-600 shadow-sm"
                                            : "text-gray-600 hover:text-gray-900"
                                    }`}
                                >
                                    Qaytarilganlar
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Mahsulot
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Kodi
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Barcode
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Miqdor
                                    </th>
                                    {viewMode === "returned" && (
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Qaytarilgan summa
                                        </th>
                                    )}
                                    {viewMode === "sold" && (
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Amallar
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {viewMode === "sold" ? (
                                    sale.items.map((item, index) => (
                                        <tr
                                            key={item.sale_item_id}
                                            className={`hover:bg-gray-50 transition-colors ${
                                                index % 2 === 0
                                                    ? "bg-white"
                                                    : "bg-gray-50"
                                            }`}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm mr-4">
                                                        {index + 1}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {item.product_name}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {item.product_code}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                                {item.barcode}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                                    {item.amount} dona
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() =>
                                                        handleReturnItem(item)
                                                    }
                                                    className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-red-600 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
                                                    title="Vazvrat qilish"
                                                >
                                                    <MdUndo className="w-3 h-3" />
                                                    Vazvrat qilish
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : sale.returns && sale.returns.length > 0 ? (
                                    sale.returns.map((returnItem, index) => (
                                        <tr
                                            key={returnItem.sale_item_return_id}
                                            className={`hover:bg-gray-50 transition-colors ${
                                                index % 2 === 0
                                                    ? "bg-white"
                                                    : "bg-gray-50"
                                            }`}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center text-white font-bold text-sm mr-4">
                                                        {index + 1}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {
                                                                returnItem.product_name
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                    {returnItem.product_code}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                                {returnItem.barcode}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                                                    {returnItem.amount} dona
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                                                    {formatNumber(
                                                        returnItem.total_refund
                                                    )}{" "}
                                                    so'm
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-6 py-12 text-center"
                                        >
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                                    <svg
                                                        className="w-8 h-8 text-gray-400"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                        />
                                                    </svg>
                                                </div>
                                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                                    Qaytarilgan mahsulotlar yo'q
                                                </h3>
                                                <p className="text-gray-500">
                                                    Bu sotuvda hali hech qanday
                                                    mahsulot qaytarilmagan
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Return Modal */}
            <Modal
                isOpen={isReturnModalOpen}
                onClose={handleCloseReturnModal}
                className="max-w-md"
            >
                {selectedItem && (
                    <div className="p-0">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <MdUndo className="w-5 h-5 text-red-600" />
                                Mahsulotni vazvrat qilish
                            </h2>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6">
                            <div className="mb-4">
                                <h3 className="text-sm font-medium text-gray-700 mb-2">
                                    Mahsulot:
                                </h3>
                                <p className="text-gray-900 font-medium">
                                    {selectedItem.product_name}
                                </p>
                                <p className="text-sm text-gray-500">
                                    Kodi: {selectedItem.product_code} | Mavjud:{" "}
                                    {selectedItem.amount} dona
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Vazvrat qilinadigan miqdor *
                                    </label>
                                    <input
                                        type="number"
                                        value={returnAmount}
                                        onChange={(e) =>
                                            setReturnAmount(e.target.value)
                                        }
                                        placeholder={`1 dan ${selectedItem.amount} gacha`}
                                        min="1"
                                        max={selectedItem.amount}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Qaytariladigan summa (ixtiyoriy)
                                    </label>
                                    <input
                                        type="number"
                                        value={totalRefund}
                                        onChange={(e) =>
                                            setTotalRefund(e.target.value)
                                        }
                                        placeholder="Summa kiriting..."
                                        step="0.01"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                            <button
                                onClick={handleCloseReturnModal}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Bekor qilish
                            </button>
                            <button
                                onClick={handleSubmitReturn}
                                disabled={isSubmitting}
                                className={`px-6 py-2 text-white rounded-lg transition-colors ${
                                    isSubmitting
                                        ? "bg-red-400 cursor-not-allowed"
                                        : "bg-red-600 hover:bg-red-700"
                                }`}
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Otkazilmoqda...
                                    </div>
                                ) : (
                                    "Vazvrat qilish"
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={handleCloseDeleteModal}
                className="max-w-md"
            >
                <div className="p-0">
                    {/* Modal Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <MdDelete className="w-5 h-5 text-red-600" />
                            Sotuvni bekor qilish
                        </h2>
                    </div>

                    {/* Modal Body */}
                    <div className="p-6">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MdDelete className="w-8 h-8 text-red-600" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Sotuvni bekor qilishni tasdiqlaysizmi?
                            </h3>
                            <p className="text-gray-600 mb-4">
                                Bu amalni qaytarib bo'lmaydi. Sotuv #
                                {sale?.sale_id} to'liq o'chiriladi.
                            </p>
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <p className="text-sm text-yellow-800">
                                    <strong>Ogoh bo'ling:</strong> Barcha
                                    mahsulotlar skladga qaytariladi va bu
                                    operatsiya qaytarib bo'lmaydi.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                        <button
                            onClick={handleCloseDeleteModal}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Bekor qilish
                        </button>
                        <button
                            onClick={handleConfirmDelete}
                            disabled={isDeleting}
                            className={`px-6 py-2 text-white rounded-lg transition-colors ${
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

export default SaleDetailsPage;
