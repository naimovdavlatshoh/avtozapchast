import React, { useState, useEffect, useRef } from "react";
import { Modal } from "../../components/ui/modal";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import { PostDataTokenJson, PostDataToken } from "../../service/data";
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
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageId, setImageId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [barcodeInput, setBarcodeInput] = useState("");
    const barcodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
            setImageFile(file);

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
                    toast.success("Rasm muvaffaqiyatli yuklandi");
                }
            } catch (error) {
                console.error("Rasm yuklashda xatolik:", error);
                toast.error("Rasm yuklashda xatolik");
            }
        }
    };

    const handleSubmit = async () => {
        if (!productName.trim()) {
            toast.error("Mahsulot nomi kiritilishi shart");
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

            const response = await PostDataTokenJson(
                "api/products/create",
                payload
            );

            if (response?.data?.status === 200 || response?.data?.success) {
                toast.success("Mahsulot muvaffaqiyatli qo'shildi");
                setProductName("");
                setProductCode("");
                setDescription("");
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
        setImageFile(null);
        setImageId(null);
        setBarcodeInput("");
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

                <div>
                    <Label htmlFor="image">Rasm</Label>
                    <input
                        type="file"
                        id="image"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    {imageFile && (
                        <div className="mt-2">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Tanlangan fayl: {imageFile.name}
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
                        disabled={isLoading}
                        className={`px-4 py-2 rounded-md text-white transition-colors ${
                            isLoading
                                ? "bg-blue-400 cursor-not-allowed"
                                : "bg-blue-600 hover:bg-blue-700"
                        }`}
                    >
                        {isLoading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Saqlanyapti...
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
