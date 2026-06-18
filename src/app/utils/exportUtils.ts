/**
 * Export utilities for generating reports natively without heavy external libraries.
 */

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
  // Using native browser print which allows saving to PDF.
  // In a real application, you might inject a specific print stylesheet here.
  window.print();
}
