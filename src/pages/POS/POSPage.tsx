import React, { useState, useEffect, useRef } from "react";
import {
    PostSimple,
    GetDataSimpleBlob,
    PostDataTokenJson,
    GetDataSimple,
} from "../../service/data";
import { toast } from "react-hot-toast";
import { formatNumber } from "../../utils/numberFormat";
import { setExchangeRate } from "../../utils/currencyConverter";
import {
    convertUsdToUzs,
    convertUzsToUsd,
    formatUsd,
} from "../../utils/currencyConverter";
import { formatDate } from "../../utils/dateFormat";
import {
    MdShoppingCart,
    MdAdd,
    MdRemove,
    MdDelete,
    MdLogout,
    MdHistory,
} from "react-icons/md";
import Select from "../../components/form/Select";
import { Link } from "react-router";
import { Modal } from "../../components/ui/modal";
import DollarRateModal from "../../components/modals/DollarRateModal";

interface Product {
    product_id: number;
    product_name: string;
    product_code?: string;
    total_amount: number;
    last_receipt_price: number;
    selling_price: number;
    barcode?: number;
    description?: string;
    image_id?: number;
    image_path?: string;
    created_at: string;
    cash_type_text?: string;
    cash_type?: number;
}

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
    image_path?: string;
    cash_type_text?: string;
    cash_type?: number;
}

interface Client {
    client_id: number;
    client_name: string;
    phone?: string;
    address?: string;
    debt?: number;
}

const POSPage: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>(() => {
        // localStorage dan karzina ma'lumotlarini yuklash
        const savedCart = localStorage.getItem("pos_cart");
        return savedCart ? JSON.parse(savedCart) : [];
    });
    const [searchKeyword, setSearchKeyword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [barcodeInput, setBarcodeInput] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isSearching, setIsSearching] = useState(false);
    const [imageUrls, setImageUrls] = useState<{ [key: number]: string }>({});
    const barcodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const [isDebt, setIsDebt] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [clients, setClients] = useState<Client[]>([]);
    const [comments, setComments] = useState("");
    const [discount, setDiscount] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [dollarRate, setDollarRate] = useState<number>(0);
    const [dollarRateModalOpen, setDollarRateModalOpen] = useState(false);

    // Image modal state
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [selectedImageUrl, setSelectedImageUrl] = useState<string>("");
    const [selectedProductName, setSelectedProductName] = useState<string>("");

    // Fetch dollar rate function
    const syncRate = async () => {
        try {
            const res: any = await GetDataSimple("api/arrival/dollar");
            const rate = res?.dollar_rate || 0;
            setDollarRate(rate);
            if (rate > 0) setExchangeRate(rate);
        } catch (e) {
            // ignore
        }
    };

    // Ensure global exchange rate is up-to-date on POS mount
    useEffect(() => {
        syncRate();
    }, []);

    // Karzina o'zgargan har safar localStorage ga saqlash
    useEffect(() => {
        localStorage.setItem("pos_cart", JSON.stringify(cart));
    }, [cart]);

    // Rasm URL larini yuklash
    useEffect(() => {
        const loadImages = async () => {
            const newImageUrls: { [key: number]: string } = {};

            for (const product of products) {
                if (product.image_id && !imageUrls[product.image_id]) {
                    try {
                        const response = await GetDataSimpleBlob(
                            `api/products/image/${product.image_id}`
                        );
                        newImageUrls[product.image_id] =
                            URL.createObjectURL(response);
                    } catch (error) {
                        console.error(
                            `Rasm yuklashda xatolik (ID: ${product.image_id}):`,
                            error
                        );
                    }
                }
            }

            if (Object.keys(newImageUrls).length > 0) {
                setImageUrls((prev) => ({ ...prev, ...newImageUrls }));
            }
        };

        loadImages();
    }, [products, imageUrls]);

    // Barcode scanner funksiyasi
    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            // Enter tugmasi bosilganda barcode ni qidirish
            if (event.key === "Enter" && barcodeInput.trim()) {
                handleBarcodeSearch(barcodeInput.trim());
                setBarcodeInput("");
                return;
            }

            // Har bir harf/raqam kiritilganda barcode input ga qo'shish
            if (event.key.length === 1) {
                setBarcodeInput((prev) => prev + event.key);

                // 100ms dan keyin barcode input ni tozalash
                if (barcodeTimeoutRef.current) {
                    clearTimeout(barcodeTimeoutRef.current);
                }

                barcodeTimeoutRef.current = setTimeout(() => {
                    setBarcodeInput("");
                }, 100);
            }
        };

        document.addEventListener("keydown", handleKeyPress);

        return () => {
            document.removeEventListener("keydown", handleKeyPress);
            if (barcodeTimeoutRef.current) {
                clearTimeout(barcodeTimeoutRef.current);
            }
        };
    }, [barcodeInput]);

    // Faqat search qilganda mahsulotlarni yuklash
    useEffect(() => {
        if (isSearching && searchKeyword.trim()) {
            handleSearch();
        }
    }, [page, isSearching, searchKeyword]);

    const handleSearch = async () => {
        if (!searchKeyword.trim() || searchKeyword.trim().length < 3) {
            setIsSearching(false);
            setPage(1);
            setProducts([]);
            return;
        }

        setIsLoading(true);
        try {
            const response = await PostSimple(
                `api/products/search?keyword=${encodeURIComponent(
                    searchKeyword
                )}`
            );
            console.log("=== SEARCH RESPONSE ===");
            console.log("Full response:", response);
            console.log("Response data:", response?.data);
            console.log("Response result:", response?.data?.result);
            console.log("Products count:", response?.data?.result?.length);
            if (response?.data?.result) {
                setIsLoading(false);
                console.log("Search response:", response.data.result);
                setProducts(response.data.result);
                setTotalPages(1);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Qidiruvda xatolik");
        }
    };

    const handleSearchChange = (value: string) => {
        setSearchKeyword(value);
        if (value.trim().length > 3) {
            setIsSearching(true);
            setPage(1);
        } else if (value.trim().length === 0) {
            setIsSearching(false);
            setPage(1);
            setProducts([]);
        } else if (value.trim().length < 3) {
            setIsSearching(false);
            setPage(1);
            setProducts([]);
        }
    };

    const handleBarcodeSearch = async (barcode: string) => {
        try {
            const response = await PostSimple(
                `api/products/search?keyword=${encodeURIComponent(barcode)}`
            );
            console.log("=== BARCODE SEARCH RESPONSE ===");
            console.log("Barcode:", barcode);
            console.log("Full response:", response);
            console.log("Response data:", response?.data);
            console.log("Response result:", response?.data?.result);
            console.log("Products count:", response?.data?.result?.length);
            if (response?.data?.result && response.data.result.length > 0) {
                const products = response.data.result;
                setProducts(products);
                setSearchKeyword(barcode);
                setIsSearching(true);
                setTotalPages(1);
                toast.success(`${products.length} ta mahsulot topildi`);
            } else {
                toast.error("Mahsulot topilmadi");
            }
        } catch (error) {
            console.error("Barcode qidiruvda xatolik:", error);
            toast.error("Mahsulot topilmadi");
        }
    };

    const addToCart = (product: Product) => {
        // Agar selling_price null yoki 0 bo'lsa, karzinaga qo'shmaslik
        if (!product.selling_price || product.selling_price <= 0) {
            toast.error("Bu mahsulotning narxi belgilanmagan");
            return;
        }

        // Agar qolgan soni 1 dan kam bo'lsa, karzinaga qo'shmaslik
        if (product.total_amount < 1) {
            toast.error("Bu mahsulotdan skladda qolmagan");
            return;
        }

        setCart((prevCart) => {
            const existingItem = prevCart.find(
                (item) => item.product_id === product.product_id
            );

            if (existingItem) {
                // Agar karzinada qolgan sonidan ko'p qo'shishga harakat qilinsa
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
                        last_receipt_price: product.last_receipt_price,
                        total_amount: product.total_amount,
                        quantity: 1,
                        total: Number(product.selling_price),
                        image_id: product.image_id,
                        image_path: product.image_path,
                        cash_type_text: product.cash_type_text,
                        cash_type: product.cash_type,
                    },
                ];
            }
        });
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
        setDiscount("");
        setComments("");
        localStorage.removeItem("pos_cart");
        toast.success("Karzina tozalandi");
    };

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = "/signin";
    };

    const getTotalAmount = () => {
        return cart.reduce((total, item) => total + Number(item.total), 0);
    };

    console.log(getTotalAmount());

    const getTotalItems = () => {
        return cart.reduce((total, item) => total + item.quantity, 0);
    };

    // Mijozlarni yuklash
    const loadClients = async () => {
        try {
            const response = await GetDataSimple(
                "api/clients/list?page=1&limit=100"
            );
            if (response?.result) {
                setClients(response?.result);
            }
        } catch (error) {
            console.error("Mijozlarni yuklashda xatolik:", error);
            toast.error("Mijozlarni yuklashda xatolik");
        }
    };

    // Mijozlarni qidirish
    const searchClients = async (keyword: string) => {
        if (!keyword.trim()) {
            loadClients(); // Bo'sh qidiruvda barcha mijozlarni yuklash
            return;
        }

        try {
            const response = await PostSimple(
                `api/clients/search?keyword=${encodeURIComponent(keyword)}`
            );
            if (response?.data?.result) {
                setClients(response.data.result);
            }
        } catch (error) {
            console.error("Mijozlarni qidirishda xatolik:", error);
            toast.error("Mijozlarni qidirishda xatolik");
        }
    };

    // Qarz checkbox o'zgarganida
    const handleDebtChange = (checked: boolean) => {
        setIsDebt(checked);
        if (checked) {
            loadClients();
        } else {
            setSelectedClient(null);
        }
    };

    // Sotishni yakunlash
    const handleSubmitSale = async () => {
        if (isDebt && !selectedClient) {
            toast.error("Qarzga sotish uchun mijozni tanlang");
            return;
        }

        setIsSubmitting(true);

        try {
            const payload: any = {
                is_debt: isDebt ? 1 : 0,
                items: cart.map((item) => ({
                    product_id: item.product_id,
                    amount: item.quantity,
                })),
            };

            if (comments.trim()) {
                payload.comments = comments.trim();
            }

            if (discount.trim()) {
                payload.discount = parseFloat(discount);
            }

            if (isDebt && selectedClient) {
                payload.client_id = selectedClient.client_id;
            }

            const response = await PostDataTokenJson(
                "api/sale/create",
                payload
            );

            if (response?.status === 200) {
                toast.success("Sotish muvaffaqiyatli yakunlandi!");

                // Sotish ma'lumotlarini saqlash
                const saleInfo = {
                    cart: [...cart],
                    isDebt,
                    selectedClient,
                    comments,
                    discount,
                    totalAmount: getTotalAmount(),
                    totalItems: getTotalItems(),
                    saleId: response?.data?.sale_id || Date.now(),
                    timestamp: formatDate(new Date().toISOString()),
                };

                setCart([]);
                localStorage.removeItem("pos_cart");
                resetCheckoutForm();

                // Check sahifasini yangi vkladkada ochish
                const checkUrl = `/#/check?saleData=${encodeURIComponent(
                    JSON.stringify(saleInfo)
                )}`;
                window.open(checkUrl, "_blank");
            } else {
                toast.error("Sotishda xatolik");
            }
        } catch (error: any) {
            console.error("Sotishda xatolik:", error);
            const errorMessage =
                error.response?.data?.error || "Sotishda xatolik";
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Checkout formini tozalash
    const resetCheckoutForm = () => {
        setIsDebt(false);
        setSelectedClient(null);

        setComments("");
        setDiscount("");
    };

    // Chegirma bilan umumiy summani hisoblash
    const getTotalWithDiscount = () => {
        const total = getTotalAmount();
        const discountAmount = parseFloat(discount) || 0;
        return Math.max(0, convertUsdToUzs(total) - discountAmount);
    };

    // Image modal functions
    const handleImageClick = (imageUrl: string, productName: string) => {
        setSelectedImageUrl(imageUrl);
        setSelectedProductName(productName);
        setIsImageModalOpen(true);
    };

    const handleCloseImageModal = () => {
        setIsImageModalOpen(false);
        setSelectedImageUrl("");
        setSelectedProductName("");
    };

    return (
        <div className="h-screen w-screen bg-gray-50 flex flex-col fixed inset-0 z-50">
            {/* Header */}
            <div className="h-[vh] py-2 px-6 bg-white border-b border-gray-200 flex-shrink-0">
                <div className="flex h-full justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Do'kondagi mahsulotlar
                    </h1>
                    <div className="flex gap-2 items-center">
                        {/* Dollar Rate Display */}
                        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center gap-1">
                                <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm">
                                    $
                                </span>
                                <span className="text-blue-700 dark:text-blue-300 font-medium text-sm">
                                    {formatNumber(dollarRate)}
                                </span>
                            </div>
                            <button
                                onClick={() => setDollarRateModalOpen(true)}
                                className="p-1 hover:bg-green-100 dark:hover:bg-green-800/30 rounded transition-colors"
                                title="Kursni yangilash"
                            >
                                <svg
                                    className="w-3 h-3 text-blue-600 dark:text-blue-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                    />
                                </svg>
                            </button>
                        </div>
                        <Link
                            to={"/sales-history"}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Sotuv tarixi"
                        >
                            <MdHistory className="text-2xl" />
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Chiqish"
                        >
                            <MdLogout className="text-2xl" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content - Two Column Layout */}
            <div className="relative mt-4 px-6">
                <input
                    type="text"
                    placeholder="Mahsulot qidirish..."
                    value={searchKeyword}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {searchKeyword && (
                    <button
                        onClick={() => {
                            setSearchKeyword("");
                            setIsSearching(false);
                            setPage(1);
                            setProducts([]);
                        }}
                        className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        ✕
                    </button>
                )}
            </div>
            <div className="flex-1 flex overflow-hidden">
                {/* Left Side - Search, Products and Cart (70%) */}
                <div className="w-[70%] px-6  overflow-y-auto">
                    {/* Mahsulotlar ro'yxati - dropdown ko'rinishida */}
                    {searchKeyword.trim() && products.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto mb-4">
                            {products.map((product) => (
                                <div
                                    key={product?.product_id}
                                    onClick={() => {
                                        addToCart(product);
                                        setSearchKeyword("");
                                        setProducts([]);
                                        setIsSearching(false);
                                    }}
                                    className={`flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                                        product?.selling_price &&
                                        product.selling_price > 0
                                            ? "cursor-pointer"
                                            : "cursor-not-allowed opacity-50"
                                    }`}
                                >
                                    {/* Rasm */}
                                    <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg flex items-center justify-center overflow-hidden shadow-sm flex-shrink-0">
                                        {product.image_path ? (
                                            <img
                                                src={product.image_path}
                                                alt={product.product_name || ""}
                                                className="w-full h-full object-cover rounded-lg"
                                                onError={(e) => {
                                                    e.currentTarget.style.display =
                                                        "none";
                                                    e.currentTarget.nextElementSibling?.classList.remove(
                                                        "hidden"
                                                    );
                                                }}
                                            />
                                        ) : null}
                                        <span
                                            className={`text-3xl ${
                                                product.image_path
                                                    ? "hidden"
                                                    : ""
                                            }`}
                                        >
                                            📦
                                        </span>
                                    </div>

                                    {/* Ma'lumotlar */}
                                    <div className="flex w-full justify-between items-center">
                                        <div className="ml-6 ">
                                            <h4 className="font-bold text-gray-900 text-lg line-clamp-1">
                                                {product?.product_name ||
                                                    "Nomsiz mahsulot"}
                                            </h4>

                                            {/* Product Code */}
                                            {product?.product_code && (
                                                <p className="text-md text-blue-600 font-semibold mb-1">
                                                    Kodi: {product.product_code}
                                                </p>
                                            )}

                                            {/* Barcode */}
                                            {product?.barcode && (
                                                <p className="text-md text-gray-700 mb-2">
                                                    Barcode: {product.barcode}
                                                </p>
                                            )}

                                            {/* Prices and Amount */}
                                        </div>
                                        <div className="space-y-1 ">
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
                                            <div className="flex items-center justify-between gap-3">
                                                <span className="text-sm text-gray-700 font-semibold">
                                                    Sotish narxi (so'm):
                                                </span>

                                                <p className="text-blue-600 text-md font-bold">
                                                    {formatNumber(
                                                        convertUsdToUzs(
                                                            product.selling_price
                                                        )
                                                    )}
                                                </p>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-700 font-semibold">
                                                    Oxirgi kirim narxi:
                                                </span>
                                                <div className="text-right">
                                                    <p className="text-md text-gray-800 font-semibold">
                                                        {product?.last_receipt_price
                                                            ? `${
                                                                  product.last_receipt_price
                                                              } ${
                                                                  product?.cash_type_text ||
                                                                  "$"
                                                              }`
                                                            : "N/A"}
                                                    </p>
                                                </div>
                                            </div>
                                            {product?.cash_type === 1 && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-700 font-semibold">
                                                        Oxirgi kirim narxi
                                                        (USD):
                                                    </span>
                                                    <div className="text-right">
                                                        <p className="text-xl text-gray-800 font-semibold">
                                                            {product?.last_receipt_price &&
                                                                product.last_receipt_price >
                                                                    0 && (
                                                                    <p className="text-sm text-green-600">
                                                                        ≈{" "}
                                                                        {formatUsd(
                                                                            convertUzsToUsd(
                                                                                product.last_receipt_price
                                                                            )
                                                                        )}
                                                                    </p>
                                                                )}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

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

                                    {/* Qo'shish tugmasi */}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Loading holati */}
                    {isLoading && (
                        <div className="flex justify-center items-center h-64">
                            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}

                    {/* Hech narsa topilmadi */}
                    {searchKeyword.trim() &&
                        !isLoading &&
                        products.length === 0 && (
                            <div className="text-center py-8">
                                <p className="text-gray-500">
                                    Mahsulotlar topilmadi
                                </p>
                                <p className="text-sm text-gray-400 mt-2">
                                    "{searchKeyword}" bo'yicha hech narsa
                                    topilmadi
                                </p>
                            </div>
                        )}

                    {/* Pagination - faqat search natijalari uchun */}
                    {isSearching && totalPages > 1 && (
                        <div className="flex justify-center mt-6">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(page - 1)}
                                    disabled={page === 1}
                                    className={`px-3 py-2 rounded-lg ${
                                        page === 1
                                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                            : "bg-white border border-gray-300 hover:bg-gray-50"
                                    }`}
                                >
                                    Oldingi
                                </button>

                                {Array.from(
                                    { length: totalPages },
                                    (_, i) => i + 1
                                ).map((pageNum) => (
                                    <button
                                        key={pageNum}
                                        onClick={() => setPage(pageNum)}
                                        className={`px-3 py-2 rounded-lg ${
                                            page === pageNum
                                                ? "bg-blue-600 text-white"
                                                : "bg-white border border-gray-300 hover:bg-gray-50"
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                ))}

                                <button
                                    onClick={() => setPage(page + 1)}
                                    disabled={page === totalPages}
                                    className={`px-3 py-2 rounded-lg ${
                                        page === totalPages
                                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                            : "bg-white border border-gray-300 hover:bg-gray-50"
                                    }`}
                                >
                                    Keyingi
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Karzina ro'yxati - chap tomonda */}
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
                            {cart.length === 0 ? (
                                <div className="text-center text-gray-500 mt-8">
                                    <MdShoppingCart className="text-4xl mx-auto mb-2 text-gray-300" />
                                    <p>Karzina bo'sh</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {cart.map((item) => (
                                        <div
                                            key={item.product_id}
                                            className="bg-gray-50 rounded-lg p-4 flex items-center gap-4"
                                        >
                                            {/* Rasm */}
                                            <div
                                                className="w-[100px] h-[100px] object-cover bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg flex items-center justify-center overflow-hidden shadow-sm flex-shrink-0 cursor-pointer hover:shadow-md transition-shadow"
                                                onClick={() => {
                                                    if (item.image_path) {
                                                        handleImageClick(
                                                            item.image_path,
                                                            item.product_name
                                                        );
                                                    }
                                                }}
                                            >
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

                                            {/* Mahsulot ma'lumotlari */}
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

                                                {/* Narx ma'lumotlari */}
                                                <div className=" space-y-1">
                                                    {/* Sotish narxi */}
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-gray-600">
                                                            Sotish narxi:
                                                        </span>
                                                        <div className="text-right">
                                                            <span className="font-semibold text-green-600">
                                                                {
                                                                    item.selling_price
                                                                }
                                                                ${"   "}
                                                                <span className=" font-semibold text-blue-600">
                                                                    (
                                                                    {item?.total ||
                                                                        0}
                                                                    $)
                                                                </span>
                                                            </span>
                                                            <p className="text-xs text-gray-500">
                                                                {formatNumber(
                                                                    convertUsdToUzs(
                                                                        item.selling_price
                                                                    )
                                                                )}
                                                                so'm (
                                                                {formatNumber(
                                                                    convertUsdToUzs(
                                                                        item?.total ||
                                                                            0
                                                                    )
                                                                )}
                                                                so'm)
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Olingan narx */}
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-600">
                                                            Olingan narx:
                                                        </span>
                                                        <div className="text-right">
                                                            <span className="font-semibold text-blue-600">
                                                                {
                                                                    item.last_receipt_price
                                                                }{" "}
                                                                {
                                                                    item.cash_type_text
                                                                }
                                                            </span>
                                                            {item.cash_type ===
                                                                1 && (
                                                                <p className="text-xs text-gray-500">
                                                                    ≈{" "}
                                                                    {formatUsd(
                                                                        convertUzsToUsd(
                                                                            item.last_receipt_price
                                                                        )
                                                                    )}{" "}
                                                                    $
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-center gap-1">
                                                <button
                                                    onClick={() =>
                                                        updateQuantity(
                                                            item?.product_id,
                                                            item?.quantity + 1
                                                        )
                                                    }
                                                    className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                                                >
                                                    <MdAdd className="text-sm" />
                                                </button>
                                                <span className="text-base font-medium w-8 text-center">
                                                    {item?.quantity}
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
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Side - Checkout Form (30%) */}
                <div className="w-[30%] px-6 py-4 overflow-y-auto bg-gray-50">
                    {/* Checkout Form */}
                    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-6">
                        {/* Karzina ma'lumotlari */}
                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <MdShoppingCart className="text-blue-600" />
                                Karzina ma'lumotlari
                            </h4>

                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span>Mahsulotlar:</span>
                                    <span className="font-semibold">
                                        {getTotalItems()}
                                    </span>
                                </div>

                                <div className="flex justify-between text-lg font-bold">
                                    <span>Jami:</span>
                                    <div className="text-right">
                                        <span className="text-blue-600">
                                            {getTotalAmount()} $
                                        </span>
                                        <p className="text-sm text-gray-500">
                                            ≈{" "}
                                            {formatNumber(
                                                convertUsdToUzs(
                                                    getTotalAmount()
                                                )
                                            )}{" "}
                                            so'm
                                        </p>
                                    </div>
                                </div>

                                {discount && parseFloat(discount) > 0 && (
                                    <>
                                        <div className="flex justify-between text-red-600">
                                            <span>Chegirma:</span>
                                            <div className="text-right">
                                                <span className="font-semibold">
                                                    -
                                                    {formatNumber(
                                                        parseFloat(discount)
                                                    )}{" "}
                                                    so'm
                                                </span>
                                                <p className="text-sm text-gray-500">
                                                    ≈ -
                                                    {formatUsd(
                                                        convertUzsToUsd(
                                                            parseFloat(discount)
                                                        )
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex justify-between text-green-600 border-t pt-2">
                                            <span className="font-bold">
                                                To'lanadigan:
                                            </span>
                                            <div className="text-right">
                                                <span className="font-bold text-lg">
                                                    {formatNumber(
                                                        getTotalWithDiscount()
                                                    )}{" "}
                                                    so'm
                                                </span>
                                                <p className="text-sm text-gray-500">
                                                    ≈{" "}
                                                    {formatUsd(
                                                        convertUzsToUsd(
                                                            getTotalWithDiscount()
                                                        )
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Checkout Form */}
                        <div className="space-y-4">
                            {/* Chegirma */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Chegirma (so'm) (ixtiyoriy)
                                </label>
                                <input
                                    type="number"
                                    value={discount}
                                    onChange={(e) =>
                                        setDiscount(e.target.value)
                                    }
                                    placeholder="Chegirma summasini kiriting"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            {/* Qarz checkbox */}
                            <div className="flex items-center space-x-3 bg-gray-50 rounded-lg p-3">
                                <input
                                    type="checkbox"
                                    id="isDebt"
                                    checked={isDebt}
                                    onChange={(e) =>
                                        handleDebtChange(e.target.checked)
                                    }
                                    className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                />
                                <label
                                    htmlFor="isDebt"
                                    className="text-sm font-medium text-gray-700 cursor-pointer"
                                >
                                    Qarzga sotish
                                </label>
                            </div>

                            {/* Qarz bo'lsa mijoz tanlash */}
                            {isDebt && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Mijozni tanlang *
                                    </label>
                                    <Select
                                        defaultValue={
                                            selectedClient?.client_id?.toString() ||
                                            ""
                                        }
                                        onChange={(value: string) => {
                                            const clientId = parseInt(value);
                                            const client = clients.find(
                                                (c) => c.client_id === clientId
                                            );
                                            setSelectedClient(client || null);
                                        }}
                                        options={clients.map((client) => ({
                                            value: client.client_id,
                                            label: `${client.client_name} ${
                                                client.phone
                                                    ? `(${client.phone})`
                                                    : ""
                                            } ${
                                                client.debt && client.debt > 0
                                                    ? `- Mavjud qarz: ${formatNumber(
                                                          client.debt
                                                      )} so'm`
                                                    : ""
                                            }`,
                                        }))}
                                        placeholder="Mijozni tanlang"
                                        searchable={true}
                                        onSearch={searchClients}
                                    />
                                </div>
                            )}

                            {/* Izoh */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Izoh (ixtiyoriy)
                                </label>
                                <input
                                    type="text"
                                    value={comments}
                                    onChange={(e) =>
                                        setComments(e.target.value)
                                    }
                                    placeholder="Sotish haqida izoh..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Sotishni yakunlash tugmalari */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={clearCart}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                                >
                                    Bekor qilish
                                </button>
                                <button
                                    onClick={handleSubmitSale}
                                    disabled={isSubmitting || cart.length === 0}
                                    className={`flex-1 px-4 py-2 text-white rounded-md transition-colors ${
                                        isSubmitting || cart.length === 0
                                            ? "bg-gray-400 cursor-not-allowed"
                                            : "bg-blue-600 hover:bg-blue-700"
                                    }`}
                                >
                                    {isSubmitting ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Yakunlanmoqda...
                                        </div>
                                    ) : (
                                        "Sotishni yakunlash"
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dollar Rate Modal */}
            <DollarRateModal
                isOpen={dollarRateModalOpen}
                onClose={() => setDollarRateModalOpen(false)}
                onSuccess={() => {
                    syncRate();
                    setDollarRateModalOpen(false);
                }}
                currentRate={dollarRate}
            />

            {/* Image Modal */}
            <Modal isOpen={isImageModalOpen} onClose={handleCloseImageModal}>
                <div className="p-4 w-full h-full max-w-[95vw] max-h-[95vh]">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold text-gray-900">
                            {selectedProductName}
                        </h3>
                        <button
                            onClick={handleCloseImageModal}
                            className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <svg
                                className="w-8 h-8"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>

                    <div className="flex justify-center items-center h-[calc(100%-80px)]">
                        <div className="w-full h-full overflow-hidden rounded-lg shadow-2xl bg-gray-50 flex items-center justify-center">
                            <img
                                src={selectedImageUrl}
                                alt={selectedProductName}
                                className="max-w-full max-h-full object-contain"
                                onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                    e.currentTarget.nextElementSibling?.classList.remove(
                                        "hidden"
                                    );
                                }}
                            />
                            <div className="hidden w-full h-full bg-gray-100 items-center justify-center">
                                <div className="text-center text-gray-500">
                                    <div className="text-8xl mb-6">📦</div>
                                    <p className="text-xl">Rasm yuklanmadi</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default POSPage;
