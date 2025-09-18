# Modal Components

This directory contains reusable modal components for the application.

## DeleteConfirmationModal

A reusable delete confirmation modal that can be used across all pages.

### Usage Example

```tsx
import DeleteConfirmationModal from "../../components/modals/DeleteConfirmationModal";

function MyComponent() {
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{
        id: number;
        name: string;
    } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteClick = (id: number, name: string) => {
        setItemToDelete({ id, name });
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!itemToDelete) return;

        try {
            setIsDeleting(true);
            await deleteItem(itemToDelete.id);
            toast.success("Элемент успешно удален");
            // Refresh data
            setIsDeleteModalOpen(false);
            setItemToDelete(null);
        } catch (error) {
            toast.error("Ошибка при удалении");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteCancel = () => {
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
    };

    return (
        <div>
            {/* Your component content */}

            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
                title="Удалить элемент"
                message="Вы уверены, что хотите удалить этот элемент? Это действие нельзя отменить."
                itemName={itemToDelete?.name}
                isLoading={isDeleting}
            />
        </div>
    );
}
```

### Props

-   `isOpen: boolean` - Controls modal visibility
-   `onClose: () => void` - Called when modal should be closed
-   `onConfirm: () => void` - Called when delete is confirmed
-   `title?: string` - Modal title (default: "Подтверждение удаления")
-   `message?: string` - Confirmation message (default: "Вы уверены, что хотите удалить этот элемент?")
-   `itemName?: string` - Name of the item being deleted (optional)
-   `isLoading?: boolean` - Shows loading state (default: false)
-   `confirmText?: string` - Confirm button text (default: "Удалить")
-   `cancelText?: string` - Cancel button text (default: "Отмена")

## PaymentModal

A modal for creating payments. Already implemented and used in the payments page.

## ReturnModal

A modal for handling material returns. Used in the materials issues page.
