const Loader = () => {
    return (
        <div className="flex items-center justify-center h-64">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <div className="text-lg text-gray-600 dark:text-gray-400">
                    Загрузка...
                </div>
            </div>
        </div>
    );
};

export default Loader;
