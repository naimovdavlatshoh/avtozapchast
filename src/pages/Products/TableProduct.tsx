import React, { useState, useEffect } from "react";
import EditProductModal from "./EditProductModal";
import { GetDataSimpleBlob } from "../../service/data";
import { formatNumber } from "../../utils/numberFormat";

interface Product {
    product_id: number;
    product_name: string;
    total_amount: number;
    last_receipt_price: number;
    selling_price: number;
    barcode: number;
    product_code: string;
    description?: string;
    image_id?: number;
    created_at?: string;
    updated_at?: string;
}

interface TableProductProps {
    products: Product[];
    changeStatus: () => void;
}

const TableProduct: React.FC<TableProductProps> = ({
    products,
    changeStatus,
}) => {
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(
        null
    );
    const [imageUrls, setImageUrls] = useState<{ [key: number]: string }>({});

    const handleEdit = (product: Product) => {
        setSelectedProduct(product);
        setEditModalOpen(true);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("uz-UZ", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Rasm URL larini yuklash
    useEffect(() => {
        const loadImages = async () => {
            const newImageUrls: { [key: number]: string } = {};

            for (const product of products) {
                if (product.image_id && !imageUrls[product.image_id]) {
                    try {
                        const response = await GetDataSimpleBlob(
                            `api/products/image/${product.image_id}`
                        );
                        newImageUrls[product.image_id] =
                            URL.createObjectURL(response);
                    } catch (error) {
                        console.error(
                            `Rasm yuklashda xatolik (ID: ${product.image_id}):`,
                            error
                        );
                    }
                }
            }

            if (Object.keys(newImageUrls).length > 0) {
                setImageUrls((prev) => ({ ...prev, ...newImageUrls }));
            }
        };

        loadImages();
    }, [products, imageUrls]);

    const getImageUrl = (imageId?: number) => {
        if (imageId && imageUrls[imageId]) {
            return imageUrls[imageId];
        }
        return null;
    };

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3">
                                ID
                            </th>
                            <th scope="col" className="px-6 py-3">
                                Rasm
                            </th>
                            <th scope="col" className="px-6 py-3">
                                Mahsulot nomi
                            </th>
                            <th scope="col" className="px-6 py-3">
                                Mahsulot kodi
                            </th>
                            <th scope="col" className="px-6 py-3">
                                Miqdor
                            </th>
                            <th scope="col" className="px-6 py-3">
                                Sotish narxi
                            </th>
                            <th scope="col" className="px-6 py-3">
                                Tavsif
                            </th>
                            <th scope="col" className="px-6 py-3">
                                Yaratilgan sana
                            </th>
                            <th scope="col" className="px-6 py-3">
                                Amallar
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={9}
                                    className="px-6 py-4 text-center text-gray-500"
                                >
                                    Mahsulotlar topilmadi
                                </td>
                            </tr>
                        ) : (
                            products.map((product) => (
                                <tr
                                    key={product.product_id}
                                    className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                                >
                                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                        {product.product_id}
                                    </td>
                                    <td className="px-6 py-4">
                                        {product.image_id ? (
                                            <img
                                                src={
                                                    getImageUrl(
                                                        product.image_id
                                                    ) || ""
                                                }
                                                alt={product.product_name || ""}
                                                className="w-10 h-10 rounded object-cover"
                                                onError={(e) => {
                                                    e.currentTarget.style.display =
                                                        "none";
                                                }}
                                            />
                                        ) : (
                                            <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                                                <span className="text-gray-400 text-xs">
                                                    Rasm yo'q
                                                </span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {product.product_name}
                                    </td>
                                    <td className="px-6 py-4">
                                        {product.product_code}
                                    </td>
                                    <td className="px-6 py-4">
                                        {product.total_amount}
                                    </td>
                                    <td className="px-6 py-4">
                                        {formatNumber(product.selling_price)}{" "}
                                        so'm
                                    </td>
                                    <td className="px-6 py-4 max-w-xs">
                                        <div
                                            className="truncate"
                                            title={product.description || ""}
                                        >
                                            {product.description || "-"}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {formatDate(product.created_at || "")}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() =>
                                                    handleEdit(product)
                                                }
                                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                                                title="Tahrirlash"
                                            >
                                                <svg
                                                    className="w-4 h-4"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                    />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {editModalOpen && selectedProduct && (
                <EditProductModal
                    isOpen={editModalOpen}
                    onClose={() => setEditModalOpen(false)}
                    product={selectedProduct}
                    changeStatus={changeStatus}
                />
            )}
        </div>
    );
};

export default TableProduct;
