import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";

export interface ContractData {
    contract_number: string;
    object_address: string;
    client_name: string;
    business_name: string;
    contract_type: string;
    contract_tarif: string;
    contract_plan_months: number;
    contract_price: number;
    contract_date: string;
    plan: Array<{
        date_of_payment: string;
        monthly_fee: number;
    }>;
    laboratory: Array<{
        tests_name: string;
    }>;
}

export const generateContractDocx = async (
    templateUrl: string,
    contractData: ContractData
): Promise<Blob> => {
    try {
        // DOCX shablonini yuklash
        const response = await fetch(templateUrl);
        const templateArrayBuffer = await response.arrayBuffer();

        // PizZip bilan DOCX faylini ochish
        const zip = new PizZip(templateArrayBuffer);

        // Docxtemplater yaratish
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
        });

        // Shartnoma ma'lumotlarini shablonga joylash
        const templateData = {
            contract_number: contractData.contract_number,
            object_address: contractData.object_address,
            client_name: contractData.client_name,
            business_name: contractData.business_name,
            contract_type: contractData.contract_type,
            contract_tarif: contractData.contract_tarif,
            contract_plan_months: contractData.contract_plan_months,
            contract_price: contractData.contract_price.toLocaleString("uz-UZ"),
            contract_date: new Date(
                contractData.contract_date
            ).toLocaleDateString("uz-UZ"),
            total_amount: contractData.contract_price.toLocaleString("uz-UZ"),

            // To'lov rejasi
            payment_plans: contractData.plan.map((plan, index) => ({
                index: index + 1,
                date: new Date(plan.date_of_payment).toLocaleDateString(
                    "uz-UZ"
                ),
                amount: plan.monthly_fee.toLocaleString("uz-UZ"),
            })),

            // Laboratoriya testlari
            lab_tests: contractData.laboratory.map((lab, index) => ({
                index: index + 1,
                test_name: lab.tests_name,
            })),

            // Joriy sana
            current_date: new Date().toLocaleDateString("uz-UZ"),

            // Shartnoma turi matni
            contract_type_text: getContractTypeText(contractData.contract_type),
            contract_tarif_text: getContractTarifText(
                contractData.contract_tarif
            ),
        };

        // Shablonga ma'lumotlarni joylash
        doc.render(templateData);

        // DOCX faylini yaratish
        const output = doc.getZip().generate({ type: "blob" });

        return output;
    } catch (error) {
        console.error("DOCX yaratishda xatolik:", error);
        throw new Error("DOCX faylini yaratib bo'lmadi");
    }
};

export const downloadContractDocx = async (
    templateUrl: string,
    contractData: ContractData,
    filename: string = "shartnoma.docx"
): Promise<void> => {
    try {
        const docxBlob = await generateContractDocx(templateUrl, contractData);
        saveAs(docxBlob, filename);
    } catch (error) {
        console.error("DOCX yuklab olishda xatolik:", error);
        throw error;
    }
};

export const uploadContractDocx = async (
    contractData: ContractData,
    templateUrl: string,
    uploadUrl: string,
    token: string
): Promise<any> => {
    try {
        // DOCX faylini yaratish
        const docxBlob = await generateContractDocx(templateUrl, contractData);

        // FormData yaratish
        const formData = new FormData();
        formData.append("contract_file", docxBlob, "shartnoma.docx");
        formData.append("contract_data", JSON.stringify(contractData));

        // Backendga yuklash
        const response = await fetch(uploadUrl, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("DOCX yuklashda xatolik:", error);
        throw error;
    }
};

// Yordamchi funksiyalar
const getContractTypeText = (type: string | number): string => {
    const types: { [key: string]: string } = {
        "1": "Yer osti suvlarini o'rganish",
        "2": "Yer usti suvlarini o'rganish",
        "3": "Atrof-muhit monitoringi",
        "4": "Boshqa xizmatlar",
    };
    return types[type.toString()] || "Noma'lum";
};

const getContractTarifText = (tarif: string | number): string => {
    const tarifs: { [key: string]: string } = {
        "1": "Standart",
        "2": "Premium",
        "3": "VIP",
    };
    return tarifs[tarif.toString()] || "Noma'lum";
};
