import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import {
    PostSimple,
    GetDataSimple,
    AddItemsToDailyDebt,
} from "../../service/data";
import { toast } from "react-hot-toast";
import { formatNumber } from "../../utils/numberFormat";
import { convertUsdToUzs } from "../../utils/currencyConverter";
import {
    MdAdd,
    MdRemove,
    MdDelete,
    MdShoppingCart,
    MdArrowBack,
} from "react-icons/md";

interface Product {
    product_id: number;
    product_name: string;
    product_code?: string;
    total_amount: number;
    selling_price: number;
    barcode?: number;
    image_path?: string;
}

interface CartItem {
    product_id: number;
    product_name: string;
    product_code?: string;
    selling_price: number;
    total_amount: number;
    quantity: number;
    total: number;
    image_path?: string;
}

interface AddItemsToDailyDebtSectionProps {
    dailyDebtId: number;
    variant?: "page" | "embedded";
    onBack?: () => void;
    onItemsAdded?: () => void;
    initialDailyDebtInfo?: {
        client_name: string;
        client_phone_number: string;
        [key: string]: any;
    } | null;
}

export const AddItemsToDailyDebtSection: React.FC<
    AddItemsToDailyDebtSectionProps
> = ({
    dailyDebtId,
    variant = "embedded",
    onBack,
    onItemsAdded,
    initialDailyDebtInfo = null,
}) => {
    const [searchKeyword, setSearchKeyword] = useState("");
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [dollarRate, setDollarRate] = useState<number>(0);
    const [dailyDebtInfo, setDailyDebtInfo] =
        useState<any>(initialDailyDebtInfo);

    const isPageVariant = variant === "page";

    // Fetch dollar rate
    useEffect(() => {
        const fetchRate = async () => {
            try {
                const res: any = await GetDataSimple("api/arrival/dollar");
                setDollarRate(res?.dollar_rate || 0);
            } catch (e) {
                setDollarRate(12500);
            }
        };
        fetchRate();
    }, []);

    // Fetch daily debt info if not provided
    useEffect(() => {
        if (dailyDebtInfo) return;
        const fetchDailyDebtInfo = async () => {
            try {
                const res = await GetDataSimple(
                    `api/daily-debts/list?page=1&limit=1&status=closed`
                );
                const debt = res?.result?.find(
                    (d: any) => d.daily_debt_id === dailyDebtId
                );
                if (debt) {
                    setDailyDebtInfo(debt);
                }
            } catch (error) {
                console.error("Error fetching daily debt info:", error);
            }
        };
        fetchDailyDebtInfo();
    }, [dailyDebtId, dailyDebtInfo]);

    useEffect(() => {
        if (initialDailyDebtInfo) {
            setDailyDebtInfo(initialDailyDebtInfo);
        }
    }, [initialDailyDebtInfo]);

    // Search products
    const handleSearch = useCallback(async (keyword: string) => {
        if (!keyword.trim() || keyword.trim().length < 3) {
            setProducts([]);
            return;
        }

        setIsLoadingProducts(true);
        try {
            const response = await PostSimple(
                `api/products/search?keyword=${encodeURIComponent(keyword)}`
            );
            if (response?.data?.result) {
                setProducts(response.data.result);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Qidiruvda xatolik");
        } finally {
            setIsLoadingProducts(false);
        }
    }, []);

    const handleSearchChange = (value: string) => {
        setSearchKeyword(value);
        if (value.trim().length > 3) {
            handleSearch(value);
        } else if (value.trim().length === 0) {
            setProducts([]);
        }
    };

    // Cart functions
    const addToCart = (product: Product) => {
        if (!product.selling_price || product.selling_price <= 0) {
            toast.error("Bu mahsulotning narxi belgilanmagan");
            return;
        }

        if (product.total_amount < 1) {
            toast.error("Bu mahsulotdan skladda qolmagan");
            return;
        }

        setCart((prevCart) => {
            const existingItem = prevCart.find(
                (item) => item.product_id === product.product_id
            );

            if (existingItem) {
                if (existingItem.quantity >= product.total_amount) {
                    toast.error(
                        `Bu mahsulotdan skladda faqat ${product.total_amount} dona qolgan`
                    );
                    return prevCart;
                }

                return prevCart.map((item) =>
                    item.product_id === product.product_id
                        ? {
                              ...item,
                              quantity: item.quantity + 1,
                              total:
                                  (item.quantity + 1) *
                                  Number(item.selling_price),
                          }
                        : item
                );
            } else {
                return [
                    ...prevCart,
                    {
                        product_id: product.product_id,
                        product_name: product.product_name,
                        product_code: product.product_code,
                        selling_price: product.selling_price,
                        total_amount: product.total_amount,
                        quantity: 1,
                        total: Number(product.selling_price),
                        image_path: product.image_path,
                    },
                ];
            }
        });
        setSearchKeyword("");
        setProducts([]);
    };

    const updateQuantity = (productId: number, newQuantity: number) => {
        if (newQuantity <= 0) {
            removeFromCart(productId);
            return;
        }

        setCart((prevCart) => {
            const item = prevCart.find((item) => item.product_id === productId);
            if (item && newQuantity > item.total_amount) {
                toast.error(
                    `Bu mahsulotdan skladda faqat ${item.total_amount} dona qolgan`
                );
                return prevCart;
            }

            return prevCart.map((item) =>
                item.product_id === productId
                    ? {
                          ...item,
                          quantity: newQuantity,
                          total: newQuantity * Number(item.selling_price),
                      }
                    : item
            );
        });
    };

    const removeFromCart = (productId: number) => {
        setCart((prevCart) =>
            prevCart.filter((item) => item.product_id !== productId)
        );
    };

    const clearCart = () => {
        setCart([]);
    };

    const getTotalAmount = () => {
        return cart.reduce((total, item) => total + Number(item.total), 0);
    };

    const getTotalItems = () => {
        return cart.reduce((total, item) => total + item.quantity, 0);
    };

    // Submit
    const handleSubmit = async () => {
        if (cart.length === 0) {
            toast.error("Karzina bo'sh. Kamida bitta mahsulot qo'shing");
            return;
        }

        setIsSubmitting(true);
        try {
            const items = cart.map((item) => ({
                product_id: item.product_id,
                amount: item.quantity,
            }));

            const response = await AddItemsToDailyDebt(dailyDebtId, items);

            if (response) {
                toast.success("Mahsulotlar muvaffaqiyatli qo'shildi!");
                setCart([]);
                setProducts([]);
                setSearchKeyword("");
                onItemsAdded?.();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Xatolik yuz berdi");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            className={
                isPageVariant
                    ? "min-h-screen bg-gray-50 flex flex-col"
                    : "bg-white border border-gray-200 rounded-lg p-4 shadow-sm space-y-4"
            }
        >
            {/* Header */}
            <div
                className={
                    isPageVariant
                        ? "py-2 px-6 flex-shrink-0"
                        : "flex items-center justify-between"
                }
            >
                <div className="flex h-full justify-between items-center w-full gap-4">
                    <div className="flex items-center gap-3">
                        {isPageVariant && onBack && (
                            <button
                                onClick={onBack}
                                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Orqaga"
                            >
                                <MdArrowBack className="text-2xl" />
                            </button>
                        )}
                        <div>
                            <p
                                className={`font-semibold ${
                                    isPageVariant
                                        ? "text-xl text-black"
                                        : "text-base text-gray-900"
                                }`}
                            >
                                Mahsulot qo'shish
                            </p>
                            {dailyDebtInfo && (
                                <p className="text-sm text-gray-600">
                                    Mijoz: {dailyDebtInfo.client_name} |
                                    Telefon: {dailyDebtInfo.client_phone_number}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content - Two Column Layout */}
            <div
                className={
                    isPageVariant ? "relative mt-4 px-6" : "relative mt-2"
                }
            >
                <input
                    type="text"
                    placeholder="Mahsulot qidirish... (3+ harf)"
                    value={searchKeyword}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {searchKeyword && (
                    <button
                        onClick={() => {
                            setSearchKeyword("");
                            setProducts([]);
                        }}
                        className={`absolute ${
                            isPageVariant ? "right-10" : "right-4"
                        } top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600`}
                    >
                        ✕
                    </button>
                )}
            </div>
            <div
                className={
                    isPageVariant
                        ? "flex-1 flex overflow-hidden"
                        : "flex flex-col lg:flex-row gap-4"
                }
            >
                {/* Left Side - Search, Products and Cart (70%) */}
                <div
                    className={
                        isPageVariant
                            ? "w-[70%] px-6 overflow-y-auto"
                            : "flex-1 space-y-4"
                    }
                >
                    {/* Products List */}
                    {searchKeyword.trim() && products.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto mb-4 mt-4">
                            {products.map((product) => (
                                <div
                                    key={product?.product_id}
                                    onClick={() => {
                                        addToCart(product);
                                        setSearchKeyword("");
                                        setProducts([]);
                                    }}
                                    className={`flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                                        product?.selling_price &&
                                        product.selling_price > 0
                                            ? "cursor-pointer"
                                            : "cursor-not-allowed opacity-50"
                                    }`}
                                >
                                    <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg flex items-center justify-center overflow-hidden shadow-sm flex-shrink-0">
                                        {product.image_path ? (
                                            <img
                                                src={product.image_path}
                                                alt={product.product_name || ""}
                                                className="w-full h-full object-cover rounded-lg"
                                            />
                                        ) : (
                                            <span className="text-3xl">📦</span>
                                        )}
                                    </div>

                                    <div className="flex w-full justify-between items-center ml-6">
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-lg line-clamp-1">
                                                {product?.product_name ||
                                                    "Nomsiz mahsulot"}
                                            </h4>
                                            {product?.product_code && (
                                                <p className="text-md text-blue-600 font-semibold mb-1">
                                                    Kodi: {product.product_code}
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between gap-3">
                                                <span className="text-sm text-gray-700 font-semibold">
                                                    Sotish narxi ($):
                                                </span>
                                                <p
                                                    className={`text-md font-bold ${
                                                        product?.selling_price &&
                                                        product.selling_price >
                                                            0
                                                            ? "text-green-600"
                                                            : "text-red-500"
                                                    }`}
                                                >
                                                    {product?.selling_price &&
                                                    product.selling_price > 0
                                                        ? `${product.selling_price}`
                                                        : "Narx belgilanmagan"}
                                                </p>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-700 font-semibold">
                                                    Qolgan miqdor:
                                                </span>
                                                <p className="text-xs text-gray-800 font-semibold">
                                                    {product?.total_amount
                                                        ? `${product?.total_amount} dona`
                                                        : "Mahsulot yo'q"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Loading */}
                    {isLoadingProducts && (
                        <div className="flex justify-center items-center h-64">
                            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}

                    {/* No results */}
                    {searchKeyword.trim() &&
                        !isLoadingProducts &&
                        products.length === 0 && (
                            <div className="text-center py-8">
                                <p className="text-gray-500">
                                    Mahsulotlar topilmadi
                                </p>
                            </div>
                        )}

                    {/* Cart */}
                    {cart.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-lg shadow-lg mt-4">
                            <div className="p-4 border-b border-gray-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                        <MdShoppingCart className="text-blue-600" />
                                        Karzina
                                    </h2>
                                    <button
                                        onClick={clearCart}
                                        className="text-red-500 hover:text-red-700 text-sm"
                                    >
                                        Tozalash
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 h-full">
                                <div className="space-y-3">
                                    {cart.map((item) => (
                                        <div
                                            key={item.product_id}
                                            className="bg-gray-50 rounded-lg p-4 flex items-center gap-4"
                                        >
                                            <div className="w-[100px] h-[100px] object-cover bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg flex items-center justify-center overflow-hidden shadow-sm flex-shrink-0">
                                                {item.image_path ? (
                                                    <img
                                                        src={item.image_path}
                                                        alt={item.product_name}
                                                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                                                    />
                                                ) : (
                                                    <div className="text-2xl text-gray-400">
                                                        📦
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-semibold text-base text-gray-900 line-clamp-2">
                                                        {item.product_name}
                                                    </h4>
                                                    <button
                                                        onClick={() =>
                                                            removeFromCart(
                                                                item.product_id
                                                            )
                                                        }
                                                        className="text-red-500 hover:text-red-700 p-2 ml-2 flex-shrink-0"
                                                    >
                                                        <MdDelete className="text-lg" />
                                                    </button>
                                                </div>

                                                <div className="space-y-1 mt-2">
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-gray-600">
                                                            Narx:
                                                        </span>
                                                        <span className="font-semibold text-green-600">
                                                            {item.selling_price}{" "}
                                                            $
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-gray-600">
                                                            Jami:
                                                        </span>
                                                        <span className="font-semibold text-blue-600">
                                                            {item.total} $
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-center gap-1">
                                                <button
                                                    onClick={() =>
                                                        updateQuantity(
                                                            item.product_id,
                                                            item.quantity + 1
                                                        )
                                                    }
                                                    className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                                                >
                                                    <MdAdd className="text-sm" />
                                                </button>
                                                <span className="text-base font-medium w-8 text-center">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() =>
                                                        updateQuantity(
                                                            item.product_id,
                                                            item.quantity - 1
                                                        )
                                                    }
                                                    className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                                                >
                                                    <MdRemove className="text-sm" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Side - Summary (30%) */}
                {cart.length > 0 && (
                    <div
                        className={
                            isPageVariant
                                ? "w-[30%] px-6 py-4 overflow-y-auto bg-gray-50"
                                : "w-full lg:w-[30%] bg-gray-50 rounded-lg p-4"
                        }
                    >
                        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <MdShoppingCart className="text-blue-600" />
                                Umumiy ma'lumot
                            </h3>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-sm">
                                    <span>Mahsulotlar:</span>
                                    <span className="font-semibold">
                                        {getTotalItems()}
                                    </span>
                                </div>

                                <div className="flex justify-between text-lg font-bold border-t pt-3">
                                    <span>Jami:</span>
                                    <div className="text-right">
                                        <span className="text-blue-600">
                                            {getTotalAmount()} $
                                        </span>
                                        {dollarRate > 0 && (
                                            <p className="text-sm text-gray-500">
                                                ≈{" "}
                                                {formatNumber(
                                                    convertUsdToUzs(
                                                        getTotalAmount()
                                                    )
                                                )}{" "}
                                                so'm
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting || cart.length === 0}
                                className={`w-full px-4 py-3 text-white rounded-md transition-colors ${
                                    isSubmitting || cart.length === 0
                                        ? "bg-gray-400 cursor-not-allowed"
                                        : "bg-blue-600 hover:bg-blue-700"
                                }`}
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Qo'shilmoqda...
                                    </div>
                                ) : (
                                    "Qo'shish"
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const AddItemsToDailyDebtPage: React.FC = () => {
    const { dailyDebtId } = useParams<{ dailyDebtId: string }>();
    const navigate = useNavigate();

    if (!dailyDebtId) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500">
                    Qarzdorlik ID topilmadi. Please qaytadan urinib ko'ring.
                </p>
            </div>
        );
    }

    const numericId = parseInt(dailyDebtId);

    return (
        <AddItemsToDailyDebtSection
            dailyDebtId={numericId}
            variant="page"
            onBack={() => navigate("/daily-debts")}
            onItemsAdded={() => navigate("/daily-debts")}
        />
    );
};

export default AddItemsToDailyDebtPage;
