import React, { useEffect } from "react";

interface CustomModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

const CustomModal: React.FC<CustomModalProps> = ({
    isOpen,
    onClose,
    children,
}) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }

        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black bg-opacity-70 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Modal content */}
            <div className="relative bg-white dark:bg-gray-800 rounded-xl   mx-4 z-[100000]">
                {children}
            </div>
        </div>
    );
};

export default CustomModal;
