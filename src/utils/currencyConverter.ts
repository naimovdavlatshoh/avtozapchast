/**
 * Currency conversion utilities for converting between Uzbek Som and USD
 */

// Current exchange rate (this should ideally come from an API or be configurable)
const USD_TO_UZS_RATE = 12500; // 1 USD = 12,500 UZS (example rate)

/**
 * Converts Uzbek Som to USD
 * @param uzsAmount - Amount in Uzbek Som
 * @returns Amount in USD rounded to 2 decimal places
 */
export const convertUzsToUsd = (uzsAmount: number | string): number => {
    const amount =
        typeof uzsAmount === "string" ? parseFloat(uzsAmount) : uzsAmount;

    if (isNaN(amount) || amount <= 0) return 0;

    return Math.round((amount / USD_TO_UZS_RATE) * 100) / 100;
};

/**
 * Converts USD to Uzbek Som
 * @param usdAmount - Amount in USD
 * @returns Amount in Uzbek Som
 */
export const convertUsdToUzs = (usdAmount: number | string): number => {
    const amount =
        typeof usdAmount === "string" ? parseFloat(usdAmount) : usdAmount;

    if (isNaN(amount) || amount <= 0) return 0;

    return Math.round(amount * USD_TO_UZS_RATE);
};

/**
 * Formats USD amount with proper currency symbol
 * @param usdAmount - Amount in USD
 * @returns Formatted USD string
 */
export const formatUsd = (usdAmount: number | string): string => {
    const amount =
        typeof usdAmount === "string" ? parseFloat(usdAmount) : usdAmount;

    if (isNaN(amount) || amount <= 0) return "$0.00";

    return `$${amount.toFixed(2)}`;
};

/**
 * Gets the current exchange rate
 * @returns Current USD to UZS exchange rate
 */
export const getExchangeRate = (): number => {
    return USD_TO_UZS_RATE;
};

/**
 * Sets a new exchange rate (for admin purposes)
 * @param newRate - New exchange rate
 */
export const setExchangeRate = (newRate: number): void => {
    if (newRate > 0) {
        // In a real app, this would update a global state or API
        console.log(`Exchange rate updated to: ${newRate}`);
    }
};
