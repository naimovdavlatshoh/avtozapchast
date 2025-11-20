import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { GetDailyDebtDetails } from "../../service/data";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Loader from "../../components/ui/loader/Loader";
import { toast } from "react-hot-toast";
import { formatDateOnly } from "../../utils/dateFormat";
import { formatNumber } from "../../utils/numberFormat";
import { MdArrowBack } from "react-icons/md";
import { AddItemsToDailyDebtSection } from "./AddItemsToDailyDebtPage";

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

type DailyDebtDetail = {
    id: number;
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

const DailyDebtDetailPage: React.FC = () => {
    const { dailyDebtId } = useParams<{ dailyDebtId: string }>();
    const navigate = useNavigate();
    const [dailyDebtDetail, setDailyDebtDetail] =
        useState<DailyDebtDetail | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const numericDailyDebtId = dailyDebtId ? parseInt(dailyDebtId) : null;

    const fetchDetail = useCallback(async () => {
        if (!numericDailyDebtId) {
            toast.error("Qarzdorlik ID topilmadi");
            navigate("/daily-debts");
            return;
        }

        setLoading(true);
        try {
            const response = await GetDailyDebtDetails(numericDailyDebtId);
            setDailyDebtDetail(response);
        } catch (error: any) {
            toast.error(
                error?.response?.data?.error ||
                    "Ma'lumotlarni yuklashda xatolik"
            );
            navigate("/daily-debts");
        } finally {
            setLoading(false);
        }
    }, [navigate, numericDailyDebtId]);

    useEffect(() => {
        fetchDetail();
    }, [fetchDetail]);

    if (loading) {
        return (
            <>
                <PageBreadcrumb pageTitle="Qarzdorlik ma'lumotlari" />
                <div className="flex justify-center items-center py-20">
                    <Loader />
                </div>
            </>
        );
    }

    if (!dailyDebtDetail) {
        return (
            <>
                <PageBreadcrumb pageTitle="Qarzdorlik ma'lumotlari" />
                <div className="text-center py-20 text-gray-500">
                    Ma'lumot topilmadi
                </div>
            </>
        );
    }

    return (
        <>
            <div
                className={`space-y-6 ${
                    localStorage.getItem("role_id") === "2" ? "p-5" : ""
                }`}
            >
                <div className="flex items-center justify-between gap-5 mb-6">
                    <div className="flex items-center gap-5">
                        <button
                            onClick={() => navigate(localStorage.getItem("role_id") === "1" ? "/daily-debts" : "/operator-daily-debts")}
                            className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                            <MdArrowBack className="text-xl" />
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Qarzdorlik ma'lumotlari
                        </h1>
                    </div>
                    <div className="flex items-center gap-5">
                        <button
                            onClick={() => {
                                const checkData = {
                                    cart: dailyDebtDetail.items.map((item) => ({
                                        product_id: item.product_id,
                                        product_name: item.product_name,
                                        product_code: item.product_code,
                                        selling_price: item.selling_price,
                                        last_receipt_price: 0,
                                        total_amount: item.amount,
                                        quantity: item.amount,
                                        total: item.selling_price * item.amount,
                                        image_id: undefined,
                                    })),
                                    isDebt: true,
                                    selectedClient: {
                                        client_name:
                                            dailyDebtDetail.client_name,
                                        client_phone_number:
                                            dailyDebtDetail.client_phone_number,
                                    },
                                    debtAmount: dailyDebtDetail.items
                                        .reduce(
                                            (sum, item) =>
                                                sum +
                                                parseFloat(
                                                    item.selling_price_usd
                                                ) *
                                                    item.amount,
                                            0
                                        )
                                        .toFixed(2),
                                    comments: "",
                                    discount: "0",
                                    totalAmount: dailyDebtDetail.items.reduce(
                                        (sum, item) =>
                                            sum +
                                            item.selling_price * item.amount,
                                        0
                                    ),
                                    totalItems: dailyDebtDetail.items.length,
                                    saleId: dailyDebtDetail.id,
                                    timestamp: formatDateOnly(
                                        dailyDebtDetail.created_at
                                    ),
                                    exchange_rate:
                                        dailyDebtDetail.exchange_rate,
                                };
                                const checkUrl = `/#/check-daily-debt?checkData=${encodeURIComponent(
                                    JSON.stringify(checkData)
                                )}`;
                                window.open(checkUrl, "_blank");
                            }}
                            className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-orange-600 bg-orange-100 rounded hover:bg-orange-200 transition-colors"
                            title="Check chiqarish"
                        >
                            Check chiqarish
                        </button>
                    </div>
                </div>
                {dailyDebtDetail && numericDailyDebtId && (
                    <AddItemsToDailyDebtSection
                        dailyDebtId={numericDailyDebtId}
                        variant="embedded"
                        initialDailyDebtInfo={{
                            client_name: dailyDebtDetail.client_name,
                            client_phone_number:
                                dailyDebtDetail.client_phone_number,
                        }}
                        onItemsAdded={fetchDetail}
                    />
                )}

                <div className="space-y-6">
                    {/* Client Info */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-4">
                            Mijoz ma'lumotlari
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Mijoz nomi
                                </label>
                                <p className="text-sm text-gray-900">
                                    {dailyDebtDetail.client_name}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Telefon raqami
                                </label>
                                <p className="text-sm text-gray-900">
                                    {dailyDebtDetail.client_phone_number}
                                </p>
                            </div>
                            {dailyDebtDetail.client_car_number && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Mashina raqami
                                    </label>
                                    <p className="text-sm text-gray-900">
                                        {dailyDebtDetail.client_car_number}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Debt Info */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-4">
                            Qarzdorlik ma'lumotlari
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Kurs
                                </label>
                                <p className="text-sm text-gray-900">
                                    {formatNumber(
                                        dailyDebtDetail.exchange_rate
                                    )}{" "}
                                    so'm
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Holat
                                </label>
                                <p className="text-sm text-gray-900">
                                    {dailyDebtDetail.debt_status === 0
                                        ? "Yopiq"
                                        : dailyDebtDetail.debt_status}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Faol
                                </label>
                                <p className="text-sm text-gray-900">
                                    {dailyDebtDetail.is_active === 1
                                        ? "Ha"
                                        : "Yo'q"}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Yaratilgan sana
                                </label>
                                <p className="text-sm text-gray-900">
                                    {formatDateOnly(dailyDebtDetail.created_at)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Items */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-4">
                            Mahsulotlar
                        </h3>
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
                                                Nomi
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3"
                                            >
                                                Barcode
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3"
                                            >
                                                Kod
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3"
                                            >
                                                Soni
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3"
                                            >
                                                Narxi (so'm)
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3"
                                            >
                                                Narxi ($)
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3"
                                            >
                                                Jami (so'm)
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3"
                                            >
                                                Jami ($)
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dailyDebtDetail.items.map(
                                            (item, idx) => (
                                                <tr
                                                    key={
                                                        item.daily_debt_item_id
                                                    }
                                                    className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                                                >
                                                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                                        {idx + 1}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {item.product_name}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {item.barcode}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {item.product_code}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {item.amount}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {formatNumber(
                                                            item.selling_price
                                                        )}{" "}
                                                        so'm
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {item.selling_price_usd}{" "}
                                                        $
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {formatNumber(
                                                            item.selling_price *
                                                                item.amount
                                                        )}{" "}
                                                        so'm
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {(
                                                            parseFloat(
                                                                item.selling_price_usd
                                                            ) * item.amount
                                                        ).toFixed(2)}{" "}
                                                        $
                                                    </td>
                                                </tr>
                                            )
                                        )}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-gray-50 dark:bg-gray-700">
                                            <td
                                                colSpan={7}
                                                className="px-6 py-4 text-right font-semibold"
                                            >
                                                Jami:
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap font-semibold">
                                                {formatNumber(
                                                    dailyDebtDetail.items.reduce(
                                                        (sum, item) =>
                                                            sum +
                                                            item.selling_price *
                                                                item.amount,
                                                        0
                                                    )
                                                )}{" "}
                                                so'm
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap font-semibold">
                                                {dailyDebtDetail.items
                                                    .reduce(
                                                        (sum, item) =>
                                                            sum +
                                                            parseFloat(
                                                                item.selling_price_usd
                                                            ) *
                                                                item.amount,
                                                        0
                                                    )
                                                    .toFixed(2)}{" "}
                                                $
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default DailyDebtDetailPage;
