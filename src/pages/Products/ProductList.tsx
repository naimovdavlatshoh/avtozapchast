import { useEffect, useState, useRef } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import {
    GetDataSimple,
    PostSimple,
    GetCategoriesList,
    SearchCategories,
} from "../../service/data";
import { useModal } from "../../hooks/useModal";

import Pagination from "../../components/common/Pagination.tsx";
import { Toaster } from "react-hot-toast";
import Loader from "../../components/ui/loader/Loader.tsx";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
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
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
    const [categoryOptions, setCategoryOptions] = useState<
        { value: number; label: string }[]
    >([]);
    const [isSearchingCategories, setIsSearchingCategories] = useState(false);

    // Barcode scanner uchun
    const [barcodeInput, setBarcodeInput] = useState("");
    const barcodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Fetch categories on mount
    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [page, status, selectedCategoryId]);

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

    const fetchCategories = async (page: number = 1) => {
        try {
            const response = await GetCategoriesList(page, 50);
            if (response?.result) {
                const options = response.result.map((cat: any) => ({
                    value: cat.id || cat.category_id,
                    label: cat.category_name,
                }));
                setCategoryOptions(options);
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    const handleCategorySearch = async (keyword: string) => {
        if (keyword.trim().length < 3) {
            await fetchCategories();
            return;
        }
        setIsSearchingCategories(true);
        try {
            const response = await SearchCategories(keyword);
            if (response?.result) {
                const options = response.result.map((cat: any) => ({
                    value: cat.id || cat.category_id,
                    label: cat.category_name,
                }));
                setCategoryOptions(options);
            }
        } catch (error) {
            console.error("Error searching categories:", error);
        } finally {
            setIsSearchingCategories(false);
        }
    };

    const fetchProducts = async () => {
        setTableLoading(true);
        try {
            let url = `api/products/list?page=${page}&limit=30`;
            if (selectedCategoryId) {
                url += `&category_id=${selectedCategoryId}`;
            }
            const res = await GetDataSimple(url);
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
            let url = `api/products/search?keyword=${encodeURIComponent(
                keyword
            )}`;
            if (selectedCategoryId) {
                url += `&category_id=${selectedCategoryId}`;
            }
            const res = await PostSimple(url);
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
                                <div className="max-w-80">
                                    <Select
                                        options={categoryOptions}
                                        placeholder="Kategoriya tanlang"
                                        onChange={(value) => {
                                            setSelectedCategoryId(value);
                                            setPage(1); // Reset to first page when category changes
                                        }}
                                        searchable={true}
                                        onSearch={handleCategorySearch}
                                        searching={isSearchingCategories}
                                        defaultValue={selectedCategoryId}
                                        className="dark:bg-gray-700"
                                    />
                                </div>
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
                                {(isSearching || selectedCategoryId) && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearchKeyword("");
                                            setSelectedCategoryId("");
                                            setIsSearching(false);
                                            setPage(1);
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
