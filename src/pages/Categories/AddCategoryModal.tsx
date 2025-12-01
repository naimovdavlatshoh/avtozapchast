import React, { useEffect, useState } from "react";
import { Modal } from "../../components/ui/modal";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import { CreateCategory, UpdateCategory } from "../../service/data";
import { toast } from "react-hot-toast";

interface AddCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    changeStatus: () => void;
    setResponse: (value: string) => void;
    category?: {
        id: number;
        category_name: string;
    } | null;
}

const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
    isOpen,
    onClose,
    changeStatus,
    setResponse,
    category,
}) => {
    const [categoryName, setCategoryName] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (category) {
            setCategoryName(category.category_name || "");
        } else {
            setCategoryName("");
        }
    }, [category, isOpen]);

    const handleSubmit = () => {
        if (!categoryName.trim()) {
            toast.error("Iltimos, kategoriya nomini kiriting.");
            return;
        }

        setIsLoading(true);

        const payload = {
            category_name: categoryName.trim(),
        };

        const apiCall = category
            ? UpdateCategory(category.id, payload)
            : CreateCategory(payload);

        apiCall
            .then((res: any) => {
                if (res?.status === 200 || res?.success) {
                    toast.success(
                        category
                            ? "Kategoriya muvaffaqiyatli yangilandi"
                            : "Kategoriya muvaffaqiyatli qo'shildi"
                    );
                    setCategoryName("");
                    changeStatus();
                    onClose();
                } else {
                    onClose();
                    toast.error("Xatolik yuz berdi");
                }
            })
            .catch((error: any) => {
                onClose();
                const errorMessage =
                    error?.response?.data?.error || "Xatolik yuz berdi";
                setResponse(errorMessage);
                toast.error(errorMessage);
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            className="max-w-[500px] p-6 lg:p-10"
        >
            <h2 className="text-xl font-bold mb-4 dark:text-gray-100">
                {category ? "Kategoriyani tahrirlash" : "Kategoriya qo'shish"}
            </h2>
            <div className="space-y-4">
                <div>
                    <Label htmlFor="categoryName">Kategoriya nomi *</Label>
                    <Input
                        type="text"
                        id="categoryName"
                        placeholder="Kategoriya nomi"
                        value={categoryName}
                        onChange={(e) => setCategoryName(e.target.value)}
                    />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        Bekor qilish
                    </button>
                    <button
                        type="button"
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
                        ) : category ? (
                            "O'zgartirish"
                        ) : (
                            "Saqlash"
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default AddCategoryModal;
