import { useMemo } from "react";
import { generateArucoSvg } from "@/lib/arucoGenerator";

interface ArucoMarkerSvgProps {
  /** ArUco marker ID (0-249) */
  id: number;
  /** Rendered size in pixels (default 110) */
  size?: number;
  /** Additional CSS class names */
  className?: string;
}

/**
 * Renders an ArUco marker as inline SVG.
 * Drop-in replacement for QRCodeSVG on option cards.
 */
export const ArucoMarkerSvg = ({ id, size = 110, className }: ArucoMarkerSvgProps) => {
  const svgHtml = useMemo(() => generateArucoSvg(id, size), [id, size]);

  return (
    <div
      className={className}
      style={{ width: size, height: size, lineHeight: 0 }}
      dangerouslySetInnerHTML={{ __html: svgHtml }}
    />
  );
};

export default ArucoMarkerSvg;
