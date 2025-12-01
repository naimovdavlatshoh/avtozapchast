import React from "react";
import { Modal } from "../../components/ui/modal";

interface DeleteCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    categoryName: string;
    isDeleting: boolean;
}

const DeleteCategoryModal: React.FC<DeleteCategoryModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    categoryName,
    isDeleting,
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            className="max-w-[400px] p-6 lg:p-10"
        >
            <h2 className="text-xl font-bold mb-4 dark:text-gray-100 text-red-600">
                Kategoriyani o'chirish
            </h2>
            <div className="space-y-4">
                <p className="text-gray-700 dark:text-gray-300">
                    Siz rostdan ham{" "}
                    <span className="font-semibold text-red-600">
                        "{categoryName}"
                    </span>{" "}
                    kategoriyasini o'chirmoqchimisiz?
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Bu amalni qaytarib bo'lmaydi.
                </p>

                <div className="flex justify-end gap-2 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isDeleting}
                        className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                        Bekor qilish
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className={`px-4 py-2 rounded-md text-white transition-colors ${
                            isDeleting
                                ? "bg-red-400 cursor-not-allowed"
                                : "bg-red-600 hover:bg-red-700"
                        }`}
                    >
                        {isDeleting ? (
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

export default DeleteCategoryModal;
