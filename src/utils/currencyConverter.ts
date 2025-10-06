/**
 * Currency conversion utilities for converting between Uzbek Som and USD
 */

// Current exchange rate (mutable, updated from backend)
let USD_TO_UZS_RATE = 0; // default fallback

// Initialize from persisted value if available (prevents initial 12500 flash)
try {
    const persisted = localStorage.getItem("usd_to_uzs_rate");
    if (persisted) {
        const parsed = parseFloat(persisted);
        if (!isNaN(parsed) && parsed > 0) {
            USD_TO_UZS_RATE = parsed;
        }
    }
} catch {
    // ignore access errors (SSR or privacy modes)
}

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
        USD_TO_UZS_RATE = newRate;
        try {
            localStorage.setItem("usd_to_uzs_rate", String(newRate));
        } catch {
            // ignore storage failures
        }
    }
};
