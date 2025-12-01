import { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import { GetCategoriesList, SearchCategories } from "../../service/data";
import { useModal } from "../../hooks/useModal";
import AddCategoryModal from "./AddCategoryModal";
import TableCategory from "./TableCategory";
import Pagination from "../../components/common/Pagination.tsx";
import { Toaster } from "react-hot-toast";
import Loader from "../../components/ui/loader/Loader.tsx";
import Input from "../../components/form/input/InputField";

export default function CategoriesList() {
    const [categories, setCategories] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const { isOpen, openModal, closeModal } = useModal();
    const [status, setStatus] = useState(false);
    const [response, setResponse] = useState("");
    const [loading, setLoading] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState("");
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (searchKeyword.trim().length >= 3) {
            setIsSearching(true);
            SearchCategories(searchKeyword)
                .then((res) => {
                    setCategories(res?.result || []);
                    setTotalPages(1);
                    setIsSearching(false);
                })
                .catch(() => {
                    setIsSearching(false);
                    console.log(response);
                });
        } else if (searchKeyword.trim().length === 0) {
            setLoading(true);
            GetCategoriesList(page, 30)
                .then((res) => {
                    setCategories(res?.result || []);
                    setTotalPages(res?.pages || 1);
                    setLoading(false);
                })
                .catch(() => {
                    setLoading(false);
                });
        } else {
            // Agar 1-2 ta harf bo'lsa, ro'yxatni tozalash
            setCategories([]);
        }
    }, [status, page, searchKeyword]);

    const changeStatus = () => {
        setStatus(!status);
    };

    if (loading && !isSearching) {
        return <Loader />;
    }

    return (
        <>
            <PageBreadcrumb pageTitle="Kategoriyalar" />
            <div className="space-y-6">
                <ComponentCard
                    title="Kategoriyalar"
                    desc={
                        <div className="flex items-center gap-3">
                            <Input
                                type="text"
                                placeholder="Kategoriya qidirish... (min 3 harf)"
                                value={searchKeyword}
                                onChange={(e) =>
                                    setSearchKeyword(e.target.value)
                                }
                                className="w-64"
                            />
                            <button
                                onClick={openModal}
                                className="bg-blue-500 text-white px-5 py-3 rounded-md hover:bg-blue-600"
                            >
                                + Kategoriya qo'shish
                            </button>
                        </div>
                    }
                >
                    <TableCategory
                        categories={categories}
                        changeStatus={changeStatus}
                    />
                    {!searchKeyword && (
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

            <AddCategoryModal
                isOpen={isOpen}
                onClose={closeModal}
                changeStatus={changeStatus}
                setResponse={setResponse}
            />
            <Toaster position="top-right" reverseOrder={false} />
        </>
    );
}
