import jsPDF from 'jspdf';

/**
 * PDF Adaptive Font & Text Layout Engine
 * Provides helpers for dynamic text wrapping, font scaling, height calculations,
 * and safe collision-free rendering on jsPDF documents.
 */

export interface AdaptiveTextResult {
  lines: string[];
  fontSize: number;
  lineHeightMm: number;
  totalHeightMm: number;
}

/**
 * Calculates optimal font size and wrapped lines so that text fits within maxWidth
 * without clipping, scaling down from initialFontSize down to minFontSize.
 */
export function getAdaptiveWrappedText(
  doc: jsPDF,
  text: string,
  maxWidthMm: number,
  options: {
    initialFontSize?: number;
    minFontSize?: number;
    fontName?: string;
    fontStyle?: string;
    lineHeightFactor?: number;
    maxLines?: number;
  } = {}
): AdaptiveTextResult {
  const {
    initialFontSize = 9,
    minFontSize = 7,
    fontName = 'helvetica',
    fontStyle = 'normal',
    lineHeightFactor = 1.25,
    maxLines = 6
  } = options;

  const cleanText = (text || '').trim();
  if (!cleanText) {
    return {
      lines: ['-'],
      fontSize: initialFontSize,
      lineHeightMm: (initialFontSize * 0.352778) * lineHeightFactor,
      totalHeightMm: (initialFontSize * 0.352778) * lineHeightFactor
    };
  }

  doc.setFont(fontName, fontStyle);

  let currentSize = initialFontSize;
  const step = 0.5;

  while (currentSize >= minFontSize) {
    doc.setFontSize(currentSize);
    const lines = doc.splitTextToSize(cleanText, maxWidthMm);

    // If fits within maxLines or at minimum font size
    if (lines.length <= maxLines || currentSize <= minFontSize) {
      const lineHeightMm = (currentSize * 0.352778) * lineHeightFactor;
      const totalHeightMm = lines.length * lineHeightMm;
      return {
        lines,
        fontSize: currentSize,
        lineHeightMm,
        totalHeightMm
      };
    }

    currentSize -= step;
  }

  // Fallback with min font size
  doc.setFontSize(minFontSize);
  const lines = doc.splitTextToSize(cleanText, maxWidthMm);
  const lineHeightMm = (minFontSize * 0.352778) * lineHeightFactor;
  return {
    lines,
    fontSize: minFontSize,
    lineHeightMm,
    totalHeightMm: lines.length * lineHeightMm
  };
}

/**
 * Draws wrapped adaptive text and returns the ending Y position (in mm).
 */
export function drawAdaptiveWrappedText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidthMm: number,
  options: {
    initialFontSize?: number;
    minFontSize?: number;
    fontName?: string;
    fontStyle?: string;
    lineHeightFactor?: number;
    align?: 'left' | 'center' | 'right';
    textColor?: [number, number, number];
    maxLines?: number;
  } = {}
): { endY: number; result: AdaptiveTextResult } {
  const {
    align = 'left',
    textColor = [15, 23, 42],
    fontName = 'helvetica',
    fontStyle = 'normal'
  } = options;

  const result = getAdaptiveWrappedText(doc, text, maxWidthMm, options);

  doc.setFont(fontName, fontStyle);
  doc.setFontSize(result.fontSize);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);

  let currentLineY = y;
  result.lines.forEach((line) => {
    doc.text(line, x, currentLineY, { align });
    currentLineY += result.lineHeightMm;
  });

  return {
    endY: currentLineY,
    result
  };
}

/**
 * Scales font size down until a single line of text fits inside maxWidthMm.
 */
export function fitSingleLineFontSize(
  doc: jsPDF,
  text: string,
  maxWidthMm: number,
  initialFontSize = 10,
  minFontSize = 6.5,
  fontName = 'helvetica',
  fontStyle = 'normal'
): number {
  doc.setFont(fontName, fontStyle);
  let size = initialFontSize;
  const step = 0.5;

  while (size >= minFontSize) {
    doc.setFontSize(size);
    const width = doc.getTextWidth(text);
    if (width <= maxWidthMm) {
      return size;
    }
    size -= step;
  }

  return minFontSize;
}
