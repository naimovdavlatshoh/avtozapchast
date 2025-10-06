import React, { useState } from "react";
import { Modal } from "../../components/ui/modal";
import { DeleteData } from "../../service/data";
import { toast } from "react-hot-toast";

interface Product {
    product_id: number;
    product_name: string;
    total_amount: number;
    last_receipt_price: number;
    selling_price: number;
    barcode: number;
    description?: string;
    image_id?: number;
    created_at?: string;
    updated_at?: string;
}

interface DeleteProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product;
    changeStatus: () => void;
}

const DeleteProductModal: React.FC<DeleteProductModalProps> = ({
    isOpen,
    onClose,
    product,
    changeStatus,
}) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleDelete = async () => {
        setIsLoading(true);

        try {
            const response = await DeleteData(
                `api/products/delete/${product.product_id}`
            );

            if (response?.status === 200 || response?.data?.success) {
                toast.success("Mahsulot muvaffaqiyatli o'chirildi");
                changeStatus();
                onClose();
            } else {
                toast.error("Mahsulot o'chirishda xatolik");
            }
        } catch (error: any) {
            console.error("Mahsulot o'chirishda xatolik:", error);
            const errorMessage =
                error.response?.data?.error || "Mahsulot o'chirishda xatolik";
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            className="max-w-[500px] p-6 lg:p-10"
        >
            <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 mb-4">
                    <svg
                        className="h-6 w-6 text-red-600 dark:text-red-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                        />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Mahsulotni o'chirish
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    Siz rostdan ham <strong>"{product.product_name}"</strong>{" "}
                    mahsulotini o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.
                </p>
                <div className="flex justify-center gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-md border border-gray-300 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                        Bekor qilish
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={isLoading}
                        className={`px-4 py-2 rounded-md text-white transition-colors ${
                            isLoading
                                ? "bg-red-400 cursor-not-allowed"
                                : "bg-red-600 hover:bg-red-700"
                        }`}
                    >
                        {isLoading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                O'chirilmoqda...
                            </div>
                        ) : (
                            "O'chirish"
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default DeleteProductModal;
