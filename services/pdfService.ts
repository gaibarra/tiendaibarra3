
// Lazy dynamic imports para reducir tamaño del bundle inicial.
// Se cargan solo al invocar funciones relacionadas con PDF.

interface PdfBuildOptions {
  elementId: string; // Se sigue usando para extraer algunos textos (encabezado / totales)
  scale?: number; // Solo para fallback html2canvas
  marginMm?: number;
  useStructured?: boolean; // Si true intenta construir el PDF con tablas (jsPDF+autoTable) en vez de screenshot
}

/**
 * Genera una instancia jsPDF a partir de un elemento del DOM usando captura tipo imagen.
 * (Solución rápida y estable). Devuelve el objeto jsPDF listo para exportar.
 */
const buildPdfFromElement = async ({ elementId, scale = 2, marginMm = 12, useStructured = true }: PdfBuildOptions) => {
  const el = document.getElementById(elementId);
  if (!el) throw new Error(`Elemento #${elementId} no encontrado`);

  // Intento estructurado: buscar datos dentro del elemento
  if (useStructured) {
    try {
      const [{ jsPDF }, autoTableModule] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable') as any
      ]);

      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const startY = marginMm;

      // Extraer encabezado básico
      const titleEl = el.querySelector('h1');
      const dateEl = Array.from(el.querySelectorAll('p')).find(p => /Fecha:/i.test(p.textContent || ''));
      pdf.setFontSize(16);
      pdf.text((titleEl?.textContent || 'Pedido').trim(), marginMm, startY);
      pdf.setFontSize(10);
      if (dateEl) pdf.text(dateEl.textContent!.trim(), marginMm, startY + 6);

      // Extraer filas de la tabla html existente
      const table = el.querySelector('table');
      let body: any[] = [];
      if (table) {
        const rows = Array.from(table.querySelectorAll('tbody tr'));
        body = rows.map(r => {
          const cells = Array.from(r.querySelectorAll('td')).map(td => (td.textContent || '').replace(/\s+/g, ' ').trim());
          return cells;
        });
      }

      const head = [['Producto', 'Cant.', 'Precio Unit.', 'Total']];
      (autoTableModule as any).default(pdf, {
        head,
        body,
        startY: startY + 12,
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [245,245,245], textColor: 20 },
        theme: 'grid',
        didDrawPage: (data: any) => {
          // Footer con numeración
          const pageNumber = pdf.getNumberOfPages();
            pdf.setFontSize(8);
            pdf.text(
              `Página ${pageNumber}`,
              pageW - marginMm,
              pdf.internal.pageSize.getHeight() - 6,
              { align: 'right' }
            );
        }
      });

      // Total (buscar texto TOTAL: X)
      const totalRowEl = Array.from(el.querySelectorAll('span')).find(s => /TOTAL:/i.test(s.textContent || ''));
      if (totalRowEl) {
        const totalValueEl = totalRowEl.parentElement?.querySelectorAll('span')?.[1];
        const value = totalValueEl?.textContent?.trim() || '';
        const afterTableY = (pdf as any).lastAutoTable.finalY + 8;
        pdf.setFontSize(12);
        pdf.text(`TOTAL: ${value}`, marginMm, afterTableY);
      }

      return pdf;
    } catch (structuredErr) {
      console.warn('[pdfService] Falló modo estructurado, uso fallback screenshot', structuredErr);
    }
  }

  // Fallback screenshot multi-página (html2canvas)
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf')
  ]);
  const canvas: HTMLCanvasElement = await html2canvas(el, { scale, backgroundColor: '#ffffff' });
  const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const printableW = pageW - marginMm * 2;
  const printableH = pageH - marginMm * 2;
  const pxPerMm = canvas.width / printableW;
  const sliceHeightPx = Math.floor(printableH * pxPerMm);
  let offsetY = 0;
  let pageIndex = 0;
  while (offsetY < canvas.height) {
    const remaining = canvas.height - offsetY;
    const currentSliceHeight = Math.min(sliceHeightPx, remaining);
    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = currentSliceHeight;
    const ctx = sliceCanvas.getContext('2d');
    if (!ctx) throw new Error('No se pudo obtener contexto 2D');
    ctx.drawImage(canvas, 0, offsetY, canvas.width, currentSliceHeight, 0, 0, canvas.width, currentSliceHeight);
    const imgData = sliceCanvas.toDataURL('image/png');
    const sliceHeightMm = currentSliceHeight / pxPerMm;
    const imgX = (pageW - printableW) / 2;
    const imgY = marginMm;
    if (pageIndex > 0) pdf.addPage();
    pdf.addImage(imgData, 'PNG', imgX, imgY, printableW, sliceHeightMm);
    offsetY += currentSliceHeight;
    pageIndex += 1;
  }
  return pdf;
};

/**
 * Devuelve un Blob del PDF para poder: previsualizar, subir, etc.
 */
export const getPdfBlob = async (elementId: string): Promise<Blob | null> => {
  try {
    const pdf = await buildPdfFromElement({ elementId });
    return pdf.output('blob');
  } catch (e) {
    console.error('Error creando blob PDF', e);
    return null;
  }
};

/**
 * Devuelve una URL de objeto (ObjectURL) que puedes usar en <iframe>, <embed>, etc.
 * Recuerda revocar la URL cuando ya no se use (URL.revokeObjectURL(url)).
 */
export const getPdfObjectUrl = async (elementId: string): Promise<string | null> => {
  const blob = await getPdfBlob(elementId);
  if (!blob) return null;
  return URL.createObjectURL(blob);
};

/**
 * Versión directa: genera y descarga inmediatamente.
 */
export const generatePdf = async (elementId: string, fileName: string): Promise<void> => {
  try {
  const pdf = await buildPdfFromElement({ elementId, useStructured: true });
    pdf.save(`${fileName}.pdf`);
  } catch (error) {
    console.error('Error generating PDF', error);
  }
};

/**
 * Abre la previsualización nativa del navegador en una nueva pestaña/ventana.
 * Desde ahí el usuario puede imprimir o descargar con los controles integrados.
 */
export const openPdfPreview = async (elementId: string, fileName?: string): Promise<void> => {
  try {
  const pdf = await buildPdfFromElement({ elementId, useStructured: true });
    // bloburl = URL interno que el navegador abre con su visor nativo
    const blobUrl = pdf.output('bloburl');
    const win = window.open(blobUrl, '_blank');
    if (!win) {
      // Fallback: descarga directa si el popup fue bloqueado
      pdf.save(`${fileName || 'documento'}.pdf`);
    }
  } catch (e) {
    console.error('No se pudo abrir la previsualización PDF', e);
  }
};
