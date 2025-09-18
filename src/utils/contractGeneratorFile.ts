// Template will be fetched dynamically
const templateUrl = "/contract-template.docx";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import { saveAs } from "file-saver";
// @ts-ignore
import ImageModule from "docxtemplater-image-module-free";

const generateChequeFromData = async (contractData: any) => {
    try {
        // First test template availability
        const testResult = await testTemplate();
        if (!testResult.success) {
            console.error("Template test failed:", testResult.message);
            alert("Template test failed: " + testResult.message);
            return;
        }

        generateDocument(contractData);
    } catch (error) {
        console.log("Error: " + error);
    }
};

const generateDocument = async (contractData: any) => {
    console.log("Contract Data:", contractData);

    // Helper functions
    const formatCurrency = (amount: number) => {
        return amount.toLocaleString() + " сум";
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("ru-RU");
    };

    const numberToWords = (num: number): string => {
        if (num === 0) return "нол";

        const ones = [
            "",
            "бир",
            "икки",
            "уч",
            "тўрт",
            "беш",
            "олти",
            "етти",
            "саккиз",
            "тўққиз",
        ];
        const teens = [
            "ўн",
            "ўн бир",
            "ўн икки",
            "ўн уч",
            "ўн тўрт",
            "ўн беш",
            "ўн олти",
            "ўн етти",
            "ўн саккиз",
            "ўн тўққиз",
        ];
        const tens = [
            "",
            "",
            "йигирма",
            "ўттиз",
            "қирқ",
            "эллик",
            "олтмиш",
            "етмиш",
            "саксон",
            "тўқсон",
        ];
        const hundreds = [
            "",
            "юз",
            "икки юз",
            "уч юз",
            "тўрт юз",
            "беш юз",
            "олти юз",
            "етти юз",
            "саккиз юз",
            "тўққиз юз",
        ];

        const convertGroup = (n: number): string => {
            if (n === 0) return "";

            let result = "";

            if (n >= 100) {
                result += hundreds[Math.floor(n / 100)] + " ";
                n %= 100;
            }

            if (n >= 20) {
                result += tens[Math.floor(n / 10)] + " ";
                n %= 10;
            } else if (n >= 10) {
                result += teens[n - 10] + " ";
                return result.trim();
            }

            if (n > 0) {
                result += ones[n] + " ";
            }

            return result.trim();
        };

        const groups = [];
        let remaining = num;

        while (remaining > 0) {
            groups.unshift(remaining % 1000);
            remaining = Math.floor(remaining / 1000);
        }

        const groupNames = ["", "минг", "миллион", "миллиард"];

        let result = "";
        for (let i = 0; i < groups.length; i++) {
            if (groups[i] > 0) {
                result +=
                    convertGroup(groups[i]) +
                    " " +
                    groupNames[groups.length - 1 - i] +
                    " ";
            }
        }

        return result.trim() + " сўм";
    };

    // Pre-fetch QR code image if it's a URL
    let qrCodeData: any = null;
    if (contractData?.qrCode && contractData.qrCode.startsWith("http")) {
        try {
            console.log("Pre-fetching QR code from URL:", contractData.qrCode);
            const response = await fetch(contractData.qrCode);
            if (response.ok) {
                qrCodeData = await response.arrayBuffer();
                console.log(
                    "QR code pre-fetched successfully, size:",
                    qrCodeData.byteLength
                );
            } else {
                console.error("Failed to fetch QR code:", response.status);
            }
        } catch (error) {
            console.error("Error pre-fetching QR code:", error);
        }
    } else if (
        contractData?.qrCode &&
        contractData.qrCode.startsWith("data:image")
    ) {
        // Convert base64 to bytes
        try {
            const base64Data = contractData.qrCode.split(",")[1];
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            qrCodeData = bytes;
            console.log(
                "Base64 QR code converted to bytes, size:",
                qrCodeData.byteLength
            );
        } catch (error) {
            console.error("Error converting base64 QR code:", error);
        }
    }

    // Template data with backend data
    let templateData: any = {
        // QR Code image - use pre-fetched data
        qr_code_image: qrCodeData ? "QR_CODE_PLACEHOLDER" : "",

        // Basic contract info
        contract_number: contractData?.contract_number || "N/A",
        contract_date: contractData?.contract_date
            ? formatDate(contractData.contract_date)
            : "N/A",
        contract_price: contractData?.contract_price
            ? formatCurrency(contractData.contract_price)
            : "N/A",
        contract_price_text: contractData?.contract_price
            ? numberToWords(contractData.contract_price)
            : "N/A",

        // Client info
        client_name: contractData?.client_name || "N/A",
        business_name: contractData?.business_name || "N/A",
        phone_number: contractData?.phone_number || "N/A",
        client_address: contractData?.business_address || "N/A",

        // Bank info
        bank_account: contractData?.bank_account || "N/A",
        bank_address: contractData?.bank_address || "N/A",
        inn: contractData?.inn || "N/A",
        mfo: contractData?.mfo || "N/A",
        oked: contractData?.oked || "N/A",

        // Contract status
        contract_status: contractData?.contract_status_text || "N/A",
        contract_payment_status:
            contractData?.contract_payment_status_text || "N/A",
        percent: contractData?.percent || 0,
        created_at: contractData?.created_at
            ? formatDate(contractData.created_at)
            : "N/A",
        contract_date_text: contractData?.contract_date_text,

        // Laboratory tests
        lab_tests_count: contractData?.laboratory?.length || 0,
        lab_tests:
            contractData?.laboratory?.map((test: any, index: number) => ({
                index: index + 1,
                name: test.tests_name || "N/A",
                type: test.test_type || "N/A",
            })) || [],

        // Monthly payments
        monthly_payments_count: contractData?.monthlypayments?.length || 0,
        monthly_payments:
            contractData?.monthlypayments?.map((payment: any) => ({
                month: payment.month_of_payment || "N/A",
                fee: payment.monthly_fee
                    ? formatCurrency(payment.monthly_fee)
                    : "N/A",
                given: payment.given_amount
                    ? formatCurrency(payment.given_amount)
                    : "N/A",
                status:
                    payment.payment_status === 1 ? "Оплачено" : "Не оплачено",
                date: payment.date_of_payment
                    ? formatDate(payment.date_of_payment)
                    : "N/A",
            })) || [],

        // Payment history
        payments_count: contractData?.payments?.length || 0,
        payments:
            contractData?.payments?.map((payment: any) => ({
                amount: payment.amount ? formatCurrency(payment.amount) : "N/A",
                type: payment.payment_type_text || "N/A",
                operator: payment.operator_name || "N/A",
                comments: payment.comments || "Нет комментария",
                date: payment.created_at
                    ? formatDate(payment.created_at)
                    : "N/A",
            })) || [],
    };

    // Monthly payments for specific months (if needed)
    const monthNames: any = {
        1: "январ",
        2: "феврал",
        3: "март",
        4: "апрел",
        5: "май",
        6: "июн",
        7: "июл",
        8: "август",
        9: "сентябр",
        10: "октябр",
        11: "ноябр",
        12: "декабр",
    };

    // Add monthly payments to template data
    if (contractData?.monthlypayments) {
        contractData.monthlypayments.forEach((payment: any) => {
            const monthKey = monthNames[payment.month_of_payment];
            if (monthKey) {
                templateData[monthKey] = payment.monthly_fee
                    ? formatCurrency(payment.monthly_fee)
                    : "0";
            }
        });
    }

    console.log("Template Data:", templateData);
    console.log("QR Code data:", contractData?.qrCode);
    console.log(
        "Pre-fetched QR code:",
        qrCodeData ? "Available" : "Not available"
    );

    // ====== DOCX GENERATE QISMI ======
    try {
        console.log("Fetching template from:", templateUrl);
        let response = await fetch(templateUrl);

        if (!response.ok) {
            throw new Error(
                `Template fetch failed: ${response.status} ${response.statusText}`
            );
        }

        let data = await response.arrayBuffer();
        console.log("Template size:", data.byteLength);

        let zip = new PizZip(data);

        // Image module configuration for QR code - simplified
        const imageModule = new ImageModule({
            centered: false,
            fileType: "docx",
            getImage: function (tagValue: string) {
                console.log("=== IMAGE MODULE DEBUG ===");
                console.log("Tag value received:", tagValue);
                console.log("Tag value type:", typeof tagValue);

                // If we have pre-fetched QR code data, return it
                if (tagValue === "QR_CODE_PLACEHOLDER" && qrCodeData) {
                    console.log("Returning pre-fetched QR code data");
                    return qrCodeData;
                }

                console.log("No valid QR code data found, returning null");
                return null;
            },
            getSize: function () {
                return [100, 100]; // QR kod o'lchami: 100x100 pixel
            },
        });

        let templateDoc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
            modules: [imageModule],
        });

        try {
            console.log("Starting template render...");
            templateDoc.render(templateData);
            console.log("Template rendered successfully");
        } catch (renderError: any) {
            console.error("=== TEMPLATE RENDER ERROR DETAILS ===");
            console.error("Error message:", renderError.message);
            if (renderError.properties && renderError.properties.errors) {
                renderError.properties.errors.forEach(
                    (err: any, index: number) => {
                        console.error(`Error ${index + 1}:`, {
                            message: err.message,
                            id: err.id,
                            context: err.context,
                            explanation: err.explanation,
                            stack: err.stack,
                        });
                    }
                );
            }
            console.error("=== END ERROR DETAILS ===");
            console.error("Template rendering error:", renderError);
            if (renderError.properties && renderError.properties.errors) {
                const errorDetails = renderError.properties.errors
                    .map((err: any) => `${err.message} (${err.id})`)
                    .join(", ");
                throw new Error(`Template rendering failed: ${errorDetails}`);
            }
            throw new Error(
                `Template rendering failed: ${renderError.message}`
            );
        }

        console.log("Generating DOCX file...");
        let generatedDoc = templateDoc.getZip().generate({
            type: "blob",
            mimeType:
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            compression: "DEFLATE",
        });
        console.log("DOCX generated, size:", generatedDoc.size);

        console.log("Saving file...");
        saveAs(generatedDoc, `Contract_${templateData.contract_number}.docx`);
        console.log("File saved successfully!");
    } catch (error) {
        console.error("=== DOCX GENERATION ERROR ===");
        console.error("Error type:", typeof error);
        console.error("Error message:", error);
        if (error instanceof Error) {
            console.error("Error stack:", error.stack);
        }
        console.error("=== END ERROR ===");
    }
};

// Test template function (o'zgartirilmagan):
export const testTemplate = async () => {
    try {
        console.log("Testing template...");
        const response = await fetch(templateUrl);

        if (!response.ok) {
            return {
                success: false,
                message: `HTTP ${response.status}: ${response.statusText}`,
            };
        }

        const data = await response.arrayBuffer();
        console.log("Template size:", data.byteLength);

        // Test PizZip
        const zip = new PizZip(data);
        const files = zip.files;
        console.log("ZIP files:", Object.keys(files));

        if (!files["word/document.xml"]) {
            return { success: false, message: "Invalid DOCX structure" };
        }

        // Test Docxtemplater creation
        try {
            const doc = new Docxtemplater(zip, {
                paragraphLoop: true,
                linebreaks: true,
            });
            console.log("Docxtemplater created successfully");

            try {
                doc.render({});
                console.log("Template render test successful");
                return { success: true, message: "Template is valid" };
            } catch (renderError: any) {
                console.error("Template render test failed:", renderError);
                if (renderError.properties && renderError.properties.errors) {
                    const errorDetails = renderError.properties.errors
                        .map((err: any) => {
                            const context = err.context || "unknown";
                            const explanation =
                                err.explanation || "no explanation";
                            return `${err.message} - Context: "${context}" - ${explanation}`;
                        })
                        .join(", ");
                    return {
                        success: false,
                        message: `Template parsing failed: ${errorDetails}`,
                    };
                }
                return {
                    success: false,
                    message: `Template parsing failed: ${renderError.message}`,
                };
            }
        } catch (docError: any) {
            console.error("Docxtemplater error:", docError);
            if (docError.properties && docError.properties.errors) {
                const errorDetails = docError.properties.errors
                    .map((err: any) => `${err.message} (${err.id})`)
                    .join(", ");
                return {
                    success: false,
                    message: `Template parsing failed: ${errorDetails}`,
                };
            }
            return {
                success: false,
                message: `Template parsing failed: ${docError.message}`,
            };
        }
    } catch (error: any) {
        return { success: false, message: error.message };
    }
};

export default generateChequeFromData;
