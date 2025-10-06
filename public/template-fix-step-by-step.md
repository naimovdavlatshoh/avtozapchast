# DOCX Template To'g'rilash - Qadam-ba-qadam

## Muammo:

Template'da hali ham `{{cont` va `mber}}` kabi noto'g'ri placeholder'lar bor.

## Qadam-ba-qadam yechim:

### 1. Microsoft Word'da contract-template.docx faylini oching

### 2. Find & Replace (Ctrl+H) oching

### 3. Birinchi to'g'rilash:

-   **Find what**: `{{cont`
-   **Replace with**: `{cont`
-   **Replace All** bosing

### 4. Ikkinchi to'g'rilash:

-   **Find what**: `mber}}`
-   **Replace with**: `mber}`
-   **Replace All** bosing

### 5. Umumiy to'g'rilash:

-   **Find what**: `{{`
-   **Replace with**: `{`
-   **Replace All** bosing

### 6. Yana bir to'g'rilash:

-   **Find what**: `}}`
-   **Replace with**: `}`
-   **Replace All** bosing

### 7. Natijani tekshiring:

-   `{contract_number}` ✅
-   `{client_name}` ✅
-   `{contract_price}` ✅

### 8. DOCX sifatida saqlang (Ctrl+S)

### 9. Test qiling

## Eslatma:

-   Barcha `{{` → `{` bo'lishi kerak
-   Barcha `}}` → `}` bo'lishi kerak
-   Placeholder'lar faqat `{key}` formatida bo'lishi kerak
