import React, { useState, useEffect } from "react";
import { GetDataSimple, PostDataTokenJson } from "../../service/data";
import { formatNumber } from "../../utils/numberFormat";
import { formatDate } from "../../utils/dateFormat";
import { useParams, useNavigate } from "react-router";
import { MdArrowBack, MdPayment, MdDelete, MdVisibility } from "react-icons/md";
import { toast } from "react-hot-toast";
import { Modal } from "../../components/ui/modal";

interface SaleItem {
    sale_item_id: number;
    product_id: number;
    product_name: string;
    amount: number;
    barcode: number;
    product_code: string;
    selling_price: number;
    created_at: string;
}

interface Sale {
    sale_id: number;
    total_price: number;
    discount: number;
    total_price_with_discount: number;
    created_at: string;
    items: SaleItem[];
}

interface Payment {
    id: number;
    payment_amount: number;
    payment_type: number;
    comments: string;
    created_at: string;
}

interface DebtorDetails {
    client_id: number;
    total_debt: number;
    sales: Sale[];
    payments: Payment[];
}

const DebtorDetailsPage: React.FC = () => {
    const { debtorId, debtorName } = useParams<{
        debtorId: string;
        debtorName: string;
    }>();
    const navigate = useNavigate();
    const [debtor, setDebtor] = useState<DebtorDetails | null>(null);
    const [loading, setLoading] = useState(true);

    // Payment modal state
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState("");
    const [paymentAmountDisplay, setPaymentAmountDisplay] = useState("");
    const [paymentComments, setPaymentComments] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Delete modal state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(
        null
    );
    const [isDeleting, setIsDeleting] = useState(false);

    // Items modal state
    const [isItemsModalOpen, setIsItemsModalOpen] = useState(false);
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

    useEffect(() => {
        if (debtorId) {
            fetchDebtorDetails(parseInt(debtorId));
        }
    }, [debtorId]);

    const fetchDebtorDetails = async (id: number) => {
        try {
            setLoading(true);
            const response = await GetDataSimple(`api/debtors/read/${id}`);
            if (response) {
                setDebtor(response);
            } else {
                setDebtor(null);
            }
        } catch (error) {
            console.error("Qarzdor tafsilotlarini yuklashda xatolik:", error);
            setDebtor(null);
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        navigate(-1);
    };

    // Payment functions
    const handlePayment = () => {
        setPaymentAmount("");
        setPaymentAmountDisplay("");
        setPaymentComments("");
        setIsPaymentModalOpen(true);
    };

    const handleClosePaymentModal = () => {
        setIsPaymentModalOpen(false);
        setPaymentAmount("");
        setPaymentAmountDisplay("");
        setPaymentComments("");
    };

    // Format number input
    const handlePaymentAmountChange = (value: string) => {
        // Remove all non-digit characters except decimal point
        const cleanValue = value.replace(/[^\d.]/g, "");

        // Allow only one decimal point
        const parts = cleanValue.split(".");
        if (parts.length > 2) {
            return;
        }

        // Limit decimal places to 2
        if (parts[1] && parts[1].length > 2) {
            return;
        }

        setPaymentAmount(cleanValue);

        // Format for display with spaces, but preserve decimal point
        if (cleanValue) {
            // If it ends with decimal point, don't format yet
            if (cleanValue.endsWith(".")) {
                setPaymentAmountDisplay(cleanValue);
                return;
            }

            // If it has decimal part, format carefully
            if (cleanValue.includes(".")) {
                const [integerPart, decimalPart] = cleanValue.split(".");
                const formattedInteger = formatNumber(
                    parseInt(integerPart) || 0
                );
                setPaymentAmountDisplay(`${formattedInteger}.${decimalPart}`);
            } else {
                // Format integer part only
                const numValue = parseFloat(cleanValue);
                if (!isNaN(numValue)) {
                    setPaymentAmountDisplay(formatNumber(numValue));
                } else {
                    setPaymentAmountDisplay(cleanValue);
                }
            }
        } else {
            setPaymentAmountDisplay("");
        }
    };

    const handleSubmitPayment = async () => {
        if (!debtor || !paymentAmount.trim()) {
            toast.error("To'lov summasini kiriting");
            return;
        }

        const amount = parseFloat(paymentAmount);
        if (amount <= 0) {
            toast.error("To'lov summasi 0 dan katta bo'lishi kerak");
            return;
        }

        if (amount > debtor.total_debt) {
            toast.error(
                "To'lov summasi qolgan qarzdan ko'p bo'lishi mumkin emas"
            );
            return;
        }

        setIsSubmitting(true);
        try {
            const paymentData: any = {
                client_id: debtor.client_id,
                payment_amount: amount,
                payment_type: 1, // Default payment type
            };

            // Add comments only if provided
            if (paymentComments.trim()) {
                paymentData.comments = paymentComments.trim();
            }

            const response = await PostDataTokenJson(
                "api/debtors/payment",
                paymentData
            );

            if (response) {
                toast.success("To'lov muvaffaqiyatli amalga oshirildi");
                // Sahifani qayta yuklash
                if (debtorId) {
                    fetchDebtorDetails(parseInt(debtorId));
                }
                handleClosePaymentModal();
            }
        } catch (error: any) {
            toast.error(
                error?.response?.data?.error ||
                    "To'lov amalga oshirishda xatolik yuz berdi"
            );
            handleClosePaymentModal();
        } finally {
            setIsSubmitting(false);
        }
    };

    // Delete functions
    const handleDeletePayment = (payment: Payment) => {
        setSelectedPayment(payment);
        setIsDeleteModalOpen(true);
    };

    const handleCloseDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setSelectedPayment(null);
    };

    const handleConfirmDelete = async () => {
        if (!selectedPayment) return;

        setIsDeleting(true);
        try {
            const response = await PostDataTokenJson(
                `api/debtors/delete/${selectedPayment.id}`,
                {}
            );
            if (response) {
                toast.success("To'lov muvaffaqiyatli o'chirildi");
                // Sahifani qayta yuklash
                if (debtorId) {
                    fetchDebtorDetails(parseInt(debtorId));
                }
                handleCloseDeleteModal();
            }
        } catch (error: any) {
            // console.log(error);
            // console.log(error?.response?.data?.error);
            toast.error(error?.response?.data?.error);
            handleCloseDeleteModal();
        } finally {
            setIsDeleting(false);
        }
    };

    // Items modal functions
    const handleViewItems = (sale: Sale) => {
        setSelectedSale(sale);
        setIsItemsModalOpen(true);
    };

    const handleCloseItemsModal = () => {
        setIsItemsModalOpen(false);
        setSelectedSale(null);
    };

    // Print check function - same as SalesHistoryPage
    const handlePrintCheck = (sale: Sale) => {
        // Sale ma'lumotlarini check formatiga aylantirish
        const saleData = {
            cart: sale.items.map((item) => ({
                product_id: item.product_id,
                product_name: item.product_name,
                product_code: item.product_code,
                selling_price: item.selling_price, // Use actual selling price from API
                last_receipt_price: 0,
                total_amount: item.amount,
                quantity: item.amount,
                total: item.selling_price * item.amount, // Calculate total correctly
                image_id: undefined,
            })),
            isDebt: true,
            selectedClient: {
                client_id: debtor?.client_id,
                client_name: debtorName,
            },
            debtAmount: sale.total_price_with_discount.toString(),
            comments: "",
            discount: sale.discount.toString(),
            totalAmount: sale.total_price_with_discount,
            totalItems: sale.items.length,
            saleId: sale.sale_id,
            timestamp: formatDate(sale.created_at),
        };

        // Check sahifasini yangi oynada ochish
        const checkUrl = `/#/check-debtor-detail?saleData=${encodeURIComponent(
            JSON.stringify(saleData)
        )}`;
        window.open(checkUrl, "_blank");
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p>Qarzdor tafsilotlari yuklanmoqda...</p>
                </div>
            </div>
        );
    }

    if (!debtor) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                        Qarzdor topilmadi
                    </h2>
                    <button
                        onClick={handleBack}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Orqaga qaytish
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className=" bg-gray-50">
            <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleBack}
                                className="p-2  hover:text-blue-600 text-blue-600 bg-blue-100 rounded-lg transition-colors"
                                title="Orqaga"
                            >
                                <MdArrowBack className="text-2xl" />
                            </button>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    Qarzdor - {debtorName}
                                </h1>
                            </div>
                        </div>
                        <button
                            onClick={handlePayment}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                            title="To'lov qilish"
                        >
                            <MdPayment className="w-4 h-4" />
                            To'lov qilish
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                                <svg
                                    className="w-6 h-6 text-red-600"
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
                                <p className="text-sm font-medium text-gray-600">
                                    Jami qarz
                                </p>
                                <p className="text-2xl font-bold text-red-600">
                                    {formatNumber(debtor.total_debt)} so'm
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                                <svg
                                    className="w-6 h-6 text-green-600"
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
                                <p className="text-sm font-medium text-gray-600">
                                    To'langan
                                </p>
                                <p className="text-2xl font-bold text-green-600">
                                    {formatNumber(
                                        debtor.payments.reduce(
                                            (sum, payment) =>
                                                sum + payment.payment_amount,
                                            0
                                        )
                                    )}{" "}
                                    so'm
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
                                <svg
                                    className="w-6 h-6 text-yellow-600"
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
                            <div>
                                <p className="text-sm font-medium text-gray-600">
                                    Qolgan qarz
                                </p>
                                <p className="text-2xl font-bold text-yellow-600">
                                    {formatNumber(
                                        debtor.total_debt -
                                            debtor.payments.reduce(
                                                (sum, payment) =>
                                                    sum +
                                                    payment.payment_amount,
                                                0
                                            )
                                    )}{" "}
                                    so'm
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mijoz ma'lumotlari */}
                {/* <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Mijoz ma'lumotlari
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm font-medium text-gray-600">
                                Mijoz ID
                            </p>
                            <p className="text-lg font-semibold text-gray-900">
                                #{debtor.client_id}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600">
                                Jami qarz
                            </p>
                            <p className="text-lg font-semibold text-gray-900">
                                {formatNumber(debtor.total_debt)} so'm
                            </p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600">
                                To'langan
                            </p>
                            <p className="text-lg font-semibold text-gray-900">
                                {formatNumber(
                                    debtor.payments.reduce(
                                        (sum, payment) =>
                                            sum + payment.payment_amount,
                                        0
                                    )
                                )}{" "}
                                so'm
                            </p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600">
                                Qolgan qarz
                            </p>
                            <p className="text-lg font-semibold text-gray-900">
                                {formatNumber(
                                    debtor.total_debt -
                                        debtor.payments.reduce(
                                            (sum, payment) =>
                                                sum + payment.payment_amount,
                                            0
                                        )
                                )}{" "}
                                so'm
                            </p>
                        </div>
                    </div>
                </div> */}

                {/* Sotuvlar tarixi */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Sotuvlar tarixi ({debtor.sales.length} dona)
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        #
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Sotuv ID
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Jami summa
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Chegirma
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        To'lanadigan summa
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Sana
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Harakatlar
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {debtor.sales.map((sale, index) => (
                                    <tr
                                        key={sale.sale_id}
                                        className="hover:bg-gray-50"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-xs">
                                                {index + 1}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                #{sale.sale_id}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-medium text-gray-900">
                                                {formatNumber(sale.total_price)}{" "}
                                                so'm
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-medium text-red-600">
                                                -{formatNumber(sale.discount)}{" "}
                                                so'm
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                {formatNumber(
                                                    sale.total_price_with_discount
                                                )}{" "}
                                                so'm
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(sale.created_at)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() =>
                                                        handleViewItems(sale)
                                                    }
                                                    className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
                                                    title="Mahsulotlarni ko'rish"
                                                >
                                                    <MdVisibility className="w-3 h-3" />
                                                    Mahsulotlar
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handlePrintCheck(sale)
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
                                                            strokeWidth={2}
                                                            d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                                                        />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* To'lovlar tarixi */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">
                            To'lovlar tarixi ({debtor.payments.length} marta)
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        #
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        To'lov summasi
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Izoh
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Yaratilgan sana
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Harakatlar
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {debtor.payments.map((payment, index) => (
                                    <tr
                                        key={payment.id}
                                        className="hover:bg-gray-50"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-xs">
                                                {index + 1}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                                {formatNumber(
                                                    payment.payment_amount
                                                )}{" "}
                                                so'm
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {payment.comments || "-"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(payment.created_at)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() =>
                                                    handleDeletePayment(payment)
                                                }
                                                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-red-600 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
                                                title="To'lovni o'chirish"
                                            >
                                                <MdDelete className="w-3 h-3" />
                                                O'chirish
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Payment Modal */}
                <Modal
                    isOpen={isPaymentModalOpen}
                    onClose={handleClosePaymentModal}
                >
                    <div className="p-6">
                        <div className="flex items-center mb-4">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                                <MdPayment className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    To'lov qilish
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Qarzdor #{debtor.client_id} uchun to'lov
                                    amalga oshirish
                                </p>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                            <h4 className="font-medium text-gray-900 mb-2">
                                Qarzdor ma'lumotlari:
                            </h4>
                            <div className="space-y-1 text-sm text-gray-600">
                                <p>
                                    <span className="font-medium">
                                        Qolgan qarz:
                                    </span>{" "}
                                    {formatNumber(
                                        debtor.total_debt -
                                            debtor.payments.reduce(
                                                (sum, payment) =>
                                                    sum +
                                                    payment.payment_amount,
                                                0
                                            )
                                    )}{" "}
                                    so'm
                                </p>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                To'lov summasi *
                            </label>
                            <input
                                type="text"
                                value={paymentAmountDisplay}
                                onChange={(e) =>
                                    handlePaymentAmountChange(e.target.value)
                                }
                                placeholder="To'lov summasini kiriting"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Izoh (ixtiyoriy)
                            </label>
                            <textarea
                                value={paymentComments}
                                onChange={(e) =>
                                    setPaymentComments(e.target.value)
                                }
                                placeholder="To'lov haqida izoh qoldiring..."
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={handleClosePaymentModal}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Bekor qilish
                            </button>
                            <button
                                onClick={handleSubmitPayment}
                                disabled={isSubmitting}
                                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                                    isSubmitting
                                        ? "bg-green-400 cursor-not-allowed"
                                        : "bg-green-600 hover:bg-green-700"
                                }`}
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        To'lanmoqda...
                                    </div>
                                ) : (
                                    "To'lov qilish"
                                )}
                            </button>
                        </div>
                    </div>
                </Modal>

                {/* Delete Modal */}
                <Modal
                    isOpen={isDeleteModalOpen}
                    onClose={handleCloseDeleteModal}
                >
                    <div className="p-6">
                        <div className="flex items-center mb-4">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                                <MdDelete className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    To'lovni o'chirish
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Bu amalni qaytarib bo'lmaydi
                                </p>
                            </div>
                        </div>

                        {selectedPayment && (
                            <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                <h4 className="font-medium text-gray-900 mb-2">
                                    To'lov ma'lumotlari:
                                </h4>
                                <div className="space-y-1 text-sm text-gray-600">
                                    <p>
                                        <span className="font-medium">
                                            Summa:
                                        </span>{" "}
                                        {formatNumber(
                                            selectedPayment.payment_amount
                                        )}{" "}
                                        so'm
                                    </p>
                                    <p>
                                        <span className="font-medium">
                                            Izoh:
                                        </span>{" "}
                                        {selectedPayment.comments ||
                                            "Izoh yo'q"}
                                    </p>
                                    <p>
                                        <span className="font-medium">
                                            Sana:
                                        </span>{" "}
                                        {formatDate(selectedPayment.created_at)}
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

                {/* Items Modal */}
                <Modal
                    isOpen={isItemsModalOpen}
                    onClose={handleCloseItemsModal}
                >
                    <div className="p-6">
                        <div className="flex items-center mb-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                                <MdVisibility className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Sotuv mahsulotlari
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Sotuv #{selectedSale?.sale_id} mahsulotlari
                                </p>
                            </div>
                        </div>

                        {selectedSale && (
                            <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                <h4 className="font-medium text-gray-900 mb-2">
                                    Sotuv ma'lumotlari:
                                </h4>
                                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                                    <div>
                                        <span className="font-medium">
                                            Sotuv ID:
                                        </span>{" "}
                                        #{selectedSale.sale_id}
                                    </div>
                                    <div>
                                        <span className="font-medium">
                                            Jami summa:
                                        </span>{" "}
                                        {formatNumber(selectedSale.total_price)}{" "}
                                        so'm
                                    </div>
                                    <div>
                                        <span className="font-medium">
                                            Chegirma:
                                        </span>{" "}
                                        {formatNumber(selectedSale.discount)}{" "}
                                        so'm
                                    </div>
                                    <div>
                                        <span className="font-medium">
                                            To'lanadigan:
                                        </span>{" "}
                                        {formatNumber(
                                            selectedSale.total_price_with_discount
                                        )}{" "}
                                        so'm
                                    </div>
                                    <div className="col-span-2">
                                        <span className="font-medium">
                                            Sana:
                                        </span>{" "}
                                        {formatDate(selectedSale.created_at)}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="mb-6">
                            <h4 className="font-medium text-gray-900 mb-4">
                                Mahsulotlar ({selectedSale?.items.length || 0}{" "}
                                dona)
                            </h4>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                #
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Mahsulot nomi
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Mahsulot kodi
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Barkod
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Miqdor
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {selectedSale?.items.map(
                                            (item, index) => (
                                                <tr
                                                    key={item.sale_item_id}
                                                    className="hover:bg-gray-50"
                                                >
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                        {index + 1}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <span className="text-sm font-medium text-gray-900">
                                                            {item.product_name}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                        {item.product_code}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                        {item.barcode}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                            {item.amount} dona
                                                        </span>
                                                    </td>
                                                </tr>
                                            )
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={handleCloseItemsModal}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Yopish
                            </button>
                        </div>
                    </div>
                </Modal>
            </div>
        </div>
    );
};

export default DebtorDetailsPage;
