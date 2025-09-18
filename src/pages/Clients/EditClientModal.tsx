import React, { useEffect, useState } from "react";
import { Modal } from "../../components/ui/modal";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import { PostDataTokenJson } from "../../service/data";
import { toast } from "react-hot-toast";

interface EditClientModalProps {
    client: any;
    isOpen: boolean;
    onClose: () => void;
    changeStatus: () => void;
    setResponse: (value: string) => void;
}

const EditClientModal: React.FC<EditClientModalProps> = ({
    isOpen,
    onClose,
    changeStatus,
    setResponse,
    client,
}) => {
    const [clientName, setClientName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [carNumber, setCarNumber] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Клиент данных загрузки
    useEffect(() => {
        if (client) {
            setClientName(client?.client_name || "");
            setPhoneNumber(client?.phone_number || "");
            setCarNumber(client?.car_number || "");
        }
    }, [client]);

    const handleSubmit = () => {
        if (!clientName || !phoneNumber) {
            alert("Пожалуйста, заполните обязательные поля.");
            return;
        }

        setIsLoading(true);

        const payload: any = {
            client_name: clientName,
            phone_number: phoneNumber,
        };

        // Если номер машины указан, добавляем его
        if (carNumber.trim()) {
            payload.car_number = carNumber;
        }

        PostDataTokenJson(`api/clients/update/${client?.client_id}`, payload)
            .then((res: any) => {
                if (res?.status === 200 || res?.success) {
                    toast.success("Клиент успешно обновлен");
                    changeStatus();
                    onClose();
                    console.log("Обновлено успешно");
                } else {
                    toast.error("Ошибка при обновлении клиента");
                }
            })
            .catch((error: any) => {
                console.error("Ошибка:", error);
                const errorMessage =
                    error?.response?.data?.error || "Произошла ошибка";
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
            className="max-w-[700px] p-6 lg:p-10"
        >
            <h2 className="text-xl font-bold mb-4 dark:text-gray-100">
                Редактировать клиента
            </h2>
            <div className="space-y-4">
                <div>
                    <Label htmlFor="clientName">Введите имя клиента *</Label>
                    <Input
                        type="text"
                        id="clientName"
                        placeholder="Имя клиента"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                    />
                </div>
                <div>
                    <Label htmlFor="phoneNumber">
                        Введите номер телефона *
                    </Label>
                    <Input
                        type="text"
                        id="phoneNumber"
                        placeholder="Номер телефона"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                </div>
                <div>
                    <Label htmlFor="carNumber">Введите номер машины</Label>
                    <Input
                        type="text"
                        id="carNumber"
                        placeholder="Номер машины (необязательно)"
                        value={carNumber}
                        onChange={(e) => setCarNumber(e.target.value)}
                    />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        Отмена
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
                                Сохранение...
                            </div>
                        ) : (
                            "Сохранить изменения"
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default EditClientModal;
