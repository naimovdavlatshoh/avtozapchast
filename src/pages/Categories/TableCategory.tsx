import { PencilIcon } from "../../icons";
import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
} from "../../components/ui/table";
import { useModal } from "../../hooks/useModal";
import AddCategoryModal from "./AddCategoryModal";
import { useState } from "react";
import toast from "react-hot-toast";
import { DeleteData } from "../../service/data";
import DeleteCategoryModal from "./DeleteCategoryModal";
import { formatDate } from "../../utils/dateFormat";

interface Category {
    id: number;
    category_name: string;
    is_active?: number;
    created_at?: string;
}

interface TableCategoryProps {
    categories: Category[];
    changeStatus: () => void;
}

export default function TableCategory({
    categories,
    changeStatus,
}: TableCategoryProps) {
    const { isOpen, openModal, closeModal } = useModal();

    const [response, setResponse] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(
        null
    );
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const onDeleteCategory = async () => {
        setIsDeleting(true);
        try {
            await DeleteData(`api/categories/delete/${selectedCategory?.id}`);
            toast.success("Kategoriya muvaffaqiyatli o'chirildi!");
            changeStatus();
        } catch (error: any) {
            toast.error(
                error?.response?.data?.error || "Nimadir xatolik yuz berdi"
            );
            console.log(response);
        } finally {
            setIsDeleting(false);
            setDeleteModalOpen(false);
        }
    };

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
                <Table>
                    {/* Table Header */}
                    <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                        <TableRow>
                            <TableCell
                                isHeader
                                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                            >
                                #
                            </TableCell>
                            <TableCell
                                isHeader
                                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                            >
                                Kategoriya nomi
                            </TableCell>
                            <TableCell
                                isHeader
                                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                            >
                                Holati
                            </TableCell>
                            <TableCell
                                isHeader
                                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                            >
                                Yaratilgan sana
                            </TableCell>
                            <TableCell
                                isHeader
                                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                            >
                                Amallar
                            </TableCell>
                        </TableRow>
                    </TableHeader>

                    {/* Table Body */}
                    <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                        {categories?.length === 0 ? (
                            <TableRow>
                                <td
                                    colSpan={5}
                                    className="px-5 py-8 text-center text-gray-500"
                                >
                                    Kategoriyalar topilmadi
                                </td>
                            </TableRow>
                        ) : (
                            categories?.map(
                                (category: Category, index: number) => (
                                    <TableRow key={category.id}>
                                        <TableCell className="px-5 py-4 text-gray-900 dark:text-gray-100">
                                            {(index + 1).toString()}
                                        </TableCell>
                                        <TableCell className="px-5 py-4 text-gray-900 dark:text-gray-100">
                                            {category.category_name}
                                        </TableCell>
                                        <TableCell className="px-5 py-4">
                                            <span
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    category.is_active === 1
                                                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                                }`}
                                            >
                                                {category.is_active === 1
                                                    ? "Faol"
                                                    : "Nofaol"}
                                            </span>
                                        </TableCell>
                                        <TableCell className="px-5 py-4 text-gray-900 dark:text-gray-100">
                                            {category.created_at
                                                ? formatDate(
                                                      category.created_at
                                                  )
                                                : "-"}
                                        </TableCell>
                                        <TableCell className="px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedCategory(
                                                            category
                                                        );
                                                        openModal();
                                                    }}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Tahrirlash"
                                                >
                                                    <PencilIcon />
                                                </button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            )
                        )}
                    </TableBody>
                </Table>
            </div>

            {selectedCategory && (
                <AddCategoryModal
                    isOpen={isOpen}
                    onClose={closeModal}
                    changeStatus={changeStatus}
                    setResponse={setResponse}
                    category={selectedCategory}
                />
            )}

            <DeleteCategoryModal
                isOpen={deleteModalOpen}
                onClose={() => {
                    setDeleteModalOpen(false);
                    setSelectedCategory(null);
                }}
                onConfirm={onDeleteCategory}
                categoryName={selectedCategory?.category_name || ""}
                isDeleting={isDeleting}
            />
        </div>
    );
}
