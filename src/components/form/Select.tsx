import { useState, useRef, useEffect } from "react";

interface Option {
    value: number;
    label: string;
}

interface SelectProps {
    options: Option[];
    placeholder?: string;
    onChange: (value: string) => void;
    className?: string;
    defaultValue?: string;
    searchable?: boolean;
    onSearch?: (keyword: string) => void;
    searching?: boolean;
    externalSearchTerm?: string;
}

const Select: React.FC<SelectProps> = ({
    options,
    placeholder = "Select an option",
    onChange,
    className = "",
    defaultValue = "",
    searchable = false,
    onSearch,
    searching = false,
    externalSearchTerm,
}) => {
    // Manage the selected value and dropdown state
    const [selectedValue, setSelectedValue] = useState<string>(defaultValue);
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredOptions, setFilteredOptions] = useState<Option[]>(
        options || []
    );
    const [dropdownPosition, setDropdownPosition] = useState({
        top: 0,
        left: 0,
        width: 0,
        maxHeight: 320,
    });
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Update filtered options when options or search term change
    useEffect(() => {
        if (!options || options.length === 0) {
            setFilteredOptions([]);
            return;
        }

        // If external search (server-side) is provided, do not locally filter.
        // Show options exactly as provided by parent so server results are visible
        // even when labels do not contain the raw query (e.g., barcode).
        if (onSearch) {
            setFilteredOptions(options);
            return;
        }

        if (searchTerm.trim() === "") {
            setFilteredOptions(options);
        } else {
            const filtered = options.filter((option) =>
                option?.label?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredOptions(filtered);
        }
    }, [options, searchTerm, onSearch]);

    // Handle external search term (for barcode scanner)
    useEffect(() => {
        if (externalSearchTerm !== undefined) {
            setSearchTerm(externalSearchTerm);
        }
    }, [externalSearchTerm]);

    // Close dropdown when clicking outside and update position on scroll
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
                setSearchTerm("");
            }
        };

        const handleScroll = () => {
            if (isOpen) {
                updateDropdownPosition();
            }
        };

        const handleResize = () => {
            if (isOpen) {
                updateDropdownPosition();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        window.addEventListener("scroll", handleScroll, true);
        window.addEventListener("resize", handleResize);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            window.removeEventListener("scroll", handleScroll, true);
            window.removeEventListener("resize", handleResize);
        };
    }, [isOpen]);

    const handleChange = (value: string) => {
        setSelectedValue(value);
        onChange(value);
        setIsOpen(false);
        setSearchTerm("");
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);

        // If external search is provided, use it
        if (onSearch) {
            if (value.trim().length >= 3) {
                onSearch(value.trim());
            } else if (value.trim().length === 0) {
                // When search is empty, fetch all data
                onSearch("");
            }
        }
    };

    const updateDropdownPosition = () => {
        if (dropdownRef.current) {
            const rect = dropdownRef.current.getBoundingClientRect();
            const dropdownHeight = 320; // max-h-80 = 320px
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;

            let top = rect.bottom + window.scrollY;
            let maxHeight = dropdownHeight;

            // Agar pastda joy yetmasa va tepada joy ko'p bo'lsa, tepaga qo'yamiz
            if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
                top =
                    rect.top +
                    window.scrollY -
                    Math.min(dropdownHeight, spaceAbove);
                maxHeight = Math.min(dropdownHeight, spaceAbove - 10); // 10px margin
            } else if (spaceBelow < dropdownHeight) {
                // Agar pastda joy yetmasa, mavjud joyga moslashtiramiz
                maxHeight = Math.max(200, spaceBelow - 10); // minimum 200px
            }

            setDropdownPosition({
                top,
                left: rect.left + window.scrollX,
                width: rect.width,
                maxHeight,
            });
        }
    };

    const toggleDropdown = () => {
        if (!isOpen) {
            updateDropdownPosition();
        }
        setIsOpen(!isOpen);
        if (!isOpen) {
            setSearchTerm("");
        }
    };

    const selectedOption = options?.find(
        (option) => option?.value?.toString() === selectedValue
    );

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Custom Select Button */}
            <button
                type="button"
                onClick={toggleDropdown}
                className={`h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 ${
                    selectedValue
                        ? "text-gray-800 dark:text-white/90"
                        : "text-gray-400 dark:text-gray-400"
                } ${className} text-left`}
            >
                {selectedOption ? selectedOption.label : placeholder}
            </button>

            {/* Dropdown Arrow */}
            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${
                        isOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                    />
                </svg>
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div
                    className="fixed z-[9999] bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg overflow-hidden"
                    style={{
                        top: dropdownPosition.top,
                        left: dropdownPosition.left,
                        width: dropdownPosition.width,
                        maxHeight: dropdownPosition.maxHeight,
                    }}
                >
                    {/* Search Input (if searchable) */}
                    {searchable && (
                        <div className="p-3 border-b border-gray-200 dark:border-gray-600">
                            <input
                                type="text"
                                placeholder="Поиск..."
                                value={searchTerm}
                                onChange={handleSearch}
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-white"
                                autoFocus
                            />
                            {searching && (
                                <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                                    Поиск...
                                </div>
                            )}
                        </div>
                    )}

                    {/* Options List */}
                    <div
                        className="overflow-y-auto pb-2"
                        style={{ maxHeight: dropdownPosition.maxHeight - 60 }}
                    >
                        {filteredOptions.length > 0 ? (
                            filteredOptions
                                .filter(
                                    (option) =>
                                        option &&
                                        option.value !== undefined &&
                                        option.label
                                )
                                .map((option) => (
                                    <button
                                        key={option?.value || Math.random()}
                                        type="button"
                                        onClick={() =>
                                            handleChange(
                                                option?.value?.toString() || ""
                                            )
                                        }
                                        className={`w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                                            option?.value?.toString() ===
                                            selectedValue
                                                ? "bg-brand-100 dark:bg-brand-900 text-brand-800 dark:text-brand-200"
                                                : "text-gray-700 dark:text-gray-300"
                                        }`}
                                    >
                                        {option?.label || ""}
                                    </button>
                                ))
                        ) : (
                            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                                {searchTerm ? "Ничего не найдено" : "Нет опций"}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Select;
