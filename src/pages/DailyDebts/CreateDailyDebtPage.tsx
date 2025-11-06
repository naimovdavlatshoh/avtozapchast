import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { PostSimple, GetDataSimple, CreateDailyDebt } from "../../service/data";
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
import Input from "../../components/form/input/InputField";
import Loader from "../../components/ui/loader/Loader";

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

const CreateDailyDebtPage: React.FC = () => {
    const navigate = useNavigate();
    const [clientName, setClientName] = useState("");
    const [clientPhone, setClientPhone] = useState("");
    const [clientCarNumber, setClientCarNumber] = useState("");
    const [searchKeyword, setSearchKeyword] = useState("");
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [dollarRate, setDollarRate] = useState<number>(0);

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

    // Search products
    const handleSearch = async () => {
        if (!searchKeyword.trim() || searchKeyword.trim().length < 3) {
            setProducts([]);
            return;
        }

        setIsLoadingProducts(true);
        try {
            const response = await PostSimple(
                `api/products/search?keyword=${encodeURIComponent(
                    searchKeyword
                )}`
            );
            if (response?.data?.result) {
                setProducts(response.data.result);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Qidiruvda xatolik");
        } finally {
            setIsLoadingProducts(false);
        }
    };

    const handleSearchChange = (value: string) => {
        setSearchKeyword(value);
        if (value.trim().length > 3) {
            handleSearch();
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

    // Submit daily debt
    const handleSubmit = async () => {
        if (!clientName.trim()) {
            toast.error("Mijoz nomini kiriting");
            return;
        }

        if (!clientPhone.trim()) {
            toast.error("Mijoz telefon raqamini kiriting");
            return;
        }

        if (cart.length === 0) {
            toast.error("Karzina bo'sh. Kamida bitta mahsulot qo'shing");
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                client_name: clientName.trim(),
                client_phone_number: clientPhone.trim(),
                client_car_number: clientCarNumber.trim() || undefined,
                items: cart.map((item) => ({
                    product_id: item.product_id,
                    amount: item.quantity,
                })),
            };

            const response = await CreateDailyDebt(payload);

            if (response) {
                toast.success("Vaqtincha qarzdorlik muvaffaqiyatli yaratildi!");
                navigate(localStorage.getItem("role_id") === "1"? "/daily-debts":"/operator-daily-debts");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Xatolik yuz berdi");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={localStorage.getItem("role_id") === "2" ? "p-5" : ""}>
            <div className="space-y-6">
                <div className="flex items-center justify-start gap-5 mb-6">
                    <button
                        onClick={() => navigate(localStorage.getItem("role_id") === "1"? "/daily-debts":"/operator-daily-debts")}
                        className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                        <MdArrowBack className="text-xl" />
                    </button>
                    <p className="text-2xl text-black">
                        Yangi vaqtincha qarzdorlik
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left side - Products (2/3) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Product Search */}
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <h3 className="text-lg font-semibold mb-4">
                                Mahsulot qidirish
                            </h3>
                            <div className="relative">
                                <Input
                                    type="text"
                                    value={searchKeyword}
                                    onChange={(e) =>
                                        handleSearchChange(e.target.value)
                                    }
                                    placeholder="Mahsulot qidirish... (3+ harf)"
                                    className="w-full"
                                />
                                {searchKeyword && (
                                    <button
                                        onClick={() => {
                                            setSearchKeyword("");
                                            setProducts([]);
                                        }}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>

                            {/* Products List */}
                            {isLoadingProducts && (
                                <div className="flex justify-center py-8">
                                    <Loader />
                                </div>
                            )}

                            {searchKeyword.trim() && products.length > 0 && (
                                <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
                                    {products.map((product) => (
                                        <div
                                            key={product.product_id}
                                            onClick={() => addToCart(product)}
                                            className={`flex items-center gap-4 p-4 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0 ${
                                                product.selling_price &&
                                                product.selling_price > 0
                                                    ? "cursor-pointer"
                                                    : "cursor-not-allowed opacity-50"
                                            }`}
                                        >
                                            <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                                                {product.image_path ? (
                                                    <img
                                                        src={product.image_path}
                                                        alt={
                                                            product.product_name
                                                        }
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-2xl">
                                                        📦
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-gray-900">
                                                    {product.product_name}
                                                </h4>
                                                {product.product_code && (
                                                    <p className="text-sm text-blue-600">
                                                        Kodi:{" "}
                                                        {product.product_code}
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-4 mt-2">
                                                    <span className="text-sm text-gray-600">
                                                        Narx:{" "}
                                                        <span className="font-semibold text-green-600">
                                                            {
                                                                product.selling_price
                                                            }{" "}
                                                            $
                                                        </span>
                                                    </span>
                                                    <span className="text-sm text-gray-600">
                                                        Qolgan:{" "}
                                                        <span className="font-semibold">
                                                            {
                                                                product.total_amount
                                                            }{" "}
                                                            dona
                                                        </span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {searchKeyword.trim() &&
                                !isLoadingProducts &&
                                products.length === 0 && (
                                    <div className="mt-4 text-center py-8 text-gray-500">
                                        Mahsulot topilmadi
                                    </div>
                                )}
                        </div>

                        {/* Cart */}
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <MdShoppingCart className="text-blue-600" />
                                    Karzina
                                </h3>
                                {cart.length > 0 && (
                                    <button
                                        onClick={clearCart}
                                        className="text-red-500 hover:text-red-700 text-sm"
                                    >
                                        Tozalash
                                    </button>
                                )}
                            </div>

                            {cart.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <MdShoppingCart className="text-4xl mx-auto mb-2 text-gray-300" />
                                    <p>Karzina bo'sh</p>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {cart.map((item) => (
                                        <div
                                            key={item.product_id}
                                            className="bg-gray-50 rounded-lg p-4 flex items-center gap-4"
                                        >
                                            <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                                                {item.image_path ? (
                                                    <img
                                                        src={item.image_path}
                                                        alt={item.product_name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-2xl">
                                                        📦
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold text-gray-900 line-clamp-1">
                                                    {item.product_name}
                                                </h4>
                                                <div className="flex items-center gap-4 mt-1">
                                                    <span className="text-sm text-gray-600">
                                                        Narx:{" "}
                                                        <span className="font-semibold text-green-600">
                                                            {item.selling_price}{" "}
                                                            $
                                                        </span>
                                                    </span>
                                                    <span className="text-sm text-gray-600">
                                                        Jami:{" "}
                                                        <span className="font-semibold text-blue-600">
                                                            {item.total} $
                                                        </span>
                                                    </span>
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
                                            <button
                                                onClick={() =>
                                                    removeFromCart(
                                                        item.product_id
                                                    )
                                                }
                                                className="text-red-500 hover:text-red-700 p-2"
                                            >
                                                <MdDelete className="text-lg" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right side - Client Info and Summary (1/3) */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Client Info */}
                        <div className="bg-white border border-gray-200 rounded-lg p-4 sticky top-4">
                            <h3 className="text-lg font-semibold mb-4">
                                Mijoz ma'lumotlari
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Mijoz nomi *
                                    </label>
                                    <Input
                                        type="text"
                                        value={clientName}
                                        onChange={(e) =>
                                            setClientName(e.target.value)
                                        }
                                        placeholder="Mijoz nomini kiriting"
                                        className="w-full"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Telefon raqami *
                                    </label>
                                    <Input
                                        type="text"
                                        value={clientPhone}
                                        onChange={(e) =>
                                            setClientPhone(e.target.value)
                                        }
                                        placeholder="+998901234567"
                                        className="w-full"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Mashina raqami (ixtiyoriy)
                                    </label>
                                    <Input
                                        type="text"
                                        value={clientCarNumber}
                                        onChange={(e) =>
                                            setClientCarNumber(e.target.value)
                                        }
                                        placeholder="80|A777AB"
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="bg-white border border-gray-200 rounded-lg p-4 sticky top-4">
                            <h3 className="text-lg font-semibold mb-4">
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
                                disabled={
                                    isSubmitting ||
                                    !clientName.trim() ||
                                    !clientPhone.trim() ||
                                    cart.length === 0
                                }
                                className={`w-full px-4 py-3 text-white rounded-md transition-colors ${
                                    isSubmitting ||
                                    !clientName.trim() ||
                                    !clientPhone.trim() ||
                                    cart.length === 0
                                        ? "bg-gray-400 cursor-not-allowed"
                                        : "bg-blue-600 hover:bg-blue-700"
                                }`}
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Yaratilmoqda...
                                    </div>
                                ) : (
                                    "Yaratish"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateDailyDebtPage;
