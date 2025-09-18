import { useState, useEffect } from "react";
import { Modal } from "../../components/ui/modal";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Button from "../../components/ui/button/Button";
import Select from "../../components/form/Select";
import {
    PostDataTokenJson,
    GetDataSimple,
    PostSimple,
} from "../../service/data";
import toast from "react-hot-toast";
import Loader from "../../components/ui/loader/Loader";
import { formatNumber } from "../../utils/numberFormat";

interface Product {
    product_id: number;
    product_name: string;
    barcode?: string;
}

interface ArrivalItem {
    product_id: number;
    amount: number;
    receipt_price: number;
    selling_price: number;
}

interface AddArrivalModalProps {
    isOpen: boolean;
    onClose: () => void;
    changeStatus: () => void;
    setResponse: (response: string) => void;
}

export default function AddArrivalModal({
    isOpen,
    onClose,
    changeStatus,
    setResponse,
}: AddArrivalModalProps) {
    const [arrivalNumber, setArrivalNumber] = useState("");
    const [comments, setComments] = useState("");
    const [items, setItems] = useState<ArrivalItem[]>([
        { product_id: 0, amount: 0, receipt_price: 0, selling_price: 0 },
    ]);
    const [searchingProducts, setSearchingProducts] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchProducts();
        }
    }, [isOpen]);

    const fetchProducts = async () => {
        try {
            const res = await GetDataSimple(
                "api/products/list?page=1&limit=100"
            );
            setProducts(res?.result || []);
        } catch (error) {
            console.error("Mahsulotlarni yuklashda xatolik:", error);
            toast.error("Mahsulotlarni yuklashda xatolik");
        }
    };

    const searchProducts = async (keyword: string) => {
        if (!keyword.trim()) {
            fetchProducts();
            return;
        }

        setSearchingProducts(true);
        try {
            const res = await PostSimple(
                `api/products/search?keyword=${encodeURIComponent(keyword)}`
            );
            setProducts(res?.data?.result || []);
        } catch (error) {
            console.error("Mahsulotlarni qidirishda xatolik:", error);
            toast.error("Mahsulotlarni qidirishda xatolik");
        } finally {
            setSearchingProducts(false);
        }
    };

    // Mahsulot tanlanganda search inputni tozalash
    const handleProductSelect = (value: string, index: number) => {
        updateItem(index, "product_id", parseInt(value));
        // Search inputni tozalash uchun barcha mahsulotlarni qayta yuklash
        // Lekin faqat search qilingan bo'lsa
        if (products.length > 0 && products[0].product_id !== 0) {
            fetchProducts();
        }
    };

    const addItem = () => {
        setItems([
            ...items,
            { product_id: 0, amount: 0, receipt_price: 0, selling_price: 0 },
        ]);
    };

    const removeItem = (index: number) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    const updateItem = (
        index: number,
        field: keyof ArrivalItem,
        value: any
    ) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        const validItems = items.filter(
            (item) =>
                item.product_id > 0 &&
                item.amount > 0 &&
                item.receipt_price > 0 &&
                item.selling_price > 0
        );

        if (validItems.length === 0) {
            toast.error("Kamida bitta to'liq mahsulot qo'shing!");
            return;
        }

        setIsLoading(true);
        try {
            const data = {
                arrival_number: arrivalNumber || undefined,
                comments: comments || undefined,
                items: validItems,
            };

            const response = await PostDataTokenJson(
                "api/arrival/create",
                data
            );
            setResponse(JSON.stringify(response));
            toast.success("Kirim muvaffaqiyatli qo'shildi!");
            changeStatus();
            onClose();
            resetForm();
        } catch (error) {
            console.error("Kirim qo'shishda xatolik:", error);
            toast.error("Kirim qo'shishda xatolik");
            onClose();
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setArrivalNumber("");
        setComments("");
        setItems([
            { product_id: 0, amount: 0, receipt_price: 0, selling_price: 0 },
        ]);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            className="max-w-4xl max-h-[90vh] overflow-y-auto"
        >
            <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">
                    Yangi kirim qo'shish
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="arrivalNumber">Kirim raqami</Label>
                        <Input
                            id="arrivalNumber"
                            type="text"
                            value={arrivalNumber}
                            onChange={(e) => setArrivalNumber(e.target.value)}
                            placeholder="INV-123456"
                        />
                    </div>

                    <div>
                        <Label htmlFor="comments">Izoh</Label>
                        <textarea
                            id="comments"
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            placeholder="Izoh..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={3}
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <Label>Mahsulotlar ({items.length})</Label>
                            <Button
                                type="button"
                                onClick={addItem}
                                className="bg-green-500 hover:bg-green-600 text-sm px-3 py-1"
                            >
                                + Qo'shish
                            </Button>
                        </div>

                        <div className="space-y-2 min-h-52 max-h-80 overflow-y-auto pr-2">
                            {items.map((item, index) => (
                                <div
                                    key={index}
                                    className="border border-gray-200 rounded-lg p-3 bg-gray-50"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                                        <div className="col-span-2">
                                            <Label className="text-xs">
                                                Mahsulot
                                            </Label>
                                            <Select
                                                defaultValue={
                                                    item.product_id?.toString() ||
                                                    ""
                                                }
                                                onChange={(value: string) =>
                                                    handleProductSelect(
                                                        value,
                                                        index
                                                    )
                                                }
                                                options={products.map(
                                                    (product) => ({
                                                        value: product.product_id,
                                                        label: `${product.product_name}`,
                                                    })
                                                )}
                                                placeholder="Tanlang"
                                                searchable={true}
                                                onSearch={searchProducts}
                                                searching={searchingProducts}
                                            />
                                        </div>

                                        <div>
                                            <Label className="text-xs">
                                                Miqdor
                                            </Label>
                                            <Input
                                                type="text"
                                                value={
                                                    item.amount
                                                        ? formatNumber(
                                                              item.amount
                                                          )
                                                        : ""
                                                }
                                                onChange={(e) => {
                                                    const value =
                                                        e.target.value.replace(
                                                            /\s/g,
                                                            ""
                                                        );
                                                    updateItem(
                                                        index,
                                                        "amount",
                                                        parseInt(value) || 0
                                                    );
                                                }}
                                                placeholder="Miqdor"
                                            />
                                        </div>

                                        <div>
                                            <Label className="text-xs">
                                                Kirim narxi
                                            </Label>
                                            <Input
                                                type="text"
                                                value={
                                                    item.receipt_price
                                                        ? formatNumber(
                                                              item.receipt_price
                                                          )
                                                        : ""
                                                }
                                                onChange={(e) => {
                                                    const value =
                                                        e.target.value.replace(
                                                            /\s/g,
                                                            ""
                                                        );
                                                    updateItem(
                                                        index,
                                                        "receipt_price",
                                                        parseFloat(value) || 0
                                                    );
                                                }}
                                                placeholder="Kirim narxi"
                                            />
                                        </div>

                                        <div>
                                            <Label className="text-xs">
                                                Sotish narxi
                                            </Label>
                                            <Input
                                                type="text"
                                                value={
                                                    item.selling_price
                                                        ? formatNumber(
                                                              item.selling_price
                                                          )
                                                        : ""
                                                }
                                                onChange={(e) => {
                                                    const value =
                                                        e.target.value.replace(
                                                            /\s/g,
                                                            ""
                                                        );
                                                    updateItem(
                                                        index,
                                                        "selling_price",
                                                        parseFloat(value) || 0
                                                    );
                                                }}
                                                placeholder="Sotish narxi"
                                            />
                                        </div>
                                    </div>

                                    {/* Tugma */}
                                    <div className="flex justify-end mt-2">
                                        {items.length > 1 && (
                                            <Button
                                                type="button"
                                                onClick={() =>
                                                    removeItem(index)
                                                }
                                                className="bg-red-500 hover:bg-red-600 text-xs px-2 py-1"
                                            >
                                                ✕
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            onClick={handleClose}
                            variant="outline"
                        >
                            Bekor qilish
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="bg-blue-500 hover:bg-blue-600"
                        >
                            {isLoading ? <Loader /> : "Kirim qo'shish"}
                        </Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
