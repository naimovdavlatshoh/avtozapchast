import React, {
    createContext,
    useContext,
    useState,
    ReactNode,
    useEffect,
} from "react";

interface SearchContextType {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    currentPage: string;
    setCurrentPage: (page: string) => void;
    isSearching: boolean;
    setIsSearching: (searching: boolean) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider: React.FC<{ children: ReactNode }> = ({
    children,
}) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState("");
    const [isSearching, setIsSearching] = useState(false);

    // Reset search query when current page changes
    useEffect(() => {
        console.log("Current page changed to:", currentPage);
        setSearchQuery("");
    }, [currentPage]);

    return (
        <SearchContext.Provider
            value={{
                searchQuery,
                setSearchQuery,
                currentPage,
                setCurrentPage,
                isSearching,
                setIsSearching,
            }}
        >
            {children}
        </SearchContext.Provider>
    );
};

export const useSearch = () => {
    const context = useContext(SearchContext);
    if (!context) {
        throw new Error("useSearch must be used within SearchProvider");
    }
    return context;
};
