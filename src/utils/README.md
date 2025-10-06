# Number Formatting Utilities

This directory contains utility functions for consistent number formatting across the application.

## Functions

### `formatNumber(amount, currency?)`

Formats a number with thousand separators using Uzbek locale.

**Parameters:**

-   `amount`: The number to format (number or string)
-   `currency`: Optional currency suffix (default: undefined)

**Returns:** Formatted string with thousand separators

**Examples:**

```typescript
formatNumber(1200000); // "1 200 000"
formatNumber(1200000, "сум"); // "1 200 000 сум"
formatNumber("50000"); // "50 000"
```

### `formatCurrency(amount)`

Formats a number as currency with "сум" suffix.

**Parameters:**

-   `amount`: The number to format (number or string)

**Returns:** Formatted currency string

**Examples:**

```typescript
formatCurrency(1200000); // "1 200 000 сум"
formatCurrency(50000); // "50 000 сум"
formatCurrency("1000"); // "1 000 сум"
```

### `formatAmount(amount)`

Formats a number without currency suffix.

**Parameters:**

-   `amount`: The number to format (number or string)

**Returns:** Formatted number string

**Examples:**

```typescript
formatAmount(1200000); // "1 200 000"
formatAmount(50000); // "50 000"
formatAmount("1000"); // "1 000"
```

## Authentication Utilities

### `handleAuthError(error)`

Automatically handles 401 Unauthorized errors by clearing local storage and reloading the page.

**Parameters:**

-   `error`: The error object from axios or fetch

**Returns:** `true` if it was a 401 error and was handled, `false` otherwise

**Behavior:**

-   Detects 401 Unauthorized errors
-   Clears all local storage and session storage
-   Automatically reloads the page (redirects to login)

### `clearAuthData()`

Clears all authentication data from storage.

**Use case:** Manual logout functionality

### `isAuthenticated()`

Checks if user is currently authenticated.

**Returns:** `true` if token exists, `false` otherwise

### `getAuthToken()`

Gets the current authentication token.

**Returns:** Token string or `null` if not found

### `getUserRole()`

Gets the current user role.

**Returns:** Role string or `null` if not found

## Usage

Import the functions where needed:

```typescript
import { formatCurrency, formatAmount } from "../../utils/numberFormat";
import { handleAuthError, isAuthenticated } from "../../utils/authUtils";

// In your component
const price = 1200000;
const formattedPrice = formatCurrency(price); // "1 200 000 сум"

// Check authentication
if (isAuthenticated()) {
    // User is logged in
}
```

## Features

-   **Consistent formatting**: All numbers use the same formatting rules
-   **Uzbek locale**: Uses `ru-RU` locale for proper thousand separators
-   **Type safety**: Handles both number and string inputs
-   **Error handling**: Returns "0" for invalid inputs
-   **Flexible**: Can be used with or without currency suffixes
-   **Automatic 401 handling**: Global axios interceptor handles unauthorized errors
-   **Storage management**: Automatic cleanup of expired sessions

## Locale

The utilities use the `ru-RU` locale which provides:

-   Space as thousand separator (1 200 000)
-   Proper formatting for Uzbek/European number systems
-   Consistent with the application's language requirements

## Authentication Error Handling

The application automatically handles 401 Unauthorized errors:

1. **Global Interceptor**: Axios response interceptor catches all 401 errors
2. **Automatic Cleanup**: Local storage and session storage are cleared
3. **Page Reload**: Page automatically reloads to redirect to login
4. **No Manual Handling**: Individual API calls don't need to handle 401 errors

This ensures a consistent user experience when sessions expire.
