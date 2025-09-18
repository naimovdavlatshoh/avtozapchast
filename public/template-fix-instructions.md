# DOCX Template To'g'rilash Ko'rsatmalari

## Muammo:

Template'da "Duplicate open tag" va "Duplicate close tag" xatoliklari bor.

## Yechim:

### 1. Microsoft Word'da contract-template.docx faylini oching

### 2. Barcha placeholder'larni tekshiring va to'g'rilang:

#### ❌ Noto'g'ri formatlar:

-   `{{contract_number}}` → `{contract_number}`
-   `{{client_name}}` → `{client_name}`
-   `{{contract_price}}` → `{contract_price}`
-   `{{#lab_tests}}` → `{#lab_tests}`
-   `{{/lab_tests}}` → `{/lab_tests}`

#### ✅ To'g'ri formatlar:

-   `{contract_number}`
-   `{client_name}`
-   `{contract_price}`
-   `{#lab_tests}`
-   `{/lab_tests}`

### 3. Find & Replace bilan to'g'rilang:

-   **Find**: `{{`
-   **Replace**: `{`
-   **Find**: `}}`
-   **Replace**: `}`

### 4. DOCX sifatida saqlang

### 5. Test qiling

## Eslatma:

-   Placeholder'lar faqat `{key}` formatida bo'lishi kerak
-   `{{key}}` emas!
-   Array'lar uchun `{#array}...{/array}` formatida
