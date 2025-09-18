import { useState } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import DatePicker from "../form/date-picker";
import Select from "../form/Select";
import TextArea from "../form/input/TextArea";
import Label from "../form/Label";

interface ReturnModalProps {
    isOpen: boolean;
    onClose: () => void;
    onReturn: (data: ReturnData) => Promise<void>;
    itemId: number;
    itemName: string;
}

interface ReturnData {
    condition_type: string;
    return_date: string;
    condition_note?: string;
}

const conditionOptions = [
    { value: 1, label: "Новое" },
    { value: 2, label: "Среднее" },
    { value: 3, label: "Старое" },
];

export default function ReturnModal({
    isOpen,
    onClose,
    onReturn,
    itemId,
    itemName,
}: ReturnModalProps) {
    const [formData, setFormData] = useState<ReturnData>({
        condition_type: "1",
        return_date: new Date().toISOString().split("T")[0],
        condition_note: "",
    });
    console.log(itemId);

    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Partial<ReturnData>>({});

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        const newErrors: Partial<ReturnData> = {};
        if (!formData.return_date) {
            newErrors.return_date = "Дата возврата обязательна";
        }
        if (!formData.condition_type) {
            newErrors.condition_type = "Тип состояния обязателен";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsLoading(true);
        try {
            await onReturn(formData);
            onClose();
            // Reset form
            setFormData({
                condition_type: "1",
                return_date: new Date().toISOString().split("T")[0],
                condition_note: "",
            });
            setErrors({});
        } catch (error) {
            console.error("Error returning item:", error);
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
                        Возврат материала
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Материал:{" "}
                        <span className="font-medium">{itemName}</span>
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Condition Type */}
                    <div>
                        <Label htmlFor="condition_type">
                            Тип состояния{" "}
                            <span className="text-red-500">*</span>
                        </Label>
                        <Select
                            options={conditionOptions}
                            placeholder="Выберите тип состояния"
                            onChange={(value) =>
                                setFormData({
                                    ...formData,
                                    condition_type: value.toString(),
                                })
                            }
                            defaultValue={formData.condition_type.toString()}
                        />
                        {errors.condition_type && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                {errors.condition_type}
                            </p>
                        )}
                    </div>

                    {/* Return Date */}
                    <div>
                        <DatePicker
                            id="return_date"
                            label="Дата возврата"
                            defaultDate={formData.return_date}
                            onChange={(selectedDates) => {
                                if (selectedDates.length > 0) {
                                    const date = selectedDates[0];
                                    // Format date to avoid timezone issues
                                    const year = date.getFullYear();
                                    const month = String(
                                        date.getMonth() + 1
                                    ).padStart(2, "0");
                                    const day = String(date.getDate()).padStart(
                                        2,
                                        "0"
                                    );
                                    setFormData({
                                        ...formData,
                                        return_date: `${year}-${month}-${day}`,
                                    });
                                }
                            }}
                            placeholder="Выберите дату возврата"
                        />
                        {errors.return_date && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                {errors.return_date}
                            </p>
                        )}
                    </div>

                    {/* Condition Note */}
                    <div>
                        <Label htmlFor="condition_note">
                            Примечание о состоянии
                        </Label>
                        <TextArea
                            // id prop removed to fix lint error
                            placeholder="Введите примечание о состоянии материала (не обязательно)"
                            value={formData.condition_note}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    condition_note: e.target.value,
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
                                "Возврат"
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
