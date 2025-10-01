import { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import { GetDataSimple, PostSimple } from "../../service/data";
import { useModal } from "../../hooks/useModal";

import Pagination from "../../components/common/Pagination.tsx";
import { Toaster } from "react-hot-toast";
import Loader from "../../components/ui/loader/Loader.tsx";
import Input from "../../components/form/input/InputField";

import { MdClear } from "react-icons/md";
import TableArrival from "./TableArrival.tsx";
import AddArrivalModal from "./AddArrivalModal.tsx";

export default function ArrivalList() {
    const [arrivals, setArrivals] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchKeyword, setSearchKeyword] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const { isOpen, openModal, closeModal } = useModal();
    const [status, setStatus] = useState(false);
    const [tableLoading, setTableLoading] = useState(false);

    useEffect(() => {
        fetchArrivals();
    }, [page, status]);

    const fetchArrivals = async () => {
        setTableLoading(true);
        try {
            const res = await GetDataSimple(
                `api/arrival/list?page=${page}&limit=30`
            );
            setArrivals(res?.result || []);
            setTotalPages(res?.pages || 1);
        } catch (error) {
            console.error("Kirimlarni yuklashda xatolik:", error);
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
            fetchArrivals();
        }
    };

    const handleSearchWithKeyword = async (keyword: string) => {
        setTableLoading(true);
        setIsSearching(true);
        try {
            const res = await PostSimple(
                `api/arrival/search?keyword=${encodeURIComponent(keyword)}`
            );
            setArrivals(res?.data?.result || []);
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
            <PageBreadcrumb pageTitle="Kirimlar" />
            <div className="space-y-6">
                <ComponentCard
                    title="Kirimlar"
                    desc={
                        <div className="flex gap-4 items-center">
                            <div className="flex gap-2">
                                <Input
                                    type="text"
                                    placeholder="Kirim qidirish... (3+ harf)"
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
                                            fetchArrivals();
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
                                + Kirim qo'shish
                            </button>
                        </div>
                    }
                >
                    {tableLoading ? (
                        <div className="flex justify-center items-center py-8">
                            <Loader />
                        </div>
                    ) : (
                        <TableArrival arrivals={arrivals} />
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

            <AddArrivalModal
                isOpen={isOpen}
                onClose={closeModal}
                changeStatus={changeStatus}
                setResponse={() => {}}
            />
            <Toaster position="top-right" reverseOrder={false} />
        </>
    );
}
