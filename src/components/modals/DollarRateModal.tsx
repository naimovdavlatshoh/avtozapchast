import { useState, useEffect } from "react";
import { Modal } from "../ui/modal";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Button from "../ui/button/Button";
import { PostDataTokenJson } from "../../service/data";
import toast from "react-hot-toast";
import { formatNumber } from "../../utils/numberFormat";

interface DollarRateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    currentRate: number;
}

export default function DollarRateModal({
    isOpen,
    onClose,
    onSuccess,
    currentRate,
}: DollarRateModalProps) {
    const [newRate, setNewRate] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setNewRate(currentRate.toString());
        }
    }, [isOpen, currentRate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newRate || parseFloat(newRate) <= 0) {
            toast.error("To'g'ri kurs qiymatini kiriting!");
            return;
        }

        setIsLoading(true);
        try {
            const response = await PostDataTokenJson(
                "api/arrival/dollarcreate",
                {
                    dollar_rate: parseFloat(newRate),
                }
            );

            if (response?.status === 200) {
                toast.success("Dollar kursi muvaffaqiyatli yangilandi!");
                onSuccess();
            } else {
                toast.error("Kurs yangilashda xatolik!");
            }
        } catch (error) {
            console.error("Kurs yangilashda xatolik:", error);
            toast.error("Kurs yangilashda xatolik!");
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setNewRate("");
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose}>
            <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">
                    Dollar kursini yangilash
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="currentRate">Joriy kurs</Label>
                        <Input
                            id="currentRate"
                            type="text"
                            value={formatNumber(currentRate)}
                            disabled
                            className="bg-gray-100"
                        />
                    </div>

                    <div>
                        <Label htmlFor="newRate">Yangi kurs (UZS)</Label>
                        <Input
                            id="newRate"
                            type="text"
                            value={newRate}
                            onChange={(e) => {
                                const value = e.target.value.replace(
                                    /[^\d.]/g,
                                    ""
                                );

                                // Faqat bitta nuqta ruxsat berish
                                const parts = value.split(".");
                                if (parts.length > 2) return;

                                // Nuqta dan keyin maksimal 2 ta raqam
                                if (parts[1] && parts[1].length > 2) return;

                                setNewRate(value);
                            }}
                            placeholder="Yangi kurs qiymatini kiriting"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            onClick={handleClose}
                            variant="outline"
                            className="px-4 py-2"
                        >
                            Bekor qilish
                        </Button>
                        <Button
                            type="submit"
                            disabled={
                                isLoading ||
                                !newRate ||
                                parseFloat(newRate) <= 0
                            }
                            className={`px-4 py-2 ${
                                isLoading ||
                                !newRate ||
                                parseFloat(newRate) <= 0
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-blue-500 hover:bg-blue-600"
                            }`}
                        >
                            {isLoading ? "Yuklanmoqda..." : "Yangilash"}
                        </Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
