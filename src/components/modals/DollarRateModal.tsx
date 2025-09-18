import { useState } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import InputField from "../form/input/InputField";
import TextArea from "../form/input/TextArea";
import Label from "../form/Label";
import { PostDataTokenJson } from "../../service/data";
import toast from "react-hot-toast";

interface DollarRateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    currentRate?: number;
}

export default function DollarRateModal({
    isOpen,
    onClose,
    onSuccess,
    currentRate = 0,
}: DollarRateModalProps) {
    const [formData, setFormData] = useState({
        dollar_rate: currentRate.toString(),
        comments: "",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<{
        dollar_rate?: string;
    }>({});

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        const newErrors: { dollar_rate?: string } = {};

        if (!formData.dollar_rate.trim()) {
            newErrors.dollar_rate = "Курс доллара обязателен";
        } else if (
            isNaN(Number(formData.dollar_rate)) ||
            Number(formData.dollar_rate) <= 0
        ) {
            newErrors.dollar_rate = "Введите корректный курс доллара";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsLoading(true);
        try {
            await PostDataTokenJson("api/payments/dollarcreate", {
                dollar_rate: Number(formData.dollar_rate),
                comments: formData.comments.trim() || undefined,
            });

            toast.success("Курс доллара успешно обновлен");
            onSuccess();
            onClose();

            // Reset form
            setFormData({
                dollar_rate: "",
                comments: "",
            });
            setErrors({});
        } catch (error) {
            console.error("Error updating dollar rate:", error);
            toast.error("Ошибка при обновлении курса доллара");
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        if (!isLoading) {
            onClose();
            setErrors({});
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose}>
            <div className="p-6">
                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        Изменить курс доллара
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Текущий курс:{" "}
                        <span className="font-medium">{currentRate} сум</span>
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Dollar Rate */}
                    <div>
                        <Label htmlFor="dollar_rate">
                            Новый курс доллара{" "}
                            <span className="text-red-500">*</span>
                        </Label>
                        <InputField
                            id="dollar_rate"
                            type="number"
                            placeholder="Введите курс доллара"
                            value={formData.dollar_rate}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    dollar_rate: e.target.value,
                                })
                            }
                            error={!!errors.dollar_rate}
                        />
                        {errors.dollar_rate && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                {errors.dollar_rate}
                            </p>
                        )}
                    </div>

                    {/* Comments */}
                    <div>
                        <Label htmlFor="comments">Комментарий</Label>
                        <TextArea
                            placeholder="Введите комментарий (не обязательно)"
                            value={formData.comments}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    comments: e.target.value,
                                })
                            }
                            rows={3}
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isLoading}
                        >
                            Отмена
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="min-w-[100px]"
                        >
                            {isLoading ? (
                                <div className="flex items-center space-x-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Сохранение...</span>
                                </div>
                            ) : (
                                "Обновить"
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
