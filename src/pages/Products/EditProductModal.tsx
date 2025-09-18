import React, { useState, useEffect } from "react";
import { Modal } from "../../components/ui/modal";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import { PostDataTokenJson, PostDataToken } from "../../service/data";
import { toast } from "react-hot-toast";

interface Product {
    product_id: number;
    product_name: string;
    product_code?: string;
    description?: string;
    image_id?: number;
    created_at?: string;
    updated_at?: string;
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
    const [description, setDescription] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [currentImageId, setCurrentImageId] = useState<number | null>(null);
    const [newImageId, setNewImageId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (product) {
            setProductName(product.product_name || "");
            setProductCode(product.product_code || "");
            setDescription(product.description || "");
            setCurrentImageId(product.image_id || null);
        }
    }, [product]);

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
                    setNewImageId(response.data.image_id);
                    toast.success("Rasm muvaffaqiyatli yuklandi");
                }
            } catch (error) {
                console.error("Rasm yuklashda xatolik:", error);
                toast.error("Rasm yuklashda xatolik");
            }
        }
    };

    const getImageUrl = (imageId?: number) => {
        if (imageId) {
            return `${
                import.meta.env.VITE_API_URL ||
                "https://apistore.afandicloud.uz/"
            }api/products/image/${imageId}`;
        }
        return null;
    };

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

            if (description.trim()) {
                payload.description = description.trim();
            }

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
        setDescription("");
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
                    {currentImageId && (
                        <div className="mb-2">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                Joriy rasm:
                            </p>
                            <img
                                src={getImageUrl(currentImageId) || ""}
                                alt="Joriy rasm"
                                className="w-20 h-20 object-cover rounded border"
                                onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                }}
                            />
                        </div>
                    )}
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
                                Yangi fayl: {imageFile.name}
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
                                Yangilanyapti...
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
