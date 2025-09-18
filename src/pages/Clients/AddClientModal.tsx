// components/modals/AddClientModal.tsx

import React, { useState } from "react";
import { Modal } from "../../components/ui/modal";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import { PostDataTokenJson } from "../../service/data";
import { toast } from "react-hot-toast";

interface AddClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    changeStatus: () => void;
    setResponse: (value: string) => void;
}

const AddClientModal: React.FC<AddClientModalProps> = ({
    isOpen,
    onClose,
    changeStatus,
    setResponse,
}) => {
    const [clientName, setClientName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [carNumber, setCarNumber] = useState("");
    const [isLoading, setIsLoading] = useState(false);

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

        PostDataTokenJson("api/clients/create", payload)
            .then((res: any) => {
                if (res?.status === 200 || res?.success) {
                    toast.success("Mijoz muvaffaqiyatli qo'shildi");
                    setClientName("");
                    setPhoneNumber("");
                    setCarNumber("");
                    changeStatus();
                    onClose();
                    // console.log("добавлено");
                } else {
                }
            })
            .catch((error: any) => {
                onClose();
                setResponse(error.response.data.error);
                toast.error(error.response.data.error);
                setClientName("");
                setPhoneNumber("");
                setCarNumber("");
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
                Mijoz qo'shish
            </h2>
            <div className="space-y-4">
                <div>
                    <Label htmlFor="clientName">Mijozning ismi *</Label>
                    <Input
                        type="text"
                        id="clientName"
                        placeholder="Mijozning ismi"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                    />
                </div>
                <div>
                    <Label htmlFor="phoneNumber">Telefon raqami *</Label>
                    <Input
                        type="text"
                        id="phoneNumber"
                        placeholder="Telefon raqami"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                </div>
                <div>
                    <Label htmlFor="carNumber">Mashina raqami</Label>
                    <Input
                        type="text"
                        id="carNumber"
                        placeholder="Mashina raqami"
                        value={carNumber}
                        onChange={(e) => setCarNumber(e.target.value)}
                    />
                </div>

                <div className="flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-md border border-gray-300 dark:text-gray-100"
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

export default AddClientModal;
