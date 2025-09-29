/**
 * Date formatting utilities for consistent date display across the application
 */

/**
 * Formats a date string to dd-mm-yyyy hh:mm format
 * @param dateString - The date string to format
 * @returns Formatted date string in dd-mm-yyyy hh:mm format
 */
export const formatDate = (dateString: string): string => {
    if (!dateString) return "";

    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
        console.warn(`Invalid date string: ${dateString}`);
        return "";
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${day}-${month}-${year} ${hours}:${minutes}`;
};

/**
 * Formats a date string to dd-mm-yyyy format (without time)
 * @param dateString - The date string to format
 * @returns Formatted date string in dd-mm-yyyy format
 */
export const formatDateOnly = (dateString: string): string => {
    if (!dateString) return "";

    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
        console.warn(`Invalid date string: ${dateString}`);
        return "";
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${day}-${month}-${year}`;
};

/**
 * Formats a date string to hh:mm format (time only)
 * @param dateString - The date string to format
 * @returns Formatted time string in hh:mm format
 */
export const formatTimeOnly = (dateString: string): string => {
    if (!dateString) return "";

    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
        console.warn(`Invalid date string: ${dateString}`);
        return "";
    }

    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${hours}:${minutes}`;
};

/**
 * Formats current date to dd-mm-yyyy hh:mm format
 * @returns Current date formatted as dd-mm-yyyy hh:mm
 */
export const formatCurrentDate = (): string => {
    return formatDate(new Date().toISOString());
};

/**
 * Formats a date for display in tables (shorter format)
 * @param dateString - The date string to format
 * @returns Formatted date string optimized for table display
 */
export const formatDateForTable = (dateString: string): string => {
    if (!dateString) return "";

    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
        console.warn(`Invalid date string: ${dateString}`);
        return "";
    }

    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    // If less than 24 hours, show relative time
    if (diffInHours < 24) {
        if (diffInHours < 1) {
            const minutes = Math.floor(diffInHours * 60);
            return `${minutes} daqiqa oldin`;
        }
        return `${Math.floor(diffInHours)} soat oldin`;
    }

    // Otherwise show full date
    return formatDate(dateString);
};
