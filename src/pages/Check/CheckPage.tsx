import React, { useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
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

interface SaleData {
    cart: CartItem[];
    isDebt: boolean;
    selectedClient: any;
    debtAmount: string;
    comments: string;
    discount: string;
    totalAmount: number;
    totalItems: number;
    saleId: number;
    timestamp: string;
}

const CheckPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [saleData, setSaleData] = React.useState<SaleData | null>(null);

    useEffect(() => {
        // Avval location.state dan tekshiramiz
        if (location.state?.saleData) {
            setSaleData(location.state.saleData);
        }
        // Keyin URL parametrlaridan tekshiramiz
        else if (searchParams.get("saleData")) {
            try {
                const saleDataFromUrl = JSON.parse(
                    decodeURIComponent(searchParams.get("saleData") || "")
                );
                setSaleData(saleDataFromUrl);
            } catch (error) {
                console.error("URL dan ma'lumot o'qishda xatolik:", error);
                navigate("/pos");
            }
        } else {
            // Agar ma'lumot yo'q bo'lsa, POS sahifasiga qaytish
            navigate("/pos");
        }
    }, [location.state, searchParams, navigate]);

    // Avtomatik pechat qilish
    useEffect(() => {
        if (saleData) {
            // Kichik kechikish bilan avtomatik pechat qilish
            const timer = setTimeout(() => {
                window.print();
            }, 1000); // 1 soniya kechikish

            return () => clearTimeout(timer);
        }
    }, [saleData]);

    if (!saleData) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p>Ma'lumotlar yuklanmoqda...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Print uchun CSS */}
            <style>
                {`
                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        .print-area, .print-area * {
                            visibility: visible;
                        }
                        .print-area {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 80mm !important;
                            margin: 0 !important;
                            padding: 0 !important;
                        }
                        .no-print {
                            display: none !important;
                        }
                        .print-area {
                            box-shadow: none !important;
                            border: none !important;
                        }
                    }
                `}
            </style>

            <div className="min-h-screen bg-gray-100 flex items-start justify-center pt-10 p-4">
                <div
                    className="print-area bg-white rounded-lg shadow-lg p-2 w-full"
                    style={{
                        maxWidth: "80mm",
                        minHeight: "auto",
                        height: "auto",
                    }}
                >
                    {/* Header */}
                    <div
                        className="text-center mb-4"
                        style={{ maxWidth: "70mm", margin: "0 auto" }}
                    >
                        <h1 className="text-lg font-bold text-gray-900 mb-2">
                            Чек продажи
                        </h1>
                    </div>

                    {/* Ma'lumotlar */}
                    <div
                        className="space-y-1 mb-2 text-xs"
                        style={{ maxWidth: "70mm", margin: "0 auto" }}
                    >
                        <div className="flex justify-between">
                            <span className=" font-bold">Номер заказа:</span>
                            <span className="font-bold">
                                #{saleData.saleId}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-bold">Дата:</span>
                            <span className="font-bold">
                                {saleData.timestamp}
                            </span>
                        </div>

                        {/* Qarz ma'lumotlari */}
                        {saleData.isDebt && saleData.selectedClient && (
                            <>
                                <div className="flex justify-between">
                                    <span className="font-bold">Клиент:</span>
                                    <span className="font-bold">
                                        {saleData.selectedClient.client_name}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-bold">
                                        Сумма долга:
                                    </span>
                                    <span className="font-bold text-red-600">
                                        {formatNumber(
                                            parseFloat(saleData.debtAmount)
                                        )}{" "}
                                        UZS
                                    </span>
                                </div>
                            </>
                        )}

                        {/* Izoh */}
                        {saleData.comments && (
                            <div className="flex justify-between">
                                <span className="font-bold">Комментарий:</span>
                                <span className="font-bold text-gray-600">
                                    {saleData.comments}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Mahsulotlar ro'yxati */}
                    <div
                        className="mb-2"
                        style={{ maxWidth: "70mm", margin: "0 auto" }}
                    >
                        {saleData.cart.map((item) => (
                            <div
                                key={item.product_id}
                                className="flex justify-between items-start py-1"
                            >
                                <div className="flex-1 pr-2">
                                    <p className="text-xs font-bold leading-tight mb-1">
                                        {item.product_name}
                                    </p>
                                    <p className="text-xs font-semibold text-gray-600">
                                        {item.quantity} x{" "}
                                        {formatNumber(item.selling_price)} UZS
                                    </p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <span className="font-bold text-gray-900 text-xs">
                                        {formatNumber(item.total)} UZS
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Jami summa va chegirma */}
                    <div
                        className="border-t border-gray-300 pt-2 mb-2 space-y-1"
                        style={{ maxWidth: "70mm", margin: "0 auto" }}
                    >
                        <div className="flex justify-between items-center text-sm font-bold text-gray-900">
                            <span>Итого:</span>
                            <span>
                                {formatNumber(saleData.totalAmount)} UZS
                            </span>
                        </div>

                        {/* Chegirma ko'rsatish */}
                        {saleData.discount &&
                            parseFloat(saleData.discount) > 0 && (
                                <>
                                    <div className="flex justify-between items-center text-red-600 text-xs">
                                        <span>Скидка:</span>
                                        <span className="font-bold">
                                            -
                                            {formatNumber(
                                                parseFloat(saleData.discount)
                                            )}{" "}
                                            UZS
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm font-bold text-green-600 border-t pt-1">
                                        <span>К оплате:</span>
                                        <span className="text-base">
                                            {formatNumber(
                                                saleData.totalAmount -
                                                    parseFloat(
                                                        saleData.discount
                                                    )
                                            )}{" "}
                                            UZS
                                        </span>
                                    </div>
                                </>
                            )}
                    </div>

                    {/* Xabar */}
                    <div
                        className="text-center mb-4"
                        style={{ maxWidth: "70mm", margin: "0 auto" }}
                    >
                        <p className="font-bold text-xs">
                            Спасибо! Ждем вас снова!
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CheckPage;
