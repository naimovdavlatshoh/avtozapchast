import React from "react";
import { Modal } from "../../components/ui/modal";

interface DeleteClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDelete: () => void;
    clientName: string;
    isDeleting: boolean;
}

const DeleteClientModal: React.FC<DeleteClientModalProps> = ({
    isOpen,
    onClose,
    onDelete,
    clientName,
    isDeleting,
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            className="max-w-[500px] p-6 lg:p-8"
        >
            <h2 className="text-xl font-bold mb-4 dark:text-gray-100">
                Удалить клиента
            </h2>

            <div className="mb-6">
                <p className="text-gray-700 dark:text-gray-300">
                    Вы уверены, что хотите удалить клиента{" "}
                    <span className="font-semibold">"{clientName}"</span>?
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Это действие нельзя отменить.
                </p>
            </div>

            <div className="flex justify-end gap-2">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={isDeleting}
                    className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                    Отмена
                </button>
                <button
                    type="button"
                    onClick={onDelete}
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
                            Удаление...
                        </div>
                    ) : (
                        "Удалить"
                    )}
                </button>
            </div>
        </Modal>
    );
};

export default DeleteClientModal;
