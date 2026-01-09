import React, { useState, useEffect } from "react";
import EditProductModal from "./EditProductModal";
import {
    UpdateProductPrice,
    GetDataSimple,
    PostDataTokenJson,
} from "../../service/data";
import { formatNumber } from "../../utils/numberFormat";
import { formatDate } from "../../utils/dateFormat";
import { Modal } from "../../components/ui/modal";
import { MdOutlineImageNotSupported } from "react-icons/md";
import { toast } from "react-hot-toast";

interface Product {
    product_id: number;
    product_name: string;
    total_amount: number;
    last_receipt_price: number;
    selling_price: number;
    barcode: number;
    product_code: string;
    category_name?: string;
    description?: string;
    image_id?: number;
    created_at?: string;
    updated_at?: string;
    receipt_price_uzs: string;
    selling_price_uzs: string;
    image_path: string;
}

interface TableProductProps {
    products: Product[];
    changeStatus: () => void;
}

const TableProduct: React.FC<TableProductProps> = ({
    products,
    changeStatus,
}) => {
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(
        null
    );

    const [imageModalOpen, setImageModalOpen] = useState(false);
    const [selectedImageUrl, setSelectedImageUrl] = useState<string>("");
    const [editingProductId, setEditingProductId] = useState<number | null>(
        null
    );
    const [editingQuantityProductId, setEditingQuantityProductId] = useState<
        number | null
    >(null);
    const [priceInputValue, setPriceInputValue] = useState<string>("");
    const [quantityInputValue, setQuantityInputValue] = useState<string>("");
    const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);
    const [isUpdatingQuantity, setIsUpdatingQuantity] = useState(false);
    const [dollarRate, setDollarRate] = useState<number>(0);
    const [isLoadingRate, setIsLoadingRate] = useState<boolean>(false);

    // Fetch dollar rate from API
    const fetchDollarRate = async () => {
        setIsLoadingRate(true);
        try {
            const response: any = await GetDataSimple("api/arrival/dollar");
            const rate = response?.dollar_rate || 0;
            setDollarRate(rate);
        } catch (error) {
            console.error("Error fetching dollar rate:", error);
            // Fallback rate if API fails
            setDollarRate(12500);
        } finally {
            setIsLoadingRate(false);
        }
    };

    // Fetch dollar rate on component mount
    useEffect(() => {
        fetchDollarRate();
    }, []);

    // Convert USD to UZS using current exchange rate
    const convertUsdToUzs = (usdAmount: number): number => {
        if (dollarRate > 0 && usdAmount > 0) {
            return Math.round(usdAmount * dollarRate);
        }
        return 0;
    };

    const handleEdit = (product: Product) => {
        setSelectedProduct(product);
        setEditModalOpen(true);
    };

    const handleImageClick = (imageUrl: string) => {
        setSelectedImageUrl(imageUrl);
        setImageModalOpen(true);
    };

    const handleCloseImageModal = () => {
        setImageModalOpen(false);
        setSelectedImageUrl("");
    };

    const handleBarcodeClick = (product: Product) => {
        // Modal ochmasdan to'g'ridan-to'g'ri print qilish
        const printBarcode = () => {
            // Yangi oynada barcode sahifasini yaratish
            const printWindow = window.open("", "_blank");
            if (printWindow) {
                printWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Barcode Print</title>
                        <style>
                            @page {
                                size: 40mm 30mm;
                                margin: 0;
                            }
                            body {
                                margin: 0;
                                padding: 0;
                                width: 40mm;
                                height: 30mm;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-family: Arial, sans-serif;
                            }
                            .barcode-container {
                                width: 100%;
                                height: 100%;
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                justify-content: center;
                                text-align: center;
                            }
                            .barcode-svg {
                                max-width: 100%;
                                height: auto;
                                max-height: 25mm;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="barcode-container">
                            <svg class="barcode-svg" id="barcode"></svg>
                        </div>
                        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
                        <script>
                            JsBarcode("#barcode", "${product.barcode}", {
                                width: 2.5,
                                height: 80,
                                displayValue: true,
                                fontSize: 24,
                                margin: 5,
                                format: "CODE128"
                            });

                            // Avtomatik print
                            window.onload = function() {
                                setTimeout(() => {
                                    window.print();
                                    window.onafterprint = function() {
                                        window.close();
                                    };
                                }, 500);
                            };
                        </script>
                    </body>
                    </html>
                `);
                printWindow.document.close();
            }
        };

        printBarcode();
    };

    const handleEditPrice = (product: Product) => {
        setEditingProductId(product.product_id);
        setPriceInputValue(product.selling_price.toString());
    };

    const handleEditQuantity = (product: Product) => {
        setEditingQuantityProductId(product.product_id);
        setQuantityInputValue(product.total_amount.toString());
    };

    const handleCancelEditPrice = () => {
        setEditingProductId(null);
        setPriceInputValue("");
    };

    const handleCancelEditQuantity = () => {
        setEditingQuantityProductId(null);
        setQuantityInputValue("");
    };

    const handleSavePrice = async () => {
        if (!editingProductId || !priceInputValue) return;

        const newPrice = parseFloat(priceInputValue);
        if (isNaN(newPrice) || newPrice < 0) {
            toast.error("Iltimos, to'g'ri narx kiriting");
            return;
        }

        setIsUpdatingPrice(true);
        try {
            await UpdateProductPrice(editingProductId, newPrice);
            // Update the product in the local state
            changeStatus(); // This will refresh the products list
            handleCancelEditPrice();
            toast.success("Mahsulot narxi muvaffaqiyatli o'zgartirildi!");
        } catch (error: any) {
            console.error(error.response.data.error);
            toast.error(error.response.data.error);
        } finally {
            setIsUpdatingPrice(false);
        }
    };

    const handleSaveQuantity = async () => {
        if (!editingQuantityProductId || !quantityInputValue) return;

        const newAmount = parseInt(quantityInputValue, 10);
        if (isNaN(newAmount) || newAmount < 0) {
            toast.error("Iltimos, to'g'ri miqdor kiriting");
            return;
        }

        setIsUpdatingQuantity(true);
        try {
            await PostDataTokenJson("api/products/update/amount", {
                product_id: editingQuantityProductId,
                amount: newAmount,
            });
            changeStatus();
            handleCancelEditQuantity();
            toast.success("Mahsulot miqdori muvaffaqiyatli o'zgartirildi!");
        } catch (error: any) {
            toast.error(
                error?.response?.data?.error ||
                    "Mahsulot miqdorini o'zgartirishda xatolik"
            );
        } finally {
            setIsUpdatingQuantity(false);
        }
    };

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3">
                                ID
                            </th>
                            <th scope="col" className="px-6 py-3">
                                Rasm
                            </th>
                            <th scope="col" className="px-6 py-3">
                                Mahsulot nomi
                            </th>
                            <th scope="col" className="px-6 py-3">
                                Mahsulot kodi
                            </th>
                            <th scope="col" className="px-6 py-3">
                                Kategoriya
                            </th>
                            <th scope="col" className="px-6 py-3">
                                Miqdor
                            </th>
                            <th scope="col" className="px-6 py-3 w-[130px]">
                                Kirim narxi
                            </th>
                            <th scope="col" className="px-6 py-3">
                                <div className="flex items-center gap-2">
                                    <span>
                                        Sotish narxi
                                        {dollarRate > 0 && (
                                            <span className="text-xs text-gray-500 ml-1">
                                                (1$ = {formatNumber(dollarRate)}
                                                )
                                            </span>
                                        )}
                                    </span>
                                    <button
                                        onClick={fetchDollarRate}
                                        disabled={isLoadingRate}
                                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 disabled:opacity-50"
                                        title="Kursni yangilash"
                                    >
                                        {isLoadingRate ? (
                                            <svg
                                                className="w-4 h-4 animate-spin"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle
                                                    className="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                ></circle>
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                ></path>
                                            </svg>
                                        ) : (
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
                                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                                />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </th>
                            <th scope="col" className="px-6 py-3">
                                Yaratilgan sana
                            </th>
                            <th scope="col" className="px-6 py-3">
                                Amallar
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={9}
                                    className="px-6 py-4 text-center text-gray-500"
                                >
                                    Mahsulotlar topilmadi
                                </td>
                            </tr>
                        ) : (
                            products.map((product, index) => (
                                <tr
                                    key={product.product_id}
                                    className={` ${
                                        product.total_amount < 2 &&
                                        " text-red-500"
                                    } border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600`}
                                >
                                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                        {index + 1}
                                    </td>
                                    <td className="px-6 py-4">
                                        {product.image_id ? (
                                            <div className="relative w-10 h-10">
                                                <img
                                                    src={product.image_path}
                                                    alt={
                                                        product.product_name ||
                                                        ""
                                                    }
                                                    className="w-10 h-10 rounded object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                                    onClick={() => {
                                                        handleImageClick(
                                                            product.image_path
                                                        );
                                                    }}
                                                    onError={(e) => {
                                                        e.currentTarget.style.display =
                                                            "none";
                                                    }}
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                                                <span className="text-gray-400 text-xs">
                                                    <MdOutlineImageNotSupported
                                                        size={25}
                                                    />
                                                </span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {product.product_name}
                                    </td>
                                    <td className="px-6 py-4">
                                        {product.product_code}
                                    </td>
                                    <td className="px-6 py-4">
                                        {product.category_name || "-"}
                                    </td>
                                    <td className="px-6 py-4">
                                        {editingQuantityProductId ===
                                        product.product_id ? (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={quantityInputValue}
                                                    onChange={(e) => {
                                                        const value =
                                                            e.target.value.replace(
                                                                /\s/g,
                                                                ""
                                                            );
                                                        setQuantityInputValue(
                                                            value
                                                        );
                                                    }}
                                                    className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Miqdor"
                                                />
                                                <button
                                                    onClick={handleSaveQuantity}
                                                    disabled={
                                                        isUpdatingQuantity
                                                    }
                                                    className="text-green-600 hover:text-green-800 disabled:opacity-50"
                                                    title="Saqlash"
                                                >
                                                    {isUpdatingQuantity ? (
                                                        <svg
                                                            className="w-4 h-4 animate-spin"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <circle
                                                                className="opacity-25"
                                                                cx="12"
                                                                cy="12"
                                                                r="10"
                                                                stroke="currentColor"
                                                                strokeWidth="4"
                                                            ></circle>
                                                            <path
                                                                className="opacity-75"
                                                                fill="currentColor"
                                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                            ></path>
                                                        </svg>
                                                    ) : (
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
                                                                d="M5 13l4 4L19 7"
                                                            />
                                                        </svg>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={
                                                        handleCancelEditQuantity
                                                    }
                                                    className="text-red-600 hover:text-red-800"
                                                    title="Bekor qilish"
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
                                                            d="M6 18L18 6M6 6l12 12"
                                                        />
                                                    </svg>
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <span>
                                                    {product.total_amount}
                                                </span>
                                                <button
                                                    onClick={() =>
                                                        handleEditQuantity(
                                                            product
                                                        )
                                                    }
                                                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                                                    title="Miqdorni tahrirlash"
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
                                                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                        />
                                                    </svg>
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span>
                                                {product.last_receipt_price} $
                                            </span>
                                            <span className="text-green-600 font-medium">
                                                {product.receipt_price_uzs
                                                    ? formatNumber(
                                                          parseFloat(
                                                              product.receipt_price_uzs
                                                          )
                                                      )
                                                    : "-"}{" "}
                                                сум
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {editingProductId ===
                                        product.product_id ? (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={priceInputValue}
                                                    onChange={(e) => {
                                                        const value =
                                                            e.target.value.replace(
                                                                /\s/g,
                                                                ""
                                                            );
                                                        setPriceInputValue(
                                                            value
                                                        );
                                                    }}
                                                    onBlur={(e) => {
                                                        const value =
                                                            e.target.value.replace(
                                                                /\s/g,
                                                                ""
                                                            );
                                                        const numValue =
                                                            parseFloat(value);
                                                        if (!isNaN(numValue)) {
                                                            setPriceInputValue(
                                                                numValue.toString()
                                                            );
                                                        }
                                                    }}
                                                    className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Narx"
                                                />
                                                <span className="text-sm text-gray-500">
                                                    so'm
                                                </span>
                                                <button
                                                    onClick={handleSavePrice}
                                                    disabled={isUpdatingPrice}
                                                    className="text-green-600 hover:text-green-800 disabled:opacity-50"
                                                    title="Saqlash"
                                                >
                                                    {isUpdatingPrice ? (
                                                        <svg
                                                            className="w-4 h-4 animate-spin"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <circle
                                                                className="opacity-25"
                                                                cx="12"
                                                                cy="12"
                                                                r="10"
                                                                stroke="currentColor"
                                                                strokeWidth="4"
                                                            ></circle>
                                                            <path
                                                                className="opacity-75"
                                                                fill="currentColor"
                                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                            ></path>
                                                        </svg>
                                                    ) : (
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
                                                                d="M5 13l4 4L19 7"
                                                            />
                                                        </svg>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={
                                                        handleCancelEditPrice
                                                    }
                                                    className="text-red-600 hover:text-red-800"
                                                    title="Bekor qilish"
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
                                                            d="M6 18L18 6M6 6l12 12"
                                                        />
                                                    </svg>
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-start gap-2">
                                                <div className="flex flex-col">
                                                    <span>
                                                        {product.selling_price}{" "}
                                                        $
                                                    </span>
                                                    {dollarRate > 0 ? (
                                                        <span className="text-green-600 font-medium">
                                                            {formatNumber(
                                                                convertUsdToUzs(
                                                                    product.selling_price
                                                                )
                                                            )}{" "}
                                                            сум
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400 text-sm">
                                                            Kurs yuklanmoqda...
                                                        </span>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() =>
                                                        handleEditPrice(product)
                                                    }
                                                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                                                    title="Narxni tahrirlash"
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
                                                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                        />
                                                    </svg>
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {formatDate(product.created_at || "")}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() =>
                                                    handleEdit(product)
                                                }
                                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                                                title="Tahrirlash"
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
                                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                    />
                                                </svg>
                                            </button>
                                            {product.barcode && (
                                                <button
                                                    onClick={() =>
                                                        handleBarcodeClick(
                                                            product
                                                        )
                                                    }
                                                    className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
                                                    title="Shtrix-kod ko'rish"
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
                                                            d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                                                        />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {editModalOpen && selectedProduct && (
                <EditProductModal
                    isOpen={editModalOpen}
                    onClose={() => setEditModalOpen(false)}
                    product={selectedProduct}
                    changeStatus={changeStatus}
                />
            )}

            {/* Rasm modal */}
            <Modal
                isOpen={imageModalOpen}
                onClose={handleCloseImageModal}
                className="w-full h-full max-w-none max-h-none"
            >
                <div className="w-full h-full flex flex-col p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                            Mahsulot rasmi
                        </h3>
                        <button
                            onClick={handleCloseImageModal}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2"
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
                    <div className="flex-1 flex justify-center items-center overflow-hidden p-4">
                        <img
                            src={selectedImageUrl}
                            alt="Mahsulot rasmi"
                            className="max-w-[90%] max-h-[80vh] w-auto h-auto rounded-lg shadow-2xl object-contain"
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default TableProduct;
