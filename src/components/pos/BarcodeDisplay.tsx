import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

interface Props {
  value: string;
  width?: number;
  height?: number;
}

export default function BarcodeDisplay({ value, width = 2, height = 50 }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format: "EAN13",
          width,
          height,
          displayValue: true,
          fontSize: 14,
          font: "JetBrains Mono",
          margin: 5,
        });
      } catch {
        // Fallback to CODE128 if EAN13 fails
        JsBarcode(svgRef.current, value, {
          format: "CODE128",
          width,
          height,
          displayValue: true,
          fontSize: 14,
          margin: 5,
        });
      }
    }
  }, [value, width, height]);

  return <svg ref={svgRef} />;
}
