import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { formatNumber } from "../../utils/numberFormat";

interface CartItem {
    product_id: number;
    product_name: string;
    product_code?: string;
    selling_price: number;
    last_receipt_price: number;
    total_amount: number;
    quantity: number;
    total: number;
    image_id?: number;
}

interface CheckData {
    cart: CartItem[];
    isDebt: boolean;
    selectedClient: {
        client_name: string;
        client_phone_number?: string;
    };
    debtAmount: string;
    comments: string;
    discount: string;
    totalAmount: number;
    totalItems: number;
    saleId: number;
    timestamp: string;
    exchange_rate: number;
}

const CheckDailyDebt: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [checkData, setCheckData] = useState<CheckData | null>(null);

    useEffect(() => {
        if (searchParams.get("checkData")) {
            try {
                const checkDataFromUrl = JSON.parse(
                    decodeURIComponent(searchParams.get("checkData") || "")
                );
                setCheckData(checkDataFromUrl);
            } catch (error) {
                console.error("URL dan ma'lumot o'qishda xatolik:", error);
                navigate("/daily-debts");
            }
        } else {
            navigate("/daily-debts");
        }
    }, [searchParams, navigate]);

    // Avtomatik pechat qilish
    useEffect(() => {
        if (checkData) {
            const timer = setTimeout(() => {
                window.print();
            }, 100);

            return () => clearTimeout(timer);
        }
    }, [checkData]);

    if (!checkData) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p>Ma'lumotlar yuklanmoqda...</p>
                </div>
            </div>
        );
    }

    const calculateItemPrice = (item: CartItem) => {
        return item.selling_price;
    };

    const calculateItemTotal = (item: CartItem) => {
        return item.selling_price * item.quantity;
    };

    const totalInUzs = checkData.totalAmount;
    // const totalInUsd = parseFloat(checkData.debtAmount) || 0;

    return (
        <div className="bg-gray-100 flex items-start justify-center pt-4 p-4 print:bg-white print:p-0">
            <div className="bg-white rounded-lg p-4 max-w-[302px] w-full print:shadow-none">
                {/* Header */}
                <div className="text-center mb-6">
                    <h1 className="text-lg font-bold text-gray-900 mb-2">
                        EVRO BUKSER
                    </h1>
                    <h2 className="text-sm font-semibold text-gray-700 mb-4">
                        Чек временной задолженности
                    </h2>
                </div>

                {/* Ma'lumotlar */}
                <div className="space-y-2 mb-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-600">Mijoz:</span>
                        <span className="font-semibold text-gray-900">
                            {checkData.selectedClient.client_name}
                        </span>
                    </div>
                    {checkData.selectedClient.client_phone_number && (
                        <div className="flex justify-between">
                            <span className="text-gray-600">Telefon:</span>
                            <span className="font-semibold text-gray-900">
                                {checkData.selectedClient.client_phone_number}
                            </span>
                        </div>
                    )}
                    <div className="flex justify-between">
                        <span className="text-gray-600">Sana:</span>
                        <span className="font-semibold text-gray-900">
                            {checkData.timestamp}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">ID:</span>
                        <span className="font-semibold text-gray-900">
                            #{checkData.saleId}
                        </span>
                    </div>
                </div>

                <div className="border-t border-gray-300 my-4"></div>

                {/* Mahsulotlar */}
                <div className="space-y-3 mb-4">
                    {checkData.cart.map((item, index) => (
                        <div key={index} className="text-sm">
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-semibold text-gray-900 flex-1">
                                    {item.product_name}
                                </span>
                            </div>
                            {item.product_code && (
                                <div className="text-xs text-gray-600 mb-1">
                                    Kod: {item.product_code}
                                </div>
                            )}
                            <div className="flex justify-between text-xs text-gray-600">
                                <span>
                                    {item.quantity} x{" "}
                                    {formatNumber(calculateItemPrice(item))}{" "}
                                    so'm
                                </span>
                                <span className="font-semibold text-gray-900">
                                    {formatNumber(calculateItemTotal(item))}{" "}
                                    so'm
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="border-t border-gray-300 my-4"></div>

                {/* Jami */}
                <div className="space-y-2 mb-4 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-600">Mahsulotlar soni:</span>
                        <span className="font-semibold text-gray-900">
                            {checkData.totalItems}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Jami (so'm):</span>
                        <span className="font-semibold text-gray-900">
                            {formatNumber(totalInUzs)} so'm
                        </span>
                    </div>
                    {/* {totalInUsd > 0 && (
                        <div className="flex justify-between">
                            <span className="text-gray-600">Jami ($):</span>
                            <span className="font-semibold text-gray-900">
                                {totalInUsd.toFixed(2)} $
                            </span>
                        </div>
                    )} */}
                    {checkData.exchange_rate > 0 && (
                        <div className="flex justify-between text-xs text-gray-500">
                            <span>Kurs:</span>
                            <span>
                                {formatNumber(checkData.exchange_rate)} so'm
                            </span>
                        </div>
                    )}
                </div>

                {checkData.comments && (
                    <>
                        <div className="border-t border-gray-300 my-4"></div>
                        <div className="text-sm">
                            <div className="text-gray-600 mb-1">Izoh:</div>
                            <div className="text-gray-900">
                                {checkData.comments}
                            </div>
                        </div>
                    </>
                )}

                <div className="border-t border-gray-300 my-4"></div>

                {/* Footer */}
                <div className="text-center text-xs text-gray-500">
                    <p>Rahmat!</p>
                    <p className="mt-2">
                        {new Date().toLocaleString("uz-UZ", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CheckDailyDebt;
