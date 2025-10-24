import { useState, useEffect, useMemo } from "react";
import { Modal } from "../../components/ui/modal";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Button from "../../components/ui/button/Button";
import Select from "../../components/form/Select";
import {
    PostDataTokenJson,
    GetDataSimple,
    PostSimple,
} from "../../service/data";
import toast from "react-hot-toast";
import { formatNumber } from "../../utils/numberFormat";

interface Product {
    product_id: number;
    product_name: string;
    barcode?: string | number;
    product_code?: string;
    image_path: string;
}

interface ArrivalItem {
    product_id: number;
    amount: number;
    receipt_price: number | string;
    selling_price: number | string;
}

interface AddArrivalModalProps {
    isOpen: boolean;
    onClose: () => void;
    changeStatus: () => void;
    setResponse: (response: string) => void;
}

export default function AddArrivalModal({
    isOpen,
    onClose,
    changeStatus,
    setResponse,
}: AddArrivalModalProps) {
    // Removed these from UI; we'll always send cash_type=0
    const cashType: 0 = 0;
    const [dollarRate, setDollarRate] = useState<number>(0);
    const [items, setItems] = useState<ArrivalItem[]>([
        { product_id: 0, amount: 0, receipt_price: 0, selling_price: 0 },
    ]);
    const [searchingProducts, setSearchingProducts] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    // Barcode scan buffer
    const [barcodeBuffer, setBarcodeBuffer] = useState("");
    let barcodeTimeout: number | undefined;

    const hasValidItems = items.some((item) => {
        const receipt =
            typeof item.receipt_price === "number"
                ? item.receipt_price
                : parseFloat(item.receipt_price || "0");
        const selling =
            typeof item.selling_price === "number"
                ? item.selling_price
                : parseFloat(item.selling_price || "0");
        return (
            item.product_id > 0 && item.amount > 0 && receipt > 0 && selling > 0
        );
    });

    useEffect(() => {
        if (isOpen) {
            fetchProducts();
            fetchDollarRate();
        }
    }, [isOpen]);

    const fetchProducts = async () => {
        try {
            const res = await GetDataSimple(
                "api/products/list?page=1&limit=100"
            );
            setProducts(res?.result || []);
        } catch (error) {
            console.error("Mahsulotlarni yuklashda xatolik:", error);
            toast.error("Mahsulotlarni yuklashda xatolik");
        }
    };

    const fetchDollarRate = async () => {
        try {
            const res = await GetDataSimple("api/arrival/dollar");
            setDollarRate(res?.dollar_rate || 12500);
        } catch (error) {
            console.error("Dollar kursini yuklashda xatolik:", error);
            toast.error("Dollar kursini yuklashda xatolik");
        }
    };

    // Handle fast barcode scan from hardware scanner (global keydown)
    useEffect(() => {
        if (!isOpen) return;

        const onKeyDown = (e: KeyboardEvent) => {
            const active = document.activeElement as HTMLElement | null;
            const isTyping = !!(
                active &&
                (active.tagName === "INPUT" ||
                    active.tagName === "TEXTAREA" ||
                    active.getAttribute("contenteditable") === "true")
            );

            // Do not intercept while user is typing in inputs
            if (isTyping) return;

            // Build buffer for printable keys
            if (e.key.length === 1) {
                setBarcodeBuffer((prev) => (prev || "") + e.key);
                window.clearTimeout(barcodeTimeout);
                barcodeTimeout = window.setTimeout(() => {
                    setBarcodeBuffer("");
                }, 120);
                return;
            }

            // On Enter, treat buffer as scanned barcode
            if (e.key === "Enter" && barcodeBuffer.trim()) {
                const code = barcodeBuffer.trim();
                setBarcodeBuffer("");
                // direct search and attempt to auto-assign
                (async () => {
                    try {
                        const res = await PostSimple(
                            `api/products/search?keyword=${encodeURIComponent(
                                code
                            )}`
                        );
                        const list: Product[] =
                            res?.data?.result || res?.data || [];
                        setProducts(Array.isArray(list) ? list : []);
                        if (Array.isArray(list) && list.length === 1) {
                            // put into first empty row or the last row
                            const targetIndex = Math.max(
                                0,
                                items.findIndex((it) => it.product_id === 0)
                            );
                            updateItem(
                                targetIndex === -1
                                    ? items.length - 1
                                    : targetIndex,
                                "product_id",
                                list[0].product_id
                            );
                        }
                    } catch (err) {
                        // ignore
                    }
                })();
            }
        };

        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("keydown", onKeyDown);
            window.clearTimeout(barcodeTimeout);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, items]);

    const searchProducts = async (keyword: string) => {
        const q = keyword.trim();
        if (!q) {
            fetchProducts();
            return;
        }

        setSearchingProducts(true);
        try {
            // Backend barcha search uchun keyword parametrini ishlatadi
            const endpoint = `api/products/search?keyword=${encodeURIComponent(
                q
            )}`;

            const res = await PostSimple(endpoint);
            const result = res?.data?.result || res?.data || [];
            setProducts(Array.isArray(result) ? result : []);
        } catch (error) {
            console.error("Mahsulotlarni qidirishda xatolik:", error);
            toast.error("Mahsulotlarni qidirishda xatolik");
        } finally {
            setSearchingProducts(false);
        }
    };

    // Mahsulot tanlanganda search inputni tozalash
    const handleProductSelect = (value: string, index: number) => {
        updateItem(index, "product_id", parseInt(value));
        // Search inputni tozalash uchun barcha mahsulotlarni qayta yuklash
        // Lekin faqat search qilingan bo'lsa
        if (products.length > 0 && products[0].product_id !== 0) {
            fetchProducts();
        }
    };

    const addItem = () => {
        setItems([
            ...items,
            { product_id: 0, amount: 0, receipt_price: 0, selling_price: 0 },
        ]);
    };

    const removeItem = (index: number) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    const updateItem = (
        index: number,
        field: keyof ArrivalItem,
        value: any
    ) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    // Valyuta konvertatsiya funksiyalari
    const convertToSom = (dollarAmount: number) => {
        return dollarAmount * dollarRate;
    };

    const convertToDollar = (somAmount: number) => {
        return dollarRate > 0 ? somAmount / dollarRate : 0;
    };

    // Raqamlarni bo'shliq bilan formatlash
    const formatNumberWithSpaces = (value: string | number) => {
        if (!value && value !== ".") return "";
        const stringValue = value.toString();
        // Remove any existing spaces
        const cleanValue = stringValue.replace(/\s/g, "");

        // Agar faqat nuqta bo'lsa, uni qaytarish
        if (cleanValue === ".") return ".";

        // Split by decimal point
        const parts = cleanValue.split(".");
        // Format integer part with spaces
        const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
        // Return formatted number
        return parts.length > 1 ? `${integerPart}.${parts[1]}` : integerPart;
    };

    // Helpers for totals
    const getReceiptPriceNumber = (value: number | string): number => {
        if (typeof value === "number") return value;
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
    };

    const getItemTotalSom = (item: ArrivalItem): number => {
        const usd = getReceiptPriceNumber(item.receipt_price);
        if (item.amount <= 0 || usd <= 0 || dollarRate <= 0) return 0;
        return convertToSom(item.amount * usd);
    };

    const grandTotalSom = useMemo(() => {
        return items.reduce((sum, it) => sum + getItemTotalSom(it), 0);
    }, [items, dollarRate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        const validItems = items
            .map((item) => {
                const receipt =
                    typeof item.receipt_price === "number"
                        ? item.receipt_price
                        : parseFloat(item.receipt_price || "0");
                const selling =
                    typeof item.selling_price === "number"
                        ? item.selling_price
                        : parseFloat(item.selling_price || "0");
                return {
                    ...item,
                    receipt_price: receipt,
                    selling_price: selling,
                } as ArrivalItem;
            })
            .filter(
                (item) =>
                    item.product_id > 0 &&
                    item.amount > 0 &&
                    (item.receipt_price as number) > 0 &&
                    (item.selling_price as number) > 0
            );

        if (validItems.length === 0) {
            toast.error("Kamida bitta to'liq mahsulot qo'shing!");
            return;
        }

        setIsLoading(true);
        try {
            const data = {
                cash_type: 0 as const,
                items: validItems,
            };

            const response = await PostDataTokenJson(
                "api/arrival/create",
                data
            );
            setResponse(JSON.stringify(response));
            toast.success("Kirim muvaffaqiyatli qo'shildi!");
            changeStatus();
            onClose();
            resetForm();
        } catch (error) {
            console.error("Kirim qo'shishda xatolik:", error);
            toast.error("Kirim qo'shishda xatolik");
            onClose();
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setItems([
            { product_id: 0, amount: 0, receipt_price: 0, selling_price: 0 },
        ]);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            className="max-w-4xl max-h-[90vh] overflow-y-auto"
        >
            <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">
                    Yangi kirim qo'shish
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Removed arrival number and comments */}

                    <div>
                        <Label>Dollar kursi</Label>
                        <Input
                            type="text"
                            value={formatNumber(dollarRate)}
                            placeholder="Dollar kursi yuklanmoqda..."
                            className="bg-gray-100 outline-none"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <Label>Mahsulotlar ({items.length})</Label>
                            <Button
                                type="button"
                                onClick={addItem}
                                className="bg-green-500 hover:bg-green-600 text-sm px-3 py-1"
                            >
                                + Qo'shish
                            </Button>
                        </div>

                        <div className="space-y-3 min-h-52 max-h-80 overflow-y-auto pr-2">
                            {items.map((item, index) => (
                                <div
                                    key={index}
                                    className="border border-gray-200 rounded-lg p-3 bg-gray-50"
                                >
                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="col-span-1">
                                            <Label className="text-xs">
                                                Mahsulot
                                            </Label>
                                            <Select
                                                defaultValue={
                                                    item.product_id?.toString() ||
                                                    ""
                                                }
                                                onChange={(value: string) =>
                                                    handleProductSelect(
                                                        value,
                                                        index
                                                    )
                                                }
                                                // @ts-ignore
                                                options={products.map(
                                                    (product) => ({
                                                        value: product.product_id,
                                                        label: (
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                                                                    {product.image_path ? (
                                                                        <img
                                                                            src={
                                                                                product.image_path
                                                                            }
                                                                            alt={
                                                                                product.product_name
                                                                            }
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    ) : (
                                                                        <span className="text-xs">
                                                                            📦
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <span className="text-sm">
                                                                    {
                                                                        product.product_name
                                                                    }
                                                                    {product.product_code
                                                                        ? ` - ${product.product_code}`
                                                                        : ` - ${product.barcode}:`}
                                                                </span>
                                                            </div>
                                                        ),
                                                    })
                                                )}
                                                placeholder="Tanlang"
                                                searchable={true}
                                                onSearch={searchProducts}
                                                searching={searchingProducts}
                                                externalSearchTerm={
                                                    barcodeBuffer
                                                }
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <div>
                                                <Label className="text-xs">
                                                    Miqdor
                                                </Label>
                                                <Input
                                                    type="text"
                                                    value={
                                                        item.amount
                                                            ? formatNumber(
                                                                  item.amount
                                                              )
                                                            : ""
                                                    }
                                                    onChange={(e) => {
                                                        const value =
                                                            e.target.value.replace(
                                                                /\s/g,
                                                                ""
                                                            );
                                                        updateItem(
                                                            index,
                                                            "amount",
                                                            parseInt(value) || 0
                                                        );
                                                    }}
                                                    placeholder="Miqdor"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs">
                                                    Kirim narxi (
                                                    {cashType === 0
                                                        ? "$"
                                                        : "UZS"}
                                                    )
                                                </Label>
                                                <input
                                                    type="text"
                                                    value={formatNumberWithSpaces(
                                                        item.receipt_price || ""
                                                    )}
                                                    onChange={(e) => {
                                                        const value =
                                                            e.target.value.replace(
                                                                /\s/g,
                                                                ""
                                                            ); // Remove spaces for processing

                                                        // Allow empty string, numbers, and decimal points
                                                        if (
                                                            value === "" ||
                                                            value === "." ||
                                                            /^\d*\.?\d*$/.test(
                                                                value
                                                            )
                                                        ) {
                                                            // Update the input display - faqat string sifatida saqlash
                                                            updateItem(
                                                                index,
                                                                "receipt_price",
                                                                value
                                                            );
                                                        }
                                                    }}
                                                    onBlur={(e) => {
                                                        // Input'dan chiqganda raqamga aylantirish
                                                        const value =
                                                            e.target.value.replace(
                                                                /\s/g,
                                                                ""
                                                            );
                                                        if (
                                                            value === "" ||
                                                            value === "."
                                                        ) {
                                                            updateItem(
                                                                index,
                                                                "receipt_price",
                                                                0
                                                            );
                                                        } else {
                                                            const parsedValue =
                                                                parseFloat(
                                                                    value
                                                                );
                                                            if (
                                                                !isNaN(
                                                                    parsedValue
                                                                )
                                                            ) {
                                                                updateItem(
                                                                    index,
                                                                    "receipt_price",
                                                                    parsedValue
                                                                );
                                                            }
                                                        }
                                                    }}
                                                    placeholder={`Kirim narxi (${
                                                        cashType === 0
                                                            ? "$"
                                                            : "UZS"
                                                    })`}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                                {dollarRate > 0 && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {(() => {
                                                            const value =
                                                                item.receipt_price;
                                                            if (
                                                                value === "" ||
                                                                value === "."
                                                            )
                                                                return "";

                                                            const numValue =
                                                                typeof value ===
                                                                "string"
                                                                    ? parseFloat(
                                                                          value
                                                                      )
                                                                    : value;
                                                            if (
                                                                isNaN(
                                                                    numValue
                                                                ) ||
                                                                numValue === 0
                                                            )
                                                                return "";

                                                            return cashType ===
                                                                0
                                                                ? `≈ ${formatNumber(
                                                                      convertToSom(
                                                                          numValue
                                                                      )
                                                                  )} UZS`
                                                                : `≈ ${formatNumber(
                                                                      convertToDollar(
                                                                          numValue
                                                                      )
                                                                  )} $`;
                                                        })()}
                                                    </p>
                                                )}
                                            </div>
                                            <div>
                                                <Label className="text-xs">
                                                    Sotish narxi ($)
                                                </Label>
                                                <input
                                                    type="text"
                                                    value={formatNumberWithSpaces(
                                                        item.selling_price || ""
                                                    )}
                                                    onChange={(e) => {
                                                        const value =
                                                            e.target.value.replace(
                                                                /\s/g,
                                                                ""
                                                            );
                                                        if (
                                                            value === "" ||
                                                            value === "." ||
                                                            /^\d*\.?\d*$/.test(
                                                                value
                                                            )
                                                        ) {
                                                            updateItem(
                                                                index,
                                                                "selling_price",
                                                                value
                                                            );
                                                        }
                                                    }}
                                                    onBlur={(e) => {
                                                        const value =
                                                            e.target.value.replace(
                                                                /\s/g,
                                                                ""
                                                            );
                                                        if (
                                                            value === "" ||
                                                            value === "."
                                                        ) {
                                                            updateItem(
                                                                index,
                                                                "selling_price",
                                                                0
                                                            );
                                                        } else {
                                                            const parsed =
                                                                parseFloat(
                                                                    value
                                                                );
                                                            if (!isNaN(parsed))
                                                                updateItem(
                                                                    index,
                                                                    "selling_price",
                                                                    parsed
                                                                );
                                                        }
                                                    }}
                                                    placeholder="Sotish narxi ($)"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                                {dollarRate > 0 && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        ≈{" "}
                                                        {formatNumber(
                                                            convertToSom(
                                                                typeof item.selling_price ===
                                                                    "number"
                                                                    ? item.selling_price
                                                                    : parseFloat(
                                                                          item.selling_price ||
                                                                              "0"
                                                                      ) || 0
                                                            )
                                                        )}{" "}
                                                        UZS
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Per item total & remove */}
                                    <div className="flex items-center justify-between mt-2">
                                        <div className="text-sm text-gray-600">
                                            Jami:{" "}
                                            {formatNumber(
                                                getItemTotalSom(item)
                                            )}{" "}
                                            UZS
                                        </div>
                                        {items.length > 1 && (
                                            <Button
                                                type="button"
                                                onClick={() =>
                                                    removeItem(index)
                                                }
                                                className="bg-red-500 hover:bg-red-600 text-xs px-2 py-1"
                                            >
                                                ✕
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Grand total */}
                    <div className="flex justify-end">
                        <div className="text-base font-semibold text-gray-800">
                            Umumiy: {formatNumber(grandTotalSom)} UZS
                        </div>
                    </div>

                    <div className="flex justify-end items-center gap-3 pt-4">
                        <Button
                            type="button"
                            onClick={handleClose}
                            variant="outline"
                            className="px-4 py-2 text-sm h-10 flex items-center justify-center"
                        >
                            Bekor qilish
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading || !hasValidItems}
                            className={`px-4 py-2 text-sm h-10 flex items-center justify-center ${
                                hasValidItems && !isLoading
                                    ? "bg-blue-500 hover:bg-blue-600"
                                    : "bg-gray-400 cursor-not-allowed"
                            }`}
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <span>Yuklanmoqda...</span>
                                </div>
                            ) : (
                                "Kirim qo'shish"
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
