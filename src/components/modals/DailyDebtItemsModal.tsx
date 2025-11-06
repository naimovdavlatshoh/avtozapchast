import React from "react";

type DailyDebtItem = {
    daily_debt_item_id: number;
    daily_debt_id: number;
    product_id: number;
    product_name: string;
    barcode: number;
    product_code: string;
    amount: number;
    selling_price: number;
    selling_price_usd: string;
};

interface DailyDebtItemsModalProps {
    isOpen: boolean;
    onClose: () => void;
    items: DailyDebtItem[];
}

const DailyDebtItemsModal: React.FC<DailyDebtItemsModalProps> = ({
    isOpen,
    onClose,
    items,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-lg w-full max-w-3xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Mahsulotlar</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr className="text-left text-sm text-gray-600 dark:text-gray-300">
                                <th className="py-2 px-3">#</th>
                                <th className="py-2 px-3">Nomi</th>
                                <th className="py-2 px-3">Barcode</th>
                                <th className="py-2 px-3">Kod</th>
                                <th className="py-2 px-3">Soni</th>
                                <th className="py-2 px-3">Narxi (so'm)</th>
                                <th className="py-2 px-3">Narxi ($)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((it, idx) => (
                                <tr
                                    key={it.daily_debt_item_id}
                                    className="border-t border-gray-200 dark:border-gray-800 text-sm"
                                >
                                    <td className="py-2 px-3">{idx + 1}</td>
                                    <td className="py-2 px-3">
                                        {it.product_name}
                                    </td>
                                    <td className="py-2 px-3">{it.barcode}</td>
                                    <td className="py-2 px-3">
                                        {it.product_code}
                                    </td>
                                    <td className="py-2 px-3">{it.amount}</td>
                                    <td className="py-2 px-3">
                                        {it.selling_price.toLocaleString()}
                                    </td>
                                    <td className="py-2 px-3">
                                        {it.selling_price_usd}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DailyDebtItemsModal;
