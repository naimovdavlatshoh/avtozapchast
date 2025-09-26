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
            navigate("/pos");
        }
    }, [location.state, searchParams, navigate]);

    // Avtomatik pechat qilish
    useEffect(() => {
        if (saleData) {
            // Kichik kechikish bilan avtomatik pechat qilish
            const timer = setTimeout(() => {
                window.print();
            }, 100); // 1 soniya kechikish

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
        <div className="min-h-screen bg-gray-100 flex items-start justify-center pt-10 p-4">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-xs w-full">
                {/* Header */}
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">
                        Чек продажи
                    </h1>
                </div>

                {/* Ma'lumotlar */}
                <div className="space-y-2 mb-2 text-sm">
                    {/* <div className="flex justify-between">
                        <span className="text-gray-600">Бармен:</span>
                        <span className="font-medium">test</span>
                    </div> */}
                    <div className="flex justify-between">
                        <span className=" font-bold">Номер заказа:</span>
                        <span className="font-bold">#{saleData.saleId}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-bold">Дата:</span>
                        <span className="font-bold">{saleData.timestamp}</span>
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
                                <span className="font-bold">Сумма долга:</span>
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
                <div className=" mb-2">
                    {saleData.cart.map((item) => (
                        <div
                            key={item.product_id}
                            className="flex justify-between items-center py-1"
                        >
                            <div className="flex-1">
                                <p className="text-sm font-bold w-4/5">
                                    {item.product_name}
                                </p>
                                <p className="text-sm font-bold">
                                    {item.quantity} x{" "}
                                    {formatNumber(item.selling_price)} UZS
                                </p>
                            </div>
                            <div className="text-right">
                                <span className="font-bold text-gray-900">
                                    {formatNumber(item.total)} UZS
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Jami summa va chegirma */}
                <div className="border-t border-gray-300 pt-4 mb-2 space-y-2">
                    <div className="flex justify-between items-center text-lg font-bold text-gray-900">
                        <span>Итого:</span>
                        <span>{formatNumber(saleData.totalAmount)} UZS</span>
                    </div>

                    {/* Chegirma ko'rsatish */}
                    {saleData.discount && parseFloat(saleData.discount) > 0 && (
                        <>
                            <div className="flex justify-between items-center text-red-600">
                                <span>Скидка:</span>
                                <span className="font-bold">
                                    -
                                    {formatNumber(
                                        parseFloat(saleData.discount)
                                    )}{" "}
                                    UZS
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-lg font-bold text-green-600 border-t pt-2">
                                <span>К оплате:</span>
                                <span className="text-xl">
                                    {formatNumber(
                                        saleData.totalAmount -
                                            parseFloat(saleData.discount)
                                    )}{" "}
                                    UZS
                                </span>
                            </div>
                        </>
                    )}
                </div>

                {/* Xabar */}
                <div className="text-center mb-6">
                    <p className="font-bold">Спасибо! Ждем вас снова!</p>
                </div>
            </div>
        </div>
    );
};

export default CheckPage;
