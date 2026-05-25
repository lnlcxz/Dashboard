// ============================================
// FINDASH — CDN Global Declarations
// ============================================

interface EChartsColorStop {
  offset: number;
  color: string;
}

interface EChartsInstance {
  setOption(option: unknown): void;
  resize(): void;
  dispose(): void;
  isDisposed(): boolean;
  clear(): void;
}

interface EChartsGlobal {
  init(el: HTMLElement, theme?: null, opts?: { renderer: string }): EChartsInstance;
  graphic: {
    LinearGradient: new (
      x: number,
      y: number,
      x2: number,
      y2: number,
      colorStops: EChartsColorStop[],
    ) => unknown;
  };
}

interface XLSXWorksheet {
  [key: string]: unknown;
}

interface XLSXWorkbook {
  SheetNames: string[];
  Sheets: Record<string, XLSXWorksheet>;
}

interface XLSXGlobal {
  read(data: ArrayBuffer, opts: { type: string }): XLSXWorkbook;
  utils: {
    sheet_to_csv(sheet: XLSXWorksheet): string;
  };
}

interface JsPDFInstance {
  internal: { pageSize: { getWidth(): number } };
  setFontSize(size: number): void;
  setTextColor(r: number, g: number, b: number): void;
  text(str: string, x: number, y: number, opts?: { align?: string }): void;
  save(filename: string): void;
}

interface JsPDFConstructor {
  new(): JsPDFInstance;
}

interface LucideGlobal {
  createIcons(): void;
}

interface Window {
    echarts: EChartsGlobal;
    XLSX: XLSXGlobal;
    jspdf: { jsPDF: JsPDFConstructor };
    jsPDF?: JsPDFConstructor;
    lucide: LucideGlobal;
    _catModule?: { getCategoryColor: (cat: string) => string };
  }
  declare const echarts: EChartsGlobal;
  declare const lucide: LucideGlobal;
