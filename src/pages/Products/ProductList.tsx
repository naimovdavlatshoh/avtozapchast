import { useEffect, useState } from "react";
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

    useEffect(() => {
        fetchProducts();
    }, [page, status]);

    const fetchProducts = async () => {
        setTableLoading(true);
        try {
            const res = await GetDataSimple(
                `api/products/list?page=${page}&limit=10`
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
                                <Input
                                    type="text"
                                    placeholder="Mahsulot qidirish... (3+ harf)"
                                    value={searchKeyword}
                                    onChange={handleSearchChange}
                                    className="w-64"
                                />
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
