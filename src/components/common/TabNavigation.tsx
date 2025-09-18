// import { useState } from "react";

interface Tab {
    id: string;
    label: string;
    icon?: React.ReactNode;
}

interface TabNavigationProps {
    tabs: Tab[];
    activeTab: string;
    onTabChange: (tabId: string) => void;
    className?: string;
}

export default function TabNavigation({
    tabs,
    activeTab,
    onTabChange,
    className = "",
}: TabNavigationProps) {
    return (
        <div className={` inline-block ${className}`}>
            <div className="flex">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`px-4 py-2 text-sm font-medium transition-all duration-200 border-b-2
                            ${
                                activeTab === tab.id
                                    ? "text-blue-600 dark:text-blue-400 border-blue-600"
                                    : "text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-200 "
                            }`}
                    >
                        {tab.label}
                        {/* <span className="bg-blue-500 text-white rounded-full px-2 py-1 text-xs ml-1">{12}</span> */}
                    </button>
                ))}
            </div>
        </div>
    );
}
