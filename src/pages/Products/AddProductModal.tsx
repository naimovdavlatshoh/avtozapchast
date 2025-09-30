import React, { useState, useEffect, useRef } from "react";
import { Modal } from "../../components/ui/modal";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import {
    PostDataTokenJson,
    PostDataToken,
    GetDataSimple,
} from "../../service/data";
import { toast } from "react-hot-toast";

interface AddProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    changeStatus: () => void;
    setResponse: (value: string) => void;
}

const AddProductModal: React.FC<AddProductModalProps> = ({
    isOpen,
    onClose,
    changeStatus,
    setResponse,
}) => {
    const [productName, setProductName] = useState("");
    const [productCode, setProductCode] = useState("");
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState<number>(0);
    const [receiptPrice, setReceiptPrice] = useState<number>(0);
    const [sellingPrice, setSellingPrice] = useState<number>(0);
    const [amountDisplay, setAmountDisplay] = useState<string>("");
    const [receiptPriceDisplay, setReceiptPriceDisplay] = useState<string>("");
    const [sellingPriceDisplay, setSellingPriceDisplay] = useState<string>("");
    const [usdRate, setUsdRate] = useState<number>(0);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageId, setImageId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [barcodeInput, setBarcodeInput] = useState("");
    const [imageUploadStatus, setImageUploadStatus] = useState<{
        type: "success" | "error" | null;
        message: string;
    }>({ type: null, message: "" });
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const barcodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Helper functions for number formatting
    const formatNumberWithSpaces = (num: number): string => {
        if (num === 0) return "";
        return num
            .toLocaleString("en-US", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
            })
            .replace(/,/g, " ");
    };

    const parseFormattedNumber = (str: string): number => {
        // Remove spaces and convert to number
        const cleaned = str.replace(/\s/g, "");
        return parseFloat(cleaned) || 0;
    };

    // Fetch USD exchange rate from your API
    const fetchUSDRate = async () => {
        try {
            const response = await GetDataSimple("api/arrival/dollar");
            if (response) {
                setUsdRate(response.dollar_rate);
            }
        } catch (error) {
            console.error("Error fetching USD rate:", error);

            setUsdRate(1);
        }
    };

    // Calculate SUM equivalent from USD amount
    const calculateSUMEquivalent = (usdAmount: number): string => {
        if (usdRate === 0 || usdAmount === 0) return "0";
        const sumAmount = usdAmount * usdRate;
        return formatNumberWithSpaces(sumAmount);
    };

    // Fetch USD rate when modal opens
    useEffect(() => {
        if (isOpen && usdRate === 0) {
            fetchUSDRate();
        }
    }, [isOpen]);

    // Format display values when component mounts or values change
    useEffect(() => {
        if (amount > 0) {
            setAmountDisplay(formatNumberWithSpaces(amount));
        }
    }, [amount]);

    useEffect(() => {
        if (receiptPrice > 0) {
            setReceiptPriceDisplay(formatNumberWithSpaces(receiptPrice));
        }
    }, [receiptPrice]);

    useEffect(() => {
        if (sellingPrice > 0) {
            setSellingPriceDisplay(formatNumberWithSpaces(sellingPrice));
        }
    }, [sellingPrice]);

    // Barcode scanner funksiyasi
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyPress = (event: KeyboardEvent) => {
            // Faqat barcode input focus bo'lmagan vaqtda ishlaydi
            const activeElement = document.activeElement as HTMLElement;
            const isInputFocused =
                activeElement &&
                (activeElement.tagName === "INPUT" ||
                    activeElement.tagName === "TEXTAREA" ||
                    activeElement.contentEditable === "true");

            // Agar har qanday input focus bo'lsa, barcode scanner umuman ishlamasin
            if (isInputFocused) {
                return;
            }

            // Enter tugmasi bosilganda barcode ni product code ga qo'shish
            if (event.key === "Enter" && barcodeInput.trim()) {
                setProductCode(barcodeInput.trim());
                setBarcodeInput("");
                // Mahsulot kodi inputiga focus qilish
                const productCodeInput = document.getElementById(
                    "productCode"
                ) as HTMLInputElement;
                if (productCodeInput) {
                    productCodeInput.focus();
                }
                toast.success("Barcode muvaffaqiyatli qo'shildi");
                return;
            }

            // Har bir harf/raqam kiritilganda barcode input ga qo'shish
            // Faqat hech qanday input focus bo'lmagan vaqtda ishlaydi
            if (event.key.length === 1 && !isInputFocused) {
                setBarcodeInput((prev) => prev + event.key);

                // 100ms dan keyin barcode input ni tozalash (barcode scanner tez kiritadi)
                if (barcodeTimeoutRef.current) {
                    clearTimeout(barcodeTimeoutRef.current);
                }

                barcodeTimeoutRef.current = setTimeout(() => {
                    setBarcodeInput("");
                }, 100);
            }
        };

        // Event listener qo'shish
        document.addEventListener("keydown", handleKeyPress);

        // Cleanup
        return () => {
            document.removeEventListener("keydown", handleKeyPress);
            if (barcodeTimeoutRef.current) {
                clearTimeout(barcodeTimeoutRef.current);
            }
        };
    }, [isOpen, barcodeInput]);

    const handleImageChange = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        if (file) {
            // Reset previous status
            setImageUploadStatus({ type: null, message: "" });
            setImageFile(file);
            setIsUploadingImage(true);

            // Rasm tanlagan zahot darrov API ga jo'natish
            try {
                const formData = new FormData();
                formData.append("image", file);

                const response = await PostDataToken(
                    "api/products/image",
                    formData
                );
                if (response.data?.image_id) {
                    setImageId(response.data.image_id);
                    setImageUploadStatus({
                        type: "success",
                        message: "Rasm muvaffaqiyatli yuklandi",
                    });
                    toast.success("Rasm muvaffaqiyatli yuklandi");
                } else {
                    setImageUploadStatus({
                        type: "error",
                        message:
                            "Rasm yuklashda xatolik - server javob bermadi",
                    });
                    toast.error("Rasm yuklashda xatolik");
                }
            } catch (error: any) {
                console.error("Rasm yuklashda xatolik:", error);
                const errorMessage =
                    error.response?.data?.error || "Rasm yuklashda xatolik";
                setImageUploadStatus({
                    type: "error",
                    message: errorMessage,
                });
                toast.error("Rasm yuklashda xatolik");
            } finally {
                setIsUploadingImage(false);
            }
        }
    };

    const handleSubmit = async () => {
        if (!productName.trim()) {
            toast.error("Mahsulot nomi kiritilishi shart");
            return;
        }

        if (amount <= 0) {
            toast.error("Miqdor 0 dan katta bo'lishi kerak");
            return;
        }

        if (receiptPrice <= 0) {
            toast.error("Sotib olish narxi 0 dan katta bo'lishi kerak");
            return;
        }

        if (sellingPrice <= 0) {
            toast.error("Sotish narxi 0 dan katta bo'lishi kerak");
            return;
        }

        setIsLoading(true);

        try {
            // Mahsulot yaratish
            const payload: any = {
                product_name: productName.trim(),
            };

            if (productCode.trim()) {
                payload.product_code = productCode.trim();
            }

            if (description.trim()) {
                payload.description = description.trim();
            }

            if (imageId) {
                payload.image_id = imageId;
            }

            // Add new fields
            payload.amount = amount;
            payload.receipt_price = receiptPrice;
            payload.selling_price = sellingPrice;
            payload.cash_type = 0; // Static value as requested

            const response = await PostDataTokenJson(
                "api/products/create",
                payload
            );

            if (response?.data?.status === 200 || response?.data?.success) {
                toast.success("Mahsulot muvaffaqiyatli qo'shildi");
                setProductName("");
                setProductCode("");
                setDescription("");
                setAmount(0);
                setReceiptPrice(0);
                setSellingPrice(0);
                setAmountDisplay("");
                setReceiptPriceDisplay("");
                setSellingPriceDisplay("");
                setImageFile(null);
                setImageId(null);
                changeStatus();
                onClose();
            } else {
                toast.error("Mahsulot qo'shishda xatolik");
            }
        } catch (error: any) {
            console.error("Mahsulot qo'shishda xatolik:", error);
            const errorMessage =
                error.response?.data?.error || "Mahsulot qo'shishda xatolik";
            toast.error(errorMessage);
            setResponse(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setProductName("");
        setProductCode("");
        setDescription("");
        setAmount(0);
        setReceiptPrice(0);
        setSellingPrice(0);
        setAmountDisplay("");
        setReceiptPriceDisplay("");
        setSellingPriceDisplay("");
        setImageFile(null);
        setImageId(null);
        setBarcodeInput("");
        setImageUploadStatus({ type: null, message: "" });
        setIsUploadingImage(false);
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            className="max-w-[700px] p-6 lg:p-10"
        >
            <h2 className="text-xl font-bold mb-4 dark:text-gray-100">
                Mahsulot qo'shish
            </h2>
            <div className="space-y-4">
                <div>
                    <Label htmlFor="productName">Mahsulot nomi *</Label>
                    <Input
                        type="text"
                        id="productName"
                        placeholder="Mahsulot nomi"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                    />
                </div>

                <div>
                    <Label htmlFor="productCode">Mahsulot kodi</Label>
                    <Input
                        type="text"
                        id="productCode"
                        placeholder="Mahsulot kodi (ixtiyoriy) yoki barcode scanner ishlatish"
                        value={productCode}
                        onChange={(e) => setProductCode(e.target.value)}
                    />
                    {isOpen && (
                        <p className="text-xs text-gray-500 mt-1">
                            💡 Barcode scanner ulangan - mahsulotni scan qiling
                        </p>
                    )}
                </div>

                <div>
                    <Label htmlFor="description">Tavsif</Label>
                    <textarea
                        id="description"
                        placeholder="Mahsulot tavsifi (ixtiyoriy)"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        rows={3}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <Label htmlFor="amount">Miqdor *</Label>
                        <Input
                            type="text"
                            id="amount"
                            placeholder="0"
                            value={amountDisplay}
                            onChange={(e) => {
                                const value = e.target.value;
                                // Allow only numbers and spaces (no decimal for amount)
                                const sanitized = value.replace(/[^\d\s]/g, "");

                                setAmountDisplay(sanitized);

                                // Update the actual number value
                                const numValue =
                                    parseFormattedNumber(sanitized);
                                setAmount(numValue);
                            }}
                        />
                    </div>

                    <div>
                        <Label htmlFor="receiptPrice">
                            Sotib olish narxi (USD) *
                        </Label>
                        <Input
                            type="text"
                            id="receiptPrice"
                            placeholder="0.00"
                            value={receiptPriceDisplay}
                            onChange={(e) => {
                                const value = e.target.value;
                                // Allow only numbers, spaces, and one decimal point
                                const sanitized = value.replace(
                                    /[^\d\s.]/g,
                                    ""
                                );

                                // Ensure only one decimal point
                                const parts = sanitized.split(".");
                                if (parts.length > 2) {
                                    return; // Don't update if more than one decimal point
                                }

                                setReceiptPriceDisplay(sanitized);

                                // Update the actual number value
                                const numValue =
                                    parseFormattedNumber(sanitized);
                                setReceiptPrice(numValue);
                            }}
                        />
                        {/* SUM Equivalent for Receipt Price */}
                        {receiptPrice > 0 && usdRate > 0 && (
                            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                ≈ {calculateSUMEquivalent(receiptPrice)} so'm
                            </div>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="sellingPrice">
                            Sotish narxi (USD) *
                        </Label>
                        <Input
                            type="text"
                            id="sellingPrice"
                            placeholder="0.00"
                            value={sellingPriceDisplay}
                            onChange={(e) => {
                                const value = e.target.value;

                                const sanitized = value.replace(
                                    /[^\d\s.]/g,
                                    ""
                                );

                                // Ensure only one decimal point
                                const parts = sanitized.split(".");
                                if (parts.length > 2) {
                                    return; // Don't update if more than one decimal point
                                }

                                setSellingPriceDisplay(sanitized);

                                // Update the actual number value
                                const numValue =
                                    parseFormattedNumber(sanitized);
                                setSellingPrice(numValue);
                            }}
                        />
                        {/* SUM Equivalent for Selling Price */}
                        {sellingPrice > 0 && usdRate > 0 && (
                            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                ≈ {calculateSUMEquivalent(sellingPrice)} so'm
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <Label htmlFor="image">Rasm</Label>
                    <input
                        type="file"
                        id="image"
                        accept="image/*"
                        onChange={handleImageChange}
                        disabled={isUploadingImage}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    />

                    {/* Upload Status Display */}
                    {isUploadingImage && (
                        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-sm text-blue-700 dark:text-blue-300">
                                    Rasm yuklanmoqda...
                                </span>
                            </div>
                        </div>
                    )}

                    {imageUploadStatus.type === "success" && (
                        <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                            <div className="flex items-center gap-2">
                                <svg
                                    className="w-4 h-4 text-green-600 dark:text-green-400"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                <span className="text-sm text-green-700 dark:text-green-300">
                                    {imageUploadStatus.message}
                                </span>
                            </div>
                        </div>
                    )}

                    {imageUploadStatus.type === "error" && (
                        <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                            <div className="flex items-center gap-2">
                                <svg
                                    className="w-4 h-4 text-red-600 dark:text-red-400"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                <span className="text-sm text-red-700 dark:text-red-300">
                                    {imageUploadStatus.message}
                                </span>
                            </div>
                        </div>
                    )}

                    {imageFile &&
                        !isUploadingImage &&
                        !imageUploadStatus.type && (
                            <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    <span className="font-medium">
                                        Tanlangan fayl:
                                    </span>{" "}
                                    {imageFile.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                    Rasm yuklash uchun faylni tanlang
                                </p>
                            </div>
                        )}
                </div>

                <div className="flex justify-end gap-2">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 rounded-md border border-gray-300 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                        Bekor qilish
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || isUploadingImage}
                        className={`px-4 py-2 rounded-md text-white transition-colors ${
                            isLoading || isUploadingImage
                                ? "bg-blue-400 cursor-not-allowed"
                                : "bg-blue-600 hover:bg-blue-700"
                        }`}
                    >
                        {isLoading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Saqlanyapti...
                            </div>
                        ) : isUploadingImage ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Rasm yuklanmoqda...
                            </div>
                        ) : (
                            "Saqlash"
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default AddProductModal;
