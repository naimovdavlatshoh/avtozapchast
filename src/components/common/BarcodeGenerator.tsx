import React, { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

interface BarcodeGeneratorProps {
    value: string;
    width?: number;
    height?: number;
    displayValue?: boolean;
    fontSize?: number;
    margin?: number;
    background?: string;
    lineColor?: string;
    format?: string;
}

const BarcodeGenerator: React.FC<BarcodeGeneratorProps> = ({
    value,
    width = 2,
    height = 100,
    displayValue = true,
    fontSize = 20,
    margin = 10,
    background = "#ffffff",
    lineColor = "#000000",
    format = "CODE128",
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (canvasRef.current && value) {
            try {
                JsBarcode(canvasRef.current, value, {
                    format: format,
                    width: width,
                    height: height,
                    displayValue: displayValue,
                    fontSize: fontSize,
                    margin: margin,
                    background: background,
                    lineColor: lineColor,
                    textAlign: "center",
                    textPosition: "bottom",
                    textMargin: 2,
                });
            } catch (error) {
                console.error("Barcode yaratishda xatolik:", error);
            }
        }
    }, [
        value,
        width,
        height,
        displayValue,
        fontSize,
        margin,
        background,
        lineColor,
        format,
    ]);

    return (
        <div className="flex flex-col items-center">
            <canvas ref={canvasRef} />
        </div>
    );
};

export default BarcodeGenerator;
