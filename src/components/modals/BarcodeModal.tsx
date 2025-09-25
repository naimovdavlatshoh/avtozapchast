import React, { useState } from "react";
import CustomModal from "../ui/CustomModal";
import BarcodeGenerator from "../common/BarcodeGenerator";

interface BarcodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    barcodeValue: string;
    productName: string;
}

const BarcodeModal: React.FC<BarcodeModalProps> = ({
    isOpen,
    onClose,
    barcodeValue,
}) => {
    const [isPrinting, setIsPrinting] = useState(false);

    const handlePrint = () => {
        setIsPrinting(true);
        window.print();
        // Pechat tugmasini qayta ko'rsatish uchun qisqa vaqt kutamiz
        setTimeout(() => {
            setIsPrinting(false);
        }, 1000);
    };

    return (
        <CustomModal isOpen={isOpen} onClose={onClose}>
            <div className="p-2">
                {/* Header */}

                {/* Barcode - 40mm x 30mm chek uchun */}
                <div
                    className="barcode-receipt bg-white p-1 rounded-lg mb-2 print:rounded-none print:p-0"
                    style={{
                        width: "40mm",
                        height: "30mm",
                        margin: "0 auto",
                    }}
                >
                    <div className="flex flex-col items-center justify-center h-full">
                        <BarcodeGenerator
                            value={barcodeValue}
                            width={2.5}
                            height={80}
                            displayValue={true}
                            fontSize={10}
                            margin={5}
                        />
                    </div>
                </div>

                {/* Actions */}
                {!isPrinting && (
                    <div className="flex justify-center gap-3 print:hidden">
                        <button
                            onClick={handlePrint}
                            className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center font-medium shadow-md hover:shadow-lg"
                            title="Chop etish"
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
                                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                                />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
        </CustomModal>
    );
};

export default BarcodeModal;
