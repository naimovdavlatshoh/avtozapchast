import React, { useState, useEffect } from "react";
import { Modal } from "../../components/ui/modal";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import {
    PostDataTokenJson,
    PostDataToken,
    GetDataSimple,
    GetDataSimpleBlob,
    GetCategoriesList,
    SearchCategories,
} from "../../service/data";
import { toast } from "react-hot-toast";

interface Product {
    product_id: number;
    product_name: string;
    product_code?: string;
    barcode?: number | string;
    description?: string;
    amount?: number;
    total_amount?: number;
    last_receipt_price?: number | string; // USD may come as number or string
    receipt_price?: number; // USD
    receipt_price_uzs?: string;
    selling_price?: number | string; // USD
    selling_price_uzs?: string;
    current_dollar_rate?: number;
    arrival_dollar_rate?: number;
    image_id?: number;
    category_id?: number;
    created_at?: string;
    updated_at?: string;
    image_path?: string;
}

interface EditProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product;
    changeStatus: () => void;
}

const EditProductModal: React.FC<EditProductModalProps> = ({
    isOpen,
    onClose,
    product,
    changeStatus,
}) => {
    const [productName, setProductName] = useState("");
    const [productCode, setProductCode] = useState("");
    const [categoryId, setCategoryId] = useState<string>("");
    const [productImage, setProductImage] = useState("");
    const [usdRate, setUsdRate] = useState<number>(0);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [currentImageId, setCurrentImageId] = useState<number | null>(null);
    const [newImageId, setNewImageId] = useState<number | null>(null);
    const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [imageUploadStatus, setImageUploadStatus] = useState<{
        type: "success" | "error" | null;
        message: string;
    }>({ type: null, message: "" });
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [categoryOptions, setCategoryOptions] = useState<
        { value: number; label: string }[]
    >([]);
    const [isSearchingCategories, setIsSearchingCategories] = useState(false);

    // Fetch USD exchange rate from your API
    const fetchUSDRate = async () => {
        try {
            const response = await GetDataSimple("api/arrival/dollar");
            if (response) {
                setUsdRate(response.dollar_rate);
            }
        } catch (error) {
            console.error("Error fetching USD rate:", error);
            // Fallback rate if API fails
            setUsdRate(1);
        }
    };

    // Fetch categories when modal opens
    const fetchCategories = async (page: number = 1) => {
        try {
            const response = await GetCategoriesList(page, 50);
            if (response?.result) {
                const options = response.result.map((cat: any) => ({
                    value: cat.id || cat.category_id,
                    label: cat.category_name,
                }));
                setCategoryOptions(options);
                // If product has category_id, ensure it's set after categories are loaded
                if (product?.category_id && !categoryId) {
                    setCategoryId(String(product.category_id));
                }
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    // Search categories
    const handleCategorySearch = async (keyword: string) => {
        if (keyword.trim().length < 3) {
            // If less than 3 characters, fetch default list
            await fetchCategories();
            return;
        }
        setIsSearchingCategories(true);
        try {
            const response = await SearchCategories(keyword);
            if (response?.result) {
                const options = response.result.map((cat: any) => ({
                    value: cat.id || cat.category_id,
                    label: cat.category_name,
                }));
                setCategoryOptions(options);
            }
        } catch (error) {
            console.error("Error searching categories:", error);
        } finally {
            setIsSearchingCategories(false);
        }
    };

    // Fetch USD rate and categories when modal opens
    useEffect(() => {
        if (isOpen) {
            if (usdRate === 0) {
                fetchUSDRate();
            }
            fetchCategories();
        }
    }, [isOpen]);

    useEffect(() => {
        if (product) {
            setProductName(product.product_name || "");
            // prefer product_code, fallback to barcode (cast to string safely)
            const codeValue =
                product.product_code ??
                (product.barcode !== undefined && product.barcode !== null
                    ? String(product.barcode)
                    : "");
            setProductCode(codeValue);
            setProductImage(product.image_path || "");
            // Set category_id if available
            if (product.category_id) {
                setCategoryId(String(product.category_id));
            } else {
                setCategoryId("");
            }

            // dollar rate from payload if present
            const rateFromPayload =
                product.current_dollar_rate || product.arrival_dollar_rate;
            if (rateFromPayload && rateFromPayload > 0) {
                setUsdRate(rateFromPayload);
            }
            setCurrentImageId(product.image_id || null);
        }
    }, [product]);

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
                    setNewImageId(response.data.image_id);
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

    // Fetch current image via API when modal opens
    const fetchImageUrl = async (imageId?: number) => {
        if (!imageId) return;
        try {
            const blob = await GetDataSimpleBlob(
                `api/products/image/${imageId}`
            );
            const objectUrl = URL.createObjectURL(blob);
            setCurrentImageUrl(objectUrl);
        } catch (err) {
            console.error("Failed to fetch product image:", err);
            setCurrentImageUrl(null);
        }
    };

    useEffect(() => {
        if (!isOpen) return;
        // cleanup previous object URL to prevent leaks
        if (currentImageUrl) {
            URL.revokeObjectURL(currentImageUrl);
            setCurrentImageUrl(null);
        }
        fetchImageUrl(currentImageId || undefined);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, currentImageId]);

    const handleSubmit = async () => {
        if (!productName.trim()) {
            toast.error("Mahsulot nomi kiritilishi shart");
            return;
        }

        setIsLoading(true);

        try {
            // Mahsulotni yangilash
            const payload: any = {
                product_name: productName.trim(),
            };

            if (productCode.trim()) {
                payload.product_code = productCode.trim();
            }

            if (categoryId) {
                payload.category_id = parseInt(categoryId);
            }

            payload.cash_type = 0; // Static value as requested

            // Agar yangi rasm yuklangan bo'lsa, uni ishlatish
            if (newImageId) {
                payload.image_id = newImageId;
            } else if (currentImageId) {
                payload.image_id = currentImageId;
            }

            const response = await PostDataTokenJson(
                `api/products/update/${product.product_id}`,
                payload
            );

            if (response?.data?.status === 200 || response?.data?.success) {
                toast.success("Mahsulot muvaffaqiyatli yangilandi");
                setImageFile(null);
                setNewImageId(null);
                changeStatus();
                onClose();
            } else {
                toast.error("Mahsulot yangilashda xatolik");
            }
        } catch (error: any) {
            console.error("Mahsulot yangilashda xatolik:", error);
            const errorMessage =
                error.response?.data?.error || "Mahsulot yangilashda xatolik";
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setImageFile(null);
        setNewImageId(null);
        setProductName("");
        setProductCode("");
        setCategoryId("");
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
                Mahsulotni tahrirlash
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
                        placeholder="Mahsulot kodi (ixtiyoriy)"
                        value={productCode}
                        onChange={(e) => setProductCode(e.target.value)}
                    />
                </div>

                <div>
                    <Label htmlFor="category">Kategoriya</Label>
                    <Select
                        key={`category-select-${product.product_id}-${categoryId}`}
                        options={categoryOptions}
                        placeholder="Kategoriya tanlang (ixtiyoriy)"
                        onChange={(value) => setCategoryId(value)}
                        searchable={true}
                        onSearch={handleCategorySearch}
                        searching={isSearchingCategories}
                        defaultValue={categoryId}
                        className="dark:bg-gray-700"
                    />
                </div>

                <div>
                    <Label htmlFor="image">Rasm</Label>

                    <div className="mb-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Joriy rasm:
                        </p>
                        <img
                            src={productImage}
                            alt="Joriy rasm"
                            className="w-20 h-20 object-cover rounded border"
                            onError={(e) => {
                                e.currentTarget.style.display = "none";
                            }}
                        />
                    </div>

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
                                Yangilanyapti...
                            </div>
                        ) : isUploadingImage ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Rasm yuklanmoqda...
                            </div>
                        ) : (
                            "Yangilash"
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default EditProductModal;
