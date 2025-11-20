import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
// import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Button from "../../components/ui/button/Button";
import {
    GetDataSimple,
    PostDataTokenJson,
    PostSimple,
} from "../../service/data";
import { formatNumber } from "../../utils/numberFormat";
import toast from "react-hot-toast";
import { MdArrowBack } from "react-icons/md";

interface Product {
    product_id: number;
    product_name: string;
    barcode?: string | number;
    product_code?: string;
    total_amount?: number;
    last_receipt_price?: number;
    selling_price?: number;
    image_path: string;
}

interface ArrivalItem {
    product_id: number;
    amount: number;
    receipt_price: number | string;
    selling_price: number | string;
    product_name?: string;
    barcode?: string | number;
    product_code?: string;
    total_amount?: number;
    image_path?: string;
}

const cashType: 0 = 0;

const initialItem: ArrivalItem = {
    product_id: 0,
    amount: 0,
    receipt_price: 0,
    selling_price: 0,
};

export default function AddArrivalPage() {
    const navigate = useNavigate();
    const [dollarRate, setDollarRate] = useState<number>(0);
    const [items, setItems] = useState<ArrivalItem[]>([]);
    const [productResults, setProductResults] = useState<Product[]>([]);
    const [searchingProducts, setSearchingProducts] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
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
        fetchDollarRate();
    }, []);

    const fetchDollarRate = async () => {
        try {
            const res = await GetDataSimple("api/arrival/dollar");
            setDollarRate(res?.dollar_rate || 12500);
        } catch (error) {
            console.error("Dollar kursini yuklashda xatolik:", error);
            toast.error("Dollar kursini yuklashda xatolik");
        }
    };

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            const active = document.activeElement as HTMLElement | null;
            const isTyping = !!(
                active &&
                (active.tagName === "INPUT" ||
                    active.tagName === "TEXTAREA" ||
                    active.getAttribute("contenteditable") === "true")
            );

            if (isTyping) return;

            if (e.key.length === 1) {
                setBarcodeBuffer((prev) => (prev || "") + e.key);
                window.clearTimeout(barcodeTimeout);
                barcodeTimeout = window.setTimeout(() => {
                    setBarcodeBuffer("");
                }, 120);
                return;
            }

            if (e.key === "Enter" && barcodeBuffer.trim()) {
                const code = barcodeBuffer.trim();
                setBarcodeBuffer("");
                (async () => {
                    try {
                        const res = await PostSimple(
                            `api/products/search?keyword=${encodeURIComponent(
                                code
                            )}`
                        );
                        const list: Product[] =
                            res?.data?.result || res?.data || [];
                        setProductResults(Array.isArray(list) ? list : []);
                        if (Array.isArray(list) && list.length === 1) {
                            addProductAsNewItem(list[0]);
                        }
                    } catch {
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
    }, [items]);

    const searchProducts = async (keyword: string) => {
        const q = keyword.trim();
        if (!q) {
            setProductResults([]);
            return;
        }

        setSearchingProducts(true);
        try {
            const endpoint = `api/products/search?keyword=${encodeURIComponent(
                q
            )}`;

            const res = await PostSimple(endpoint);
            const result = res?.data?.result || res?.data || [];
            setProductResults(Array.isArray(result) ? result : []);
        } catch (error) {
            console.error("Mahsulotlarni qidirishda xatolik:", error);
            toast.error("Mahsulotlarni qidirishda xatolik");
        } finally {
            setSearchingProducts(false);
        }
    };

    useEffect(() => {
        const trimmed = searchTerm.trim();
        if (trimmed.length === 0) {
            setProductResults([]);
            return;
        }
        if (trimmed.length < 3) return;
        const timeout = setTimeout(() => {
            searchProducts(trimmed);
        }, 400);
        return () => clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm]);

    const addProductAsNewItem = (product: Product) => {
        setItems((prevItems) => {
            const newItems = [...prevItems];
            let targetIndex = newItems.findIndex(
                (item) => item.product_id === 0
            );

            if (targetIndex === -1) {
                targetIndex = newItems.length;
                newItems.push({ ...initialItem });
            }

            newItems[targetIndex] = {
                ...newItems[targetIndex],
                product_id: product.product_id,
                product_name: product.product_name,
                product_code: product.product_code,
                barcode: product.barcode,
                total_amount: product.total_amount ?? 0,
                image_path: product.image_path,
                receipt_price: product.last_receipt_price ?? 0,
                selling_price: product.selling_price ?? 0,
            };

            return newItems;
        });
    };

    // const addItem = () => {
    //     setItems((prev) => [...prev, { ...initialItem }]);
    // };

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

    const convertToSom = (dollarAmount: number) => {
        return dollarAmount * dollarRate;
    };

    const convertToDollar = (somAmount: number) => {
        return dollarRate > 0 ? somAmount / dollarRate : 0;
    };

    const formatNumberWithSpaces = (value: string | number) => {
        if (!value && value !== ".") return "";
        const stringValue = value.toString();
        const cleanValue = stringValue.replace(/\s/g, "");
        if (cleanValue === ".") return ".";
        const parts = cleanValue.split(".");
        const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
        return parts.length > 1 ? `${integerPart}.${parts[1]}` : integerPart;
    };

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

        setIsSubmitting(true);
        try {
            const data = {
                cash_type: 0 as const,
                items: validItems,
            };

            await PostDataTokenJson("api/arrival/create", data);
            toast.success("Kirim muvaffaqiyatli qo'shildi!");
            navigate("/arrivals");
        } catch (error) {
            console.error("Kirim qo'shishda xatolik:", error);
            toast.error("Kirim qo'shishda xatolik");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleProductCardSelect = (product: Product) => {
        if (!items.length) {
            setItems([initialItem]);
        }
        addProductAsNewItem(product);
        setSearchTerm("");
        setProductResults([]);
    };

    return (
        <>
            {/* <PageBreadcrumb pageTitle="Yangi kirim qo'shish" /> */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => navigate("/arrivals")}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-100"
                    >
                        <MdArrowBack className="text-lg" />
                        Kirimlar ro'yxatiga qaytish
                    </button>
                    <div className="text-sm text-gray-500">
                        Dollar kursi:{" "}
                        <span className="font-semibold text-gray-700">
                            {formatNumber(dollarRate)} so'm
                        </span>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="w-full  relative ">
                            <Input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Mahsulot qidirish... (3+ harf)"
                                className="w-full"
                            />
                            {searchTerm && (
                                <button
                                    type="button"
                                    onClick={() => setSearchTerm("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="min-h-[50px]">
                        {searchTerm.trim().length > 0 &&
                        searchTerm.trim().length < 3 ? (
                            <p className="text-sm text-gray-500">
                                Qidiruv uchun kamida 3 ta belgi kiriting.
                            </p>
                        ) : searchingProducts ? (
                            <div className="flex justify-center items-center py-6">
                                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : productResults.length === 0 ? (
                            <p className="text-sm text-gray-500">
                                Mahsulotlar topilmadi.
                            </p>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                                {productResults.map((product) => (
                                    <div
                                        key={product.product_id}
                                        className="border border-gray-200 rounded-lg p-4 hover:border-blue-400 transition-colors bg-gray-50 flex flex-col gap-3"
                                    >
                                        <div className="w-full h-40 bg-white rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden">
                                            {product.image_path ? (
                                                <img
                                                    src={product.image_path}
                                                    alt={product.product_name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-4xl">
                                                    📦
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-gray-900 line-clamp-1">
                                                {product.product_name}
                                            </div>

                                            <p className="text-xs text-gray-500">
                                                Kod:{" "}
                                                {product.product_code || "-"}
                                            </p>
                                            <p className="text-xs text-gray-600 mt-1">
                                                Sklad:{" "}
                                                <span className="font-semibold">
                                                    {product.total_amount ?? 0}{" "}
                                                    dona
                                                </span>
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleProductCardSelect(product)
                                            }
                                            className="mt-3 w-full px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                                        >
                                            Ushbu mahsulotni tanlash
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="bg-white border border-gray-200 rounded-xl p-6 space-y-4"
                >
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                        {items.map((item, index) => (
                            <div
                                key={index}
                                className="border border-gray-200 rounded-lg p-4 bg-white"
                            >
                                <div className="flex flex-col lg:flex-row gap-6 items-center">
                                    {/* Chap tomonda katta rasm */}
                                    <div className="flex-shrink-0 w-1/3">
                                        <div className="w-full h-[300px] bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden">
                                            {item.image_path ? (
                                                <img
                                                    src={item.image_path}
                                                    alt={item.product_name}
                                                    className="w-full h-full object-contain"
                                                />
                                            ) : (
                                                <span className="text-5xl text-gray-400">
                                                    📦
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* O'rtada mahsulot ma'lumotlari */}
                                    <div className="flex-1 w-1/3 h-[300px]  flex flex-col justify-start items-start">
                                        <p className="text-base font-semibold text-gray-900 mb-2">
                                            {item.product_id > 0
                                                ? item.product_name
                                                : "Mahsulot tanlanmagan"}
                                        </p>
                                        <div className="space-y-1">
                                            <p className="text-sm text-gray-600">
                                                <span className="font-medium">
                                                    Barcode:
                                                </span>{" "}
                                                {item.barcode || "-"}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                <span className="font-medium">
                                                    Kod:
                                                </span>{" "}
                                                {item.product_code || "-"}
                                            </p>
                                            {item.total_amount !==
                                                undefined && (
                                                <p className="text-sm text-gray-600">
                                                    <span className="font-medium">
                                                        Sklad:
                                                    </span>{" "}
                                                    {item.total_amount} dona
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* O'ngda inputlar va jami */}
                                    <div className="flex-shrink-0 w-1/3  lg:w-80 space-y-3">
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
                                                {cashType === 0 ? "$" : "UZS"})
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
                                                            "receipt_price",
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
                                                            "receipt_price",
                                                            0
                                                        );
                                                    } else {
                                                        const parsedValue =
                                                            parseFloat(value);
                                                        if (
                                                            !isNaN(parsedValue)
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
                                                    cashType === 0 ? "$" : "UZS"
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
                                                            isNaN(numValue) ||
                                                            numValue === 0
                                                        )
                                                            return "";

                                                        return cashType === 0
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
                                                            parseFloat(value);
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
                                        <div className="pt-2 border-t border-gray-200">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-gray-700">
                                                    Jami:
                                                </span>
                                                <span className="text-base font-bold text-blue-600">
                                                    {formatNumber(
                                                        getItemTotalSom(item)
                                                    )}{" "}
                                                    UZS
                                                </span>
                                            </div>
                                        </div>
                                        {items.length > 1 && (
                                            <Button
                                                type="button"
                                                onClick={() =>
                                                    removeItem(index)
                                                }
                                                className="w-full bg-red-500 hover:bg-red-600 text-white px-3 py-2 text-sm"
                                            >
                                                O'chirish
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                        <div className="text-base font-semibold text-gray-800">
                            Umumiy: {formatNumber(grandTotalSom)} UZS
                        </div>
                        <div className="flex gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate("/arrivals")}
                                className="px-4 py-2 text-sm h-10 flex items-center justify-center"
                            >
                                Bekor qilish
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting || !hasValidItems}
                                className={`px-4 py-2 text-sm h-10 flex items-center justify-center ${
                                    hasValidItems && !isSubmitting
                                        ? "bg-blue-500 hover:bg-blue-600"
                                        : "bg-gray-400 cursor-not-allowed"
                                }`}
                            >
                                {isSubmitting
                                    ? "Yuklanmoqda..."
                                    : "Kirim qo'shish"}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </>
    );
}
