
declare global {
  interface Window {
    html2canvas: any;
    jspdf: any;
  }
}

export const generatePdf = (elementId: string, fileName: string): void => {
  const input = document.getElementById(elementId);
  if (!input) {
    console.error(`Element with id ${elementId} not found.`);
    return;
  }

  window.html2canvas(input, { scale: 2 }) // Increase scale for better quality
    .then((canvas: HTMLCanvasElement) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new window.jspdf.jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const ratio = canvasWidth / canvasHeight;
      
      let imgWidth = pdfWidth - 20; // with margin
      let imgHeight = imgWidth / ratio;
      
      if (imgHeight > pdfHeight - 20) {
        imgHeight = pdfHeight - 20;
        imgWidth = imgHeight * ratio;
      }
      
      const x = (pdfWidth - imgWidth) / 2;
      const y = 10; // top margin
      
      pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
      pdf.save(`${fileName}.pdf`);
    })
    .catch((error: any) => {
      console.error("Error generating PDF", error);
    });
};