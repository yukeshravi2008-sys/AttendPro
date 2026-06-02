import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const exportToCSV = (data, filename) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, `${filename}.csv`);
};

export const exportToExcel = (data, filename) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

  const colWidths = Object.keys(data[0] || {}).map((key) => ({
    wch: Math.max(key.length, ...data.map(row => String(row[key] || '').length)) + 2,
  }));
  ws['!cols'] = colWidths;

  XLSX.writeFile(wb, `${filename}.xlsx`);
};

export const exportToPDF = (data, columns, filename) => {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(filename, 14, 15);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 22);

  const rows = data.map(row =>
    columns.map(col => row[col.accessor]?.toString() || '')
  );

  doc.autoTable({
    head: [columns.map(col => col.Header)],
    body: rows,
    startY: 28,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [29, 158, 117] },
  });

  doc.save(`${filename}.pdf`);
};
