/**
 * Export utilities for generating reports natively without heavy external libraries.
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportToCSV(filename: string, rows: any[][]) {
  const processRow = (row: any[]) => {
    return row
      .map((val) => {
        let innerValue = val === null || val === undefined ? '' : val.toString();
        let result = innerValue.replace(/"/g, '""');
        if (result.search(/("|,|\n)/g) >= 0) result = '"' + result + '"';
        return result;
      })
      .join(',');
  };

  const csvFile = rows.map(processRow).join('\n');
  const blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export function exportToPDF(elementId?: string) {
  // Fallback native browser print
  window.print();
}

export interface PDFExportConfig {
  filename: string;
  reportTitle: string;
  sectionTitle: string;
  periodStart?: string;
  periodEnd?: string;
  columns: string[];
  rows: any[][];
  companyName?: string;
  logoUrl?: string;
  apiBaseUrl?: string;
}

export async function generateStyledPDF(config: PDFExportConfig) {
  // A4 Landscape is often better for data tables, but we'll use landscape layout as default
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  const brandRed = [204, 34, 41];   // Similar to LOLC red
  const brandBlue = [30, 80, 150];  // Similar to LOLC blue
  
  // 1. Logo (Top Left)
  const displayName = config.companyName || "SMART SHOE FACTORY";
  
  if (config.logoUrl && config.apiBaseUrl) {
    try {
      const response = await fetch(`${config.apiBaseUrl}${config.logoUrl}`);
      const blob = await response.blob();
      const base64data = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      // Add dynamic image
      doc.addImage(base64data, margin, 10, 15, 15);
      
      // Text next to dynamic logo
      doc.setTextColor(brandBlue[0], brandBlue[1], brandBlue[2]);
      doc.setFontSize(11);
      doc.text(displayName, margin + 18, 19.5);
    } catch (e) {
      console.error("Failed to load PDF logo", e);
      // Fallback
      doc.setFillColor(brandRed[0], brandRed[1], brandRed[2]);
      doc.rect(margin, 12, 12, 12, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(displayName.charAt(0).toUpperCase() || "S", margin + 4, 19.5);
      doc.setTextColor(brandBlue[0], brandBlue[1], brandBlue[2]);
      doc.setFontSize(11);
      doc.text(displayName, margin + 14, 19.5);
    }
  } else {
    // Red Square Fallback
    doc.setFillColor(brandRed[0], brandRed[1], brandRed[2]);
    doc.rect(margin, 12, 12, 12, 'F');
    // White text in red square
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(displayName.charAt(0).toUpperCase() || "S", margin + 4, 19.5);
    // Blue text next to square
    doc.setTextColor(brandBlue[0], brandBlue[1], brandBlue[2]);
    doc.setFontSize(11);
    doc.text(displayName, margin + 14, 19.5);
  }

  // 2. Header Center (Titles)
  doc.setFontSize(16);
  doc.text(displayName, pageWidth / 2, 16, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(config.reportTitle, pageWidth / 2, 23, { align: 'center' });

  // 3. Header Right (Report Period)
  if (config.periodStart || config.periodEnd) {
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text("REPORT PERIOD", pageWidth - margin, 12, { align: 'right' });
    
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    if (config.periodStart) {
      doc.text(config.periodStart, pageWidth - margin, 17, { align: 'right' });
    }
    if (config.periodStart && config.periodEnd) {
      doc.text("-", pageWidth - margin, 21, { align: 'right' });
    }
    if (config.periodEnd) {
      doc.text(config.periodEnd, pageWidth - margin, 25, { align: 'right' });
    }
  }

  // 4. Horizontal Blue Line
  doc.setDrawColor(brandBlue[0], brandBlue[1], brandBlue[2]);
  doc.setLineWidth(0.8);
  doc.line(margin, 29, pageWidth - margin, 29);

  // 5. Section Title
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.setFont('helvetica', 'bold');
  doc.text(config.sectionTitle, margin, 40);

  // 6. Data Table
  autoTable(doc, {
    startY: 45,
    head: [config.columns],
    body: config.rows,
    theme: 'grid',
    headStyles: {
      fillColor: brandBlue as [number, number, number],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'left'
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: [245, 246, 248]
    },
    margin: { left: margin, right: margin }
  });

  // Save the PDF
  doc.save(`${config.filename}.pdf`);
}
