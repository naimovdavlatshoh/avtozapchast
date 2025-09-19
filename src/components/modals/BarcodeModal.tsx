import React from "react";
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
    const handlePrint = () => {
        window.print();
    };

    return (
        <CustomModal isOpen={isOpen} onClose={onClose}>
            <div className="p-2">
                {/* Header */}

                {/* Barcode */}
                <div className="bg-white p-6 rounded-lg  mb-2">
                    <div className="flex justify-center">
                        <BarcodeGenerator
                            value={barcodeValue}
                            width={2}
                            height={120}
                            displayValue={true}
                            fontSize={16}
                            margin={15}
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-center gap-3">
                    <button
                        onClick={handlePrint}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium shadow-md hover:shadow-lg"
                    >
                        <svg
                            className="w-5 h-5"
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
                        Chop etish
                    </button>
                </div>
            </div>
        </CustomModal>
    );
};

export default BarcodeModal;
