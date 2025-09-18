import { formatNumber, formatCurrency, formatAmount } from "./numberFormat";

/**
 * Manual test functions for number formatting utilities
 * Run these functions in browser console or use them for debugging
 */

// Test formatNumber function
export const testFormatNumber = () => {
    console.log("=== Testing formatNumber ===");

    // Basic number formatting
    console.log("formatNumber(1200000):", formatNumber(1200000));
    console.log("formatNumber(50000):", formatNumber(50000));
    console.log("formatNumber(1000):", formatNumber(1000));
    console.log("formatNumber(123):", formatNumber(123));
    console.log("formatNumber(0):", formatNumber(0));

    // With currency
    console.log('formatNumber(1200000, "сум"):', formatNumber(1200000, "сум"));
    console.log('formatNumber(50000, "USD"):', formatNumber(50000, "USD"));
    console.log('formatNumber(1000, "руб"):', formatNumber(1000, "руб"));

    // String inputs
    console.log('formatNumber("1200000"):', formatNumber("1200000"));
    console.log('formatNumber("50000", "сум"):', formatNumber("50000", "сум"));
    console.log('formatNumber("0"):', formatNumber("0"));

    // Edge cases
    console.log("formatNumber(null):", formatNumber(null as any));
    console.log("formatNumber(undefined):", formatNumber(undefined as any));
    console.log('formatNumber("invalid"):', formatNumber("invalid"));
    console.log("formatNumber(NaN):", formatNumber(NaN));
    console.log('formatNumber(""):', formatNumber(""));
    console.log('formatNumber("abc123"):', formatNumber("abc123"));

    // Decimal numbers
    console.log("formatNumber(1234.56):", formatNumber(1234.56));
    console.log("formatNumber(1000.5):", formatNumber(1000.5));
    console.log("formatNumber(0.99):", formatNumber(0.99));

    // Negative numbers
    console.log("formatNumber(-1200000):", formatNumber(-1200000));
    console.log("formatNumber(-50000):", formatNumber(-50000));
    console.log("formatNumber(-1000):", formatNumber(-1000));
};

// Test formatCurrency function
export const testFormatCurrency = () => {
    console.log("=== Testing formatCurrency ===");

    // Basic currency formatting
    console.log("formatCurrency(1200000):", formatCurrency(1200000));
    console.log("formatCurrency(50000):", formatCurrency(50000));
    console.log("formatCurrency(1000):", formatCurrency(1000));
    console.log("formatCurrency(0):", formatCurrency(0));

    // String inputs
    console.log('formatCurrency("1200000"):', formatCurrency("1200000"));
    console.log('formatCurrency("50000"):', formatCurrency("50000"));
    console.log('formatCurrency("0"):', formatCurrency("0"));

    // Decimal numbers
    console.log("formatCurrency(1234.56):", formatCurrency(1234.56));
    console.log("formatCurrency(1000.5):", formatCurrency(1000.5));

    // Negative numbers
    console.log("formatCurrency(-1200000):", formatCurrency(-1200000));
    console.log("formatCurrency(-50000):", formatCurrency(-50000));
};

// Test formatAmount function
export const testFormatAmount = () => {
    console.log("=== Testing formatAmount ===");

    // Basic amount formatting
    console.log("formatAmount(1200000):", formatAmount(1200000));
    console.log("formatAmount(50000):", formatAmount(50000));
    console.log("formatAmount(1000):", formatAmount(1000));
    console.log("formatAmount(0):", formatAmount(0));

    // String inputs
    console.log('formatAmount("1200000"):', formatAmount("1200000"));
    console.log('formatAmount("50000"):', formatAmount("50000"));
    console.log('formatAmount("0"):', formatAmount("0"));

    // Decimal numbers
    console.log("formatAmount(1234.56):", formatAmount(1234.56));
    console.log("formatAmount(1000.5):", formatAmount(1000.5));

    // Negative numbers
    console.log("formatAmount(-1200000):", formatAmount(-1200000));
    console.log("formatAmount(-50000):", formatAmount(-50000));
};

// Test edge cases
export const testEdgeCases = () => {
    console.log("=== Testing Edge Cases ===");

    // Very large numbers
    console.log("formatNumber(999999999999):", formatNumber(999999999999));
    console.log("formatCurrency(999999999999):", formatCurrency(999999999999));

    // Very small numbers
    console.log("formatNumber(0.000001):", formatNumber(0.000001));
    console.log("formatCurrency(0.000001):", formatCurrency(0.000001));

    // Mixed input types
    console.log(
        'formatNumber("123456", "EUR"):',
        formatNumber("123456", "EUR")
    );
    console.log('formatNumber(123456, "USD"):', formatNumber(123456, "USD"));
};

// Run all tests
export const runAllTests = () => {
    testFormatNumber();
    testFormatCurrency();
    testFormatAmount();
    testEdgeCases();
    console.log("=== All tests completed ===");
};

// Example usage:
// In browser console: runAllTests()
// Or individual tests: testFormatNumber(), testFormatCurrency(), etc.
