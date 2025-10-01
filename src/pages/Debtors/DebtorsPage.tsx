import React, { useState, useEffect } from "react";
import { GetDataSimple, PostDataTokenJson } from "../../service/data";
import { formatNumber } from "../../utils/numberFormat";
import { Link } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Pagination from "../../components/common/Pagination";
import Loader from "../../components/ui/loader/Loader";
import { MdVisibility, MdPayment, MdDelete } from "react-icons/md";
import { Modal } from "../../components/ui/modal";
import { toast } from "react-hot-toast";

interface Debtor {
    client_id: number;
    client_name: string;
    total_sales: string;
    total_payments: string;
    debt: string;
}

interface TotalDebts {
    total_debt: number;
    total_payments: number;
    debt_minus_payments: number;
}

const DebtorsPage: React.FC = () => {
    const [debtorsData, setDebtorsData] = useState<Debtor[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Payment modal state
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedDebtor, setSelectedDebtor] = useState<Debtor | null>(null);
    const [paymentAmount, setPaymentAmount] = useState("");
    const [paymentComments, setPaymentComments] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [totalDebts, setTotalDebts] = useState<TotalDebts | null>(null);

    // Delete modal state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchDebtors = async (pageNum: number = 1) => {
        try {
            setLoading(true);
            const response = await GetDataSimple(
                `api/debtors/list?page=${pageNum}&limit=30`
            );
            if (response?.result) {
                setDebtorsData(response.result);
                setTotalPages(response.pages || 1);
            }
        } catch (error) {
            console.error("Qarzdorlarni yuklashda xatolik:", error);
            toast.error("Qarzdorlarni yuklashda xatolik");
        } finally {
            setLoading(false);
        }
    };
    const fetchTotalDebts = async () => {
        try {
            setLoading(true);
            const response = await GetDataSimple(`api/debtors/details`);
            if (response) {
                setTotalDebts(response);
            }
        } catch (error) {
            console.error("Qarzdorlarni yuklashda xatolik:", error);
            toast.error("Nimadir xatolik yuz berdi");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDebtors(page);
        fetchTotalDebts();
    }, [page]);

    // Payment functions
    const handlePayment = (debtor: Debtor) => {
        setSelectedDebtor(debtor);
        setPaymentAmount("");
        setPaymentComments("");
        setIsPaymentModalOpen(true);
    };

    const handleClosePaymentModal = () => {
        setIsPaymentModalOpen(false);
        setSelectedDebtor(null);
        setPaymentAmount("");
        setPaymentComments("");
    };

    const handleSubmitPayment = async () => {
        if (!selectedDebtor || !paymentAmount.trim()) {
            toast.error("To'lov summasini kiriting");
            return;
        }

        const amount = parseFloat(paymentAmount);
        if (amount <= 0) {
            toast.error("To'lov summasi 0 dan katta bo'lishi kerak");
            return;
        }

        if (amount > parseFloat(selectedDebtor.debt)) {
            toast.error(
                "To'lov summasi qolgan qarzdan ko'p bo'lishi mumkin emas"
            );
            return;
        }

        setIsSubmitting(true);
        try {
            const paymentData: any = {
                client_id: selectedDebtor.client_id,
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
                fetchDebtors(page);
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
    const handleDeleteDebtor = (debtor: Debtor) => {
        setSelectedDebtor(debtor);
        setIsDeleteModalOpen(true);
    };

    const handleCloseDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setSelectedDebtor(null);
    };

    const handleConfirmDelete = async () => {
        if (!selectedDebtor) return;

        setIsDeleting(true);
        try {
            const response = await PostDataTokenJson(
                `api/debtors/delete/${selectedDebtor.client_id}`,
                {}
            );
            if (response) {
                toast.success("Qarzdor muvaffaqiyatli o'chirildi");
                fetchDebtors(page);
                handleCloseDeleteModal();
            }
        } catch (error: any) {
            toast.error(
                error?.response?.data?.error ||
                    "Qarzdorni o'chirishda xatolik yuz berdi"
            );
            handleCloseDeleteModal();
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading) {
        return <Loader />;
    }

    return (
        <>
            <PageBreadcrumb pageTitle="Qarzdorlar" />
            <div className="space-y-6">
                <ComponentCard
                    title="Qarzdorlar"
                    desc={
                        <div className="flex gap-4 items-center">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-blue-50 rounded-lg p-4">
                                    <div className="flex items-center">
                                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
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
                                                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                                                />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-600">
                                                Jami sotuvlar
                                            </p>
                                            <p className="text-lg font-bold text-blue-600">
                                                {formatNumber(
                                                    debtorsData?.reduce(
                                                        (sum) =>
                                                            sum +
                                                            parseFloat(
                                                                totalDebts?.total_debt?.toString() ||
                                                                    "0"
                                                            ),
                                                        0
                                                    ) || 0
                                                )}{" "}
                                                so'm
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-green-50 rounded-lg p-4">
                                    <div className="flex items-center">
                                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                                            <svg
                                                className="w-4 h-4 text-green-600"
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
                                            <p className="text-xs font-medium text-gray-600">
                                                To'langan
                                            </p>
                                            <p className="text-lg font-bold text-green-600">
                                                {formatNumber(
                                                    debtorsData?.reduce(
                                                        (sum) =>
                                                            sum +
                                                            parseFloat(
                                                                totalDebts?.total_payments?.toString() ||
                                                                    "0"
                                                            ),
                                                        0
                                                    ) || 0
                                                )}{" "}
                                                so'm
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-red-50 rounded-lg p-4">
                                    <div className="flex items-center">
                                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
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
                                            <p className="text-xs font-medium text-gray-600">
                                                Qolgan qarz
                                            </p>
                                            <p className="text-lg font-bold text-red-600">
                                                {formatNumber(
                                                    debtorsData?.reduce(
                                                        (sum) =>
                                                            sum +
                                                            parseFloat(
                                                                totalDebts?.debt_minus_payments?.toString() ||
                                                                    "0"
                                                            ),
                                                        0
                                                    ) || 0
                                                )}{" "}
                                                so'm
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    }
                >
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        #
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Mijoz
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Jami sotuvlar
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        To'langan
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Qolgan qarz
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Harakatlar
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {debtorsData?.map(
                                    (debtor: Debtor, index: number) => (
                                        <tr
                                            key={debtor.client_id}
                                            className="hover:bg-gray-50"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {index + 1}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {debtor.client_name}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {formatNumber(
                                                        parseFloat(
                                                            debtor.total_sales
                                                        )
                                                    )}{" "}
                                                    so'm
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    {formatNumber(
                                                        parseFloat(
                                                            debtor.total_payments
                                                        )
                                                    )}{" "}
                                                    so'm
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                    {formatNumber(
                                                        parseFloat(debtor.debt)
                                                    )}{" "}
                                                    so'm
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex items-center gap-2">
                                                    <Link
                                                        to={`/debtors/${debtor.client_id}`}
                                                        className="inline-flex items-center gap-1 px-2 py-2 text-xs font-medium text-blue-600 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
                                                        title="Tafsilotlar"
                                                    >
                                                        <MdVisibility className="w-4 h-4" />
                                                    </Link>
                                                    <button
                                                        onClick={() =>
                                                            handlePayment(
                                                                debtor
                                                            )
                                                        }
                                                        className="inline-flex items-center gap-1 px-2 py-2 text-xs font-medium text-green-600 bg-green-100 rounded hover:bg-green-200 transition-colors"
                                                        title="To'lov qilish"
                                                    >
                                                        <MdPayment className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleDeleteDebtor(
                                                                debtor
                                                            )
                                                        }
                                                        className="inline-flex items-center gap-1 px-2 py-2 text-xs font-medium text-red-600 bg-red-100 rounded hover:bg-red-200 transition-colors"
                                                        title="O'chirish"
                                                    >
                                                        <MdDelete className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-4">
                        <Pagination
                            currentPage={page}
                            totalPages={totalPages}
                            onPageChange={setPage}
                        />
                    </div>
                </ComponentCard>
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
                                Qarzdor uchun to'lov amalga oshirish
                            </p>
                        </div>
                    </div>

                    {selectedDebtor && (
                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                            <h4 className="font-medium text-gray-900 mb-2">
                                Qarzdor ma'lumotlari:
                            </h4>
                            <div className="space-y-1 text-sm text-gray-600">
                                <p>
                                    <span className="font-medium">Ism:</span>{" "}
                                    {selectedDebtor.client_name}
                                </p>
                                <p>
                                    <span className="font-medium">
                                        Qolgan qarz:
                                    </span>{" "}
                                    {formatNumber(
                                        parseFloat(selectedDebtor.debt)
                                    )}{" "}
                                    so'm
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            To'lov summasi *
                        </label>
                        <input
                            type="number"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
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
                            onChange={(e) => setPaymentComments(e.target.value)}
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
            <Modal isOpen={isDeleteModalOpen} onClose={handleCloseDeleteModal}>
                <div className="p-6">
                    <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                            <MdDelete className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                Qarzdorni o'chirish
                            </h3>
                            <p className="text-sm text-gray-500">
                                Bu amalni qaytarib bo'lmaydi
                            </p>
                        </div>
                    </div>

                    {selectedDebtor && (
                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                            <h4 className="font-medium text-gray-900 mb-2">
                                Qarzdor ma'lumotlari:
                            </h4>
                            <div className="space-y-1 text-sm text-gray-600">
                                <p>
                                    <span className="font-medium">Ism:</span>{" "}
                                    {selectedDebtor.client_name}
                                </p>
                                <p>
                                    <span className="font-medium">
                                        Qolgan qarz:
                                    </span>{" "}
                                    {formatNumber(
                                        parseFloat(selectedDebtor.debt)
                                    )}{" "}
                                    so'm
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
        </>
    );
};

export default DebtorsPage;
