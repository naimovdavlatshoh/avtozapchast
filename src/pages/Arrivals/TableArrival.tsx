import React, { useState } from "react";
import { Modal } from "../../components/ui/modal";
// import { EyeIcon } from "../../icons";
import { formatNumber } from "../../utils/numberFormat";
import { formatDate } from "../../utils/dateFormat";
import { IoEyeSharp } from "react-icons/io5";

interface ArrivalItem {
    arrival_item_id: number;
    arrival_id: number;
    product_id: number;
    product_name: string;
    amount: number;
    receipt_price: number;
    created_at: string;
    updated_at?: string;
    cash_type_text: string;
}

interface Arrival {
    arrival_id: number;
    arrival_number?: string;
    total_price: number;
    cash_type_text: string;
    comments?: string;
    created_at: string;
    updated_at?: string;
    items: ArrivalItem[];
}

interface TableArrivalProps {
    arrivals: Arrival[];
}

const TableArrival: React.FC<TableArrivalProps> = ({ arrivals }) => {
    const [selectedArrival, setSelectedArrival] = useState<Arrival | null>(
        null
    );
    const [isModalOpen, setIsModalOpen] = useState(false);

    // const getTotalAmount = (items: ArrivalItem[]) => {
    //     return items.reduce((total, item) => total + item.amount, 0);
    // };

    const handleViewItems = (arrival: Arrival) => {
        setSelectedArrival(arrival);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedArrival(null);
    };

    return (
        <>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
                <div className="max-w-full overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">
                                    #
                                </th>
                                <th scope="col" className="px-6 py-3">
                                    Kirim raqami
                                </th>
                                {/* <th scope="col" className="px-6 py-3">
                                    Mahsulotlar soni
                                </th>
                                <th scope="col" className="px-6 py-3">
                                    Jami miqdor
                                </th> */}
                                <th scope="col" className="px-6 py-3">
                                    Jami qiymat
                                </th>
                                <th scope="col" className="px-6 py-3">
                                    Mahsulotlar
                                </th>
                                <th scope="col" className="px-6 py-3">
                                    Izoh
                                </th>
                                <th scope="col" className="px-6 py-3">
                                    Yaratilgan sana
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {arrivals.map((arrival, index) => (
                                <tr
                                    key={arrival.arrival_id}
                                    className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                                >
                                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                        {index + 1}
                                    </td>
                                    <td className="px-6 py-4">
                                        {arrival.arrival_number || "N/A"}
                                    </td>
                                    {/* <td className="px-6 py-4">
                                        {arrival.items.length}
                                    </td>
                                    <td className="px-6 py-4">
                                        {getTotalAmount(arrival.items)}
                                    </td> */}
                                    <td className="px-6 py-4">
                                        {formatNumber(arrival.total_price)}{" "}
                                        {arrival.cash_type_text}
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() =>
                                                handleViewItems(arrival)
                                            }
                                            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                                        >
                                            <IoEyeSharp className="w-4 h-4" />
                                            Ko'rish
                                        </button>
                                    </td>
                                    <td className="px-6 py-4">
                                        {arrival.comments || "N/A"}
                                    </td>
                                    <td className="px-6 py-4">
                                        {formatDate(arrival.created_at)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mahsulotlar modal */}
            <Modal isOpen={isModalOpen} onClose={closeModal}>
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-gray-900">
                            Mahsulotlar ro'yxati
                        </h2>
                        <button
                            onClick={closeModal}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>

                    {selectedArrival && (
                        <div className="space-y-4">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="font-medium text-gray-700">
                                            Kirim raqami:
                                        </span>
                                        <p className="text-gray-900">
                                            {selectedArrival.arrival_number ||
                                                "N/A"}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">
                                            Jami qiymat:
                                        </span>
                                        <p className="text-gray-900">
                                            {formatNumber(
                                                selectedArrival.total_price
                                            )}{" "}
                                            {selectedArrival.cash_type_text}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">
                                            Mahsulotlar soni:
                                        </span>
                                        <p className="text-gray-900">
                                            {selectedArrival.items.length}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">
                                            Yaratilgan sana:
                                        </span>
                                        <p className="text-gray-900">
                                            {formatDate(
                                                selectedArrival.created_at
                                            )}
                                        </p>
                                    </div>
                                </div>
                                {selectedArrival.comments && (
                                    <div className="mt-4">
                                        <span className="font-medium text-gray-700">
                                            Izoh:
                                        </span>
                                        <p className="text-gray-900 mt-1">
                                            {selectedArrival.comments}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-gray-500">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3">#</th>
                                            <th className="px-4 py-3">
                                                Mahsulot nomi
                                            </th>
                                            <th className="px-4 py-3">
                                                Miqdor
                                            </th>
                                            <th className="px-4 py-3">
                                                Kirim narxi
                                            </th>
                                            <th className="px-4 py-3">Jami</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedArrival.items.map(
                                            (item, index) => (
                                                <tr
                                                    key={item.arrival_item_id}
                                                    className="bg-white border-b hover:bg-gray-50"
                                                >
                                                    <td className="px-4 py-3 font-medium text-gray-900">
                                                        {index + 1}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-900">
                                                        {item.product_name}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-900">
                                                        {item.amount}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-900">
                                                        {
                                                            item.receipt_price
                                                        }{" "}
                                                        {
                                                            selectedArrival.cash_type_text
                                                        }
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-900 font-medium">
                                                        {formatNumber(
                                                            item.amount *
                                                                item.receipt_price
                                                        )}{" "}
                                                        {
                                                            selectedArrival.cash_type_text
                                                        }
                                                    </td>
                                                </tr>
                                            )
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        </>
    );
};

export default TableArrival;
