import { useEffect, useState, useRef } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import { GetDataSimple, PostSimple } from "../../service/data";
import { useModal } from "../../hooks/useModal";

import Pagination from "../../components/common/Pagination.tsx";
import { Toaster } from "react-hot-toast";
import Loader from "../../components/ui/loader/Loader.tsx";
import Input from "../../components/form/input/InputField";
import TableProduct from "./TableProduct.tsx";
import AddProductModal from "./AddProductModal.tsx";
import { MdClear } from "react-icons/md";

export default function ProductList() {
    const [products, setProducts] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchKeyword, setSearchKeyword] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const { isOpen, openModal, closeModal } = useModal();
    const [status, setStatus] = useState(false);
    const [tableLoading, setTableLoading] = useState(false);

    // Barcode scanner uchun
    const [barcodeInput, setBarcodeInput] = useState("");
    const barcodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchProducts();
    }, [page, status]);

    // Barcode scanner event listener
    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            // Agar input yoki textarea focus bo'lsa, barcode scanner ishlamasin
            const activeElement = document.activeElement as HTMLElement;
            if (
                activeElement &&
                (activeElement.tagName === "INPUT" ||
                    activeElement.tagName === "TEXTAREA" ||
                    activeElement.contentEditable === "true")
            ) {
                return;
            }

            // Enter tugmasini tekshirish
            if (event.key === "Enter") {
                if (barcodeInput.trim().length > 0) {
                    // Barcode to'liq bo'lsa, search qilish
                    setSearchKeyword(barcodeInput.trim());
                    handleSearchWithKeyword(barcodeInput.trim());
                    setBarcodeInput("");

                    // Search inputga focus qilish
                    if (searchInputRef.current) {
                        searchInputRef.current.focus();
                    }
                }
            } else if (event.key.length === 1) {
                // Faqat harflar va raqamlar qo'shiladi (barcode scanner uchun)
                setBarcodeInput((prev) => prev + event.key);

                // Timeout ni tozalash
                if (barcodeTimeoutRef.current) {
                    clearTimeout(barcodeTimeoutRef.current);
                }

                // 200ms dan keyin barcode inputni tozalash (scanner tez yozsa)
                barcodeTimeoutRef.current = setTimeout(() => {
                    setBarcodeInput("");
                }, 200);
            }
        };

        // Global keydown event listener qo'shish
        document.addEventListener("keydown", handleKeyPress);

        // Cleanup function
        return () => {
            document.removeEventListener("keydown", handleKeyPress);
            if (barcodeTimeoutRef.current) {
                clearTimeout(barcodeTimeoutRef.current);
            }
        };
    }, [barcodeInput]);

    const fetchProducts = async () => {
        setTableLoading(true);
        try {
            const res = await GetDataSimple(
                `api/products/list?page=${page}&limit=30`
            );
            setProducts(res?.result || []);
            setTotalPages(res?.pages || 1);
        } catch (error) {
            console.error("Mahsulotlarni yuklashda xatolik:", error);
        } finally {
            setTableLoading(false);
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchKeyword(value);

        // 3 ta harfdan ko'p bo'lsa darhol qidirish
        if (value.trim().length > 3) {
            handleSearchWithKeyword(value);
        } else if (value.trim().length === 0) {
            // Input bo'sh bo'lsa asosiy ro'yxatni ko'rsatish
            setIsSearching(false);
            fetchProducts();
        }
    };

    const handleSearchWithKeyword = async (keyword: string) => {
        setTableLoading(true);
        setIsSearching(true);
        try {
            const res = await PostSimple(
                `api/products/search?keyword=${encodeURIComponent(keyword)}`
            );
            setProducts(res?.data?.result || []);
            setTotalPages(1); // Search natijalari uchun pagination yo'q
        } catch (error) {
            console.error("Qidiruvda xatolik:", error);
        } finally {
            setTableLoading(false);
        }
    };

    const changeStatus = () => {
        setStatus(!status);
    };

    return (
        <>
            <PageBreadcrumb pageTitle="Mahsulotlar" />
            <div className="space-y-6">
                <ComponentCard
                    title="Mahsulotlar"
                    desc={
                        <div className="flex gap-4 items-center">
                            <div className="flex gap-2">
                                <div className="relative">
                                    <Input
                                        ref={searchInputRef}
                                        type="text"
                                        placeholder="Mahsulot qidirish... (3+ harf) yoki barcode scanner"
                                        value={searchKeyword}
                                        onChange={handleSearchChange}
                                        className="w-64"
                                    />
                                    {barcodeInput && (
                                        <div className="absolute -top-8 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                                            Scanner: {barcodeInput}
                                        </div>
                                    )}
                                </div>
                                {isSearching && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearchKeyword("");
                                            setIsSearching(false);
                                            fetchProducts();
                                        }}
                                        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                                    >
                                        <MdClear />
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={openModal}
                                className="bg-blue-500 text-white px-5 py-3 rounded-md hover:bg-blue-600"
                            >
                                + Mahsulot qo'shish
                            </button>
                        </div>
                    }
                >
                    {tableLoading ? (
                        <div className="flex justify-center items-center py-8">
                            <Loader />
                        </div>
                    ) : (
                        <TableProduct
                            products={products}
                            changeStatus={changeStatus}
                        />
                    )}
                    {!isSearching && (
                        <div className="mt-4">
                            <Pagination
                                currentPage={page}
                                totalPages={totalPages}
                                onPageChange={setPage}
                            />
                        </div>
                    )}
                </ComponentCard>
            </div>

            <AddProductModal
                isOpen={isOpen}
                onClose={closeModal}
                changeStatus={changeStatus}
                setResponse={() => {}}
            />
            <Toaster position="top-right" reverseOrder={false} />
        </>
    );
}
