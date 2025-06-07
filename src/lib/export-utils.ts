import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface DataItem {
  [key: string]: string | number | null;
}

interface PieDataItem {
  name: string;
  value: number;
}

interface ChartConfig {
  id: string;
  type: 'bar' | 'line' | 'pie';
  title: string;
  xAxis: string;
  yAxis?: string;
  data: DataItem[] | PieDataItem[];
}

interface DatasetSummary {
  rowCount: number;
  columns: string[];
  numericColumns: string[];
  categoricalColumns: string[];
  dateColumns: string[];
  statistics: {
    [key: string]: {
      min?: number;
      max?: number;
      avg?: number;
      uniqueValues?: number;
    };
  };
}

export const exportAsImage = async (element: HTMLElement, fileName: string) => {
  try {
    const canvas = await html2canvas(element, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });
    
    const image = canvas.toDataURL('image/png', 1.0);
    const link = document.createElement('a');
    link.download = `${fileName}.png`;
    link.href = image;
    link.click();
  } catch (error) {
    console.error('Error exporting as image:', error);
    throw error;
  }
};

export async function exportAsPDF(element: HTMLElement, fileName: string) {
  try {
    // Configure html2canvas options for better quality
    const canvas = await html2canvas(element, {
      scale: 2, // Higher scale for better quality
      useCORS: true, // Enable CORS for external images
      logging: false,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      allowTaint: true,
      backgroundColor: '#ffffff',
      onclone: (clonedDoc) => {
        // Ensure all elements are visible in the clone
        const clonedElement = clonedDoc.body.querySelector('.export-mode') as HTMLElement;
        if (clonedElement) {
          clonedElement.style.width = `${element.scrollWidth}px`;
          clonedElement.style.height = `${element.scrollHeight}px`;
          clonedElement.style.position = 'relative';
          clonedElement.style.transform = 'none';
        }
      }
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    let heightLeft = imgHeight;
    let position = 0;
    let pageNumber = 1;

    // Add first page
    pdf.addImage(
      canvas.toDataURL('image/jpeg', 1.0),
      'JPEG',
      0,
      position,
      imgWidth,
      imgHeight,
      '',
      'FAST'
    );
    heightLeft -= pageHeight;

    // Add subsequent pages if content overflows
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(
        canvas.toDataURL('image/jpeg', 1.0),
        'JPEG',
        0,
        position,
        imgWidth,
        imgHeight,
        '',
        'FAST'
      );
      heightLeft -= pageHeight;
      pageNumber++;
    }

    // Save the PDF
    pdf.save(`${fileName}.pdf`);
  } catch (error) {
    console.error('Error in exportAsPDF:', error);
    throw error;
  }
}

export const exportDashboardReport = async (
  fileName: string,
  datasetName: string,
  summary: DatasetSummary,
  charts: ChartConfig[],
  previewData: DataItem[]
) => {
  try {
    const pdf = new jsPDF();
    let yOffset = 20;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - 2 * margin;

    // Helper function to add text with word wrap
    const addWrappedText = (text: string, x: number, y: number, maxWidth: number) => {
      const lines = pdf.splitTextToSize(text, maxWidth);
      pdf.text(lines, x, y);
      return lines.length * 7; // Return height of text block (7 is approx line height)
    };

    // Add header with logo placeholder
    pdf.setFontSize(24);
    pdf.setTextColor(44, 62, 80); // Dark blue color
    pdf.text("DATALOOM - FILE REPORT", margin, yOffset);
    yOffset += 15;

    // Add date and dataset info
    pdf.setFontSize(12);
    pdf.setTextColor(100, 100, 100); // Gray color
    const date = new Date().toLocaleDateString();
    pdf.text(`Generated on: ${date}`, margin, yOffset);
    yOffset += 10;
    pdf.text(`Dataset: ${datasetName}`, margin, yOffset);
    yOffset += 20;

    // Dataset Summary Section
    pdf.setFontSize(16);
    pdf.setTextColor(44, 62, 80);
    pdf.text("Dataset Summary", margin, yOffset);
    yOffset += 10;

    pdf.setFontSize(12);
    pdf.setTextColor(60, 60, 60);
    const summaryText = [
      `Total Records: ${summary.rowCount}`,
      `Total Columns: ${summary.columns.length}`,
      `Numeric Columns: ${summary.numericColumns.length}`,
      `Categorical Columns: ${summary.categoricalColumns.length}`,
      `Date Columns: ${summary.dateColumns.length}`
    ];

    summaryText.forEach(text => {
      pdf.text(text, margin, yOffset);
      yOffset += 7;
    });
    yOffset += 10;

    // Column Statistics Section
    pdf.setFontSize(16);
    pdf.setTextColor(44, 62, 80);
    pdf.text("Column Statistics", margin, yOffset);
    yOffset += 10;

    // Numeric Columns Statistics
    pdf.setFontSize(12);
    pdf.setTextColor(60, 60, 60);
    summary.numericColumns.forEach(column => {
      const stats = summary.statistics[column];
      if (yOffset > pdf.internal.pageSize.getHeight() - 30) {
        pdf.addPage();
        yOffset = 20;
      }
      pdf.text(`${column}:`, margin, yOffset);
      yOffset += 7;
      if (stats) {
        if (stats.min !== undefined) pdf.text(`  Min: ${stats.min}`, margin + 10, yOffset);
        yOffset += 7;
        if (stats.max !== undefined) pdf.text(`  Max: ${stats.max}`, margin + 10, yOffset);
        yOffset += 7;
        if (stats.avg !== undefined) pdf.text(`  Average: ${stats.avg.toFixed(2)}`, margin + 10, yOffset);
        yOffset += 10;
      }
    });

    // Categorical Columns Statistics
    summary.categoricalColumns.forEach(column => {
      const stats = summary.statistics[column];
      if (yOffset > pdf.internal.pageSize.getHeight() - 30) {
        pdf.addPage();
        yOffset = 20;
      }
      pdf.text(`${column}:`, margin, yOffset);
      yOffset += 7;
      if (stats && stats.uniqueValues !== undefined) {
        pdf.text(`  Unique Values: ${stats.uniqueValues}`, margin + 10, yOffset);
        yOffset += 10;
      }
    });

    // Charts Section
    if (charts.length > 0) {
      pdf.addPage();
      yOffset = 20;
      pdf.setFontSize(16);
      pdf.setTextColor(44, 62, 80);
      pdf.text("Data Visualizations", margin, yOffset);
      yOffset += 10;

      // Add chart descriptions
      pdf.setFontSize(12);
      pdf.setTextColor(60, 60, 60);
      charts.forEach(chart => {
        if (yOffset > pdf.internal.pageSize.getHeight() - 30) {
          pdf.addPage();
          yOffset = 20;
        }
        pdf.text(`Chart: ${chart.title}`, margin, yOffset);
        yOffset += 7;
        pdf.text(`Type: ${chart.type.charAt(0).toUpperCase() + chart.type.slice(1)} Chart`, margin + 10, yOffset);
        yOffset += 7;
        pdf.text(`Data: ${chart.yAxis ? `${chart.yAxis} vs ${chart.xAxis}` : chart.xAxis}`, margin + 10, yOffset);
        yOffset += 15;
      });
    }

    // Data Preview Section
    if (previewData.length > 0) {
      pdf.addPage();
      yOffset = 20;
      pdf.setFontSize(16);
      pdf.setTextColor(44, 62, 80);
      pdf.text("Data Preview", margin, yOffset);
      yOffset += 15;

      // Create table header
      const columns = Object.keys(previewData[0]);
      const maxRowsPerPage = 20;
      let currentRow = 0;

      while (currentRow < Math.min(previewData.length, 50)) { // Limit to 50 rows
        if (currentRow % maxRowsPerPage === 0 && currentRow > 0) {
          pdf.addPage();
          yOffset = 20;
        }

        // Add table rows
        const row = previewData[currentRow];
        let xPos = margin;
        columns.forEach((col, index) => {
          const value = row[col]?.toString() || '';
          const maxColWidth = contentWidth / columns.length;
          const truncatedValue = value.length > 15 ? value.substring(0, 12) + '...' : value;
          pdf.text(truncatedValue, xPos, yOffset);
          xPos += maxColWidth;
        });
        yOffset += 7;
        currentRow++;
      }
    }

    // Save the PDF
    pdf.save(`${fileName}.pdf`);
  } catch (error) {
    console.error('Error generating dashboard report:', error);
    throw error;
  }
}; 