import { PencilIcon, TrashBinIcon, UserIcon } from "../../icons";
import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
} from "../../components/ui/table";
import { useModal } from "../../hooks/useModal";
import EditClientModal from "./EditClientModal";
import { useState } from "react";
import toast from "react-hot-toast";
import Button from "../../components/ui/button/Button";

import { DeleteData } from "../../service/data";
import DeleteClientModal from "./DeleteClientModal";

interface Client {
    client_id: number;
    client_name: string;
    phone_number: string;
    car_number?: string;
    created_at: string;
}

interface TableClientProps {
    clients: Client[];
    changeStatus: () => void;
}

export default function TableClient({
    clients,
    changeStatus,
}: TableClientProps) {
    const { isOpen, openModal, closeModal } = useModal();

    const [response, setResponse] = useState("");
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    console.log(response);

    const onDeleteClient = async () => {
        setIsDeleting(true);
        try {
            await DeleteData(`api/clients/delete/${selectedClient?.client_id}`);
            toast.success("Mijoz muvaffaqiyatli o'chirildi!");
            changeStatus();
        } catch (error) {
            toast.error("Nimadir xatolik yuz berdi");
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
                                Mijozning ismi
                            </TableCell>
                            <TableCell
                                isHeader
                                className=" py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                            >
                                Mijoz telefon raqami
                            </TableCell>
                            <TableCell
                                isHeader
                                className=" py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                            >
                                Mashina raqami
                            </TableCell>
                            <TableCell
                                isHeader
                                className=" py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                            >
                                Amallar
                            </TableCell>
                        </TableRow>
                    </TableHeader>

                    {/* Table Body */}
                    <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                        {clients?.map((client: Client, index: number) => (
                            <TableRow key={client.client_id}>
                                <TableCell className="  text-gray-500 px-5 py-4  text-theme-sm dark:text-gray-400">
                                    {index + 1}
                                </TableCell>
                                <TableCell className="px-5 py-4 sm:px-6 text-start">
                                    <div className="flex items-center gap-3">
                                        <div className=" overflow-hidden rounded-full bg-gray-100 p-3 text-blue-500 text-xl">
                                            <UserIcon />
                                        </div>
                                        <div>
                                            <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                                                {client.client_name}
                                            </span>
                                            <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                                                ID: {client.client_id}
                                            </span>
                                        </div>
                                    </div>
                                </TableCell>

                                <TableCell className=" py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                    {client.phone_number}
                                </TableCell>
                                <TableCell className=" py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                    {client.car_number || "—"}
                                </TableCell>
                                <TableCell className=" py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                    <Button
                                        className="mr-2"
                                        onClick={() => {
                                            openModal();
                                            setSelectedClient(client);
                                        }}
                                        size="xs"
                                        variant="outline"
                                        startIcon={
                                            <PencilIcon className="size-4" />
                                        }
                                    >
                                        {""}
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            setDeleteModalOpen(true);
                                            setSelectedClient(client);
                                        }}
                                        size="xs"
                                        variant="danger"
                                        startIcon={
                                            <TrashBinIcon className="size-4" />
                                        }
                                    >
                                        {""}
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <EditClientModal
                isOpen={isOpen}
                onClose={closeModal}
                changeStatus={changeStatus}
                setResponse={setResponse}
                client={selectedClient}
            />
            <DeleteClientModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onDelete={onDeleteClient}
                clientName={selectedClient ? selectedClient.client_name : ""}
                isDeleting={isDeleting}
            />
        </div>
    );
}
