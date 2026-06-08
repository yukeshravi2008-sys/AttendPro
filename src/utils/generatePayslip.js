import jsPDF from 'jspdf';

function fmt(num) {
  return (num || 0).toLocaleString('en-IN');
}

export default function generatePayslip({
  employeeName,
  employeeId,
  designation,
  bankAccount,
  monthName,
  year,
  workingDays,
  presentDays,
  lateDays,
  absentDays,
  leaveDays,
  dailyWage,
  earnedSalary,
  absentDeduction,
  lateDeduction,
  netSalary,
}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pw = doc.internal.pageSize.getWidth();
  const margin = 18;
  const contentW = pw - margin * 2;

  const teal = [20, 184, 166];
  const gray = [100, 116, 139];
  const dark = [31, 41, 55];
  const lightBg = [248, 250, 252];
  const border = [226, 232, 240];

  function rect(x, y, w, h, color, fillColor) {
    if (fillColor) {
      doc.setFillColor(...fillColor);
      doc.rect(x, y, w, h, 'F');
    }
    if (color) {
      doc.setDrawColor(...color);
      doc.rect(x, y, w, h, 'S');
    }
  }

  function setColor(c) { doc.setTextColor(...c); }
  function bold(size) { doc.setFont('helvetica', 'bold'); doc.setFontSize(size); }
  function normal(size) { doc.setFont('helvetica', 'normal'); doc.setFontSize(size); }

  let y = margin;

  // ── HEADER ──
  rect(margin, y, contentW, 38, border, lightBg);

  // Logo circle instead of SVG
  doc.setFillColor(...teal);
  doc.circle(margin + 11, y + 10, 6, 'F');
  doc.setTextColor(255, 255, 255);
  bold(9);
  doc.text('SE', margin + 11, y + 12, { align: 'center' });

  setColor(teal);
  bold(18);
  doc.text('Sudharsan Eletricals', margin + 20, y + 13);

  setColor(gray);
  normal(9);
  doc.text('Chennai, Tamil Nadu', margin + 20, y + 21);

  setColor(dark);
  bold(22);
  doc.text('PAYSLIP', pw - margin - 6, y + 15, { align: 'right' });

  setColor(gray);
  normal(8);
  const genDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  doc.text(`Generated: ${genDate}`, pw - margin - 6, y + 23, { align: 'right' });

  y += 48;

  // ── EMPLOYEE DETAILS ──
  rect(margin, y, contentW, 32, border, lightBg);

  setColor(gray);
  normal(8);
  doc.text('EMPLOYEE DETAILS', margin + 6, y + 6);

  setColor(dark);
  bold(10);
  doc.text(employeeName || '—', margin + 6, y + 16);
  doc.text(`${monthName} ${year}`, margin + contentW / 2, y + 16);

  setColor(gray);
  normal(8);
  doc.text(`ID: ${employeeId || '—'}`, margin + 6, y + 24);
  doc.text(`Designation: ${designation || '—'}`, margin + 6, y + 29);
  doc.text(`Bank A/c: ${bankAccount || '—'}`, margin + contentW / 2, y + 24);

  y += 42;

  // ── ATTENDANCE SUMMARY TABLE ──
  rect(margin, y, contentW, 6, border, teal);
  doc.setTextColor(255, 255, 255);
  bold(9);
  doc.text('ATTENDANCE SUMMARY', margin + 6, y + 4.5);

  y += 6;

  const halfW = contentW / 3;
  const centerX = (col) => margin + col * halfW + halfW / 2;

  const attRows = [
    ['Working Days', String(workingDays || 26)],
    ['Present Days', String(presentDays || 0)],
    ['Absent Days', String(absentDays || 0)],
    ['Late Days', String(lateDays || 0)],
    ['Leave Days', String(leaveDays || 0)],
  ];

  attRows.forEach(([label, value]) => {
    const rowH = 7;
    rect(margin, y, contentW, rowH, border, null);
    setColor(gray);
    normal(8);
    doc.text(label, margin + 6, y + 5);
    setColor(dark);
    bold(10);
    doc.text(value, centerX(1), y + 5, { align: 'center' });
    y += rowH;
  });

  y += 4;

  // ── EARNINGS & DEDUCTIONS ──
  const colW = (contentW - 6) / 2;

  // Earnings header
  rect(margin, y, colW, 6, border, teal);
  doc.setTextColor(255, 255, 255);
  bold(9);
  doc.text('EARNINGS', margin + 6, y + 4.5);

  // Deductions header
  rect(margin + colW + 6, y, colW, 6, border, [239, 68, 68]);
  doc.setTextColor(255, 255, 255);
  doc.text('DEDUCTIONS', margin + colW + 12, y + 4.5);

  y += 6;

  // Basic Salary row
  rect(margin, y, colW, 7, border, null);
  setColor(gray);
  normal(8);
  doc.text('Basic Salary', margin + 6, y + 5);
  setColor(dark);
  bold(10);
  doc.text(`Rs.${fmt(earnedSalary)}`, margin + colW - 6, y + 5, { align: 'right' });

  // Absent Deduction row
  rect(margin + colW + 6, y, colW, 7, border, null);
  setColor(gray);
  normal(8);
  doc.text('Absent Deduction', margin + colW + 12, y + 5);
  doc.setTextColor(220, 38, 38);
  bold(10);
  doc.text(`Rs.${fmt(absentDeduction)}`, margin + colW + 6 + colW - 6, y + 5, { align: 'right' });

  y += 7;

  // Late Deduction row
  rect(margin + colW + 6, y, colW, 7, border, null);
  setColor(gray);
  normal(8);
  doc.text('Late Deduction', margin + colW + 12, y + 5);
  doc.setTextColor(220, 38, 38);
  bold(10);
  doc.text(lateDeduction > 0 ? `Rs.${fmt(lateDeduction)}` : 'Rs.0', margin + colW + 6 + colW - 6, y + 5, { align: 'right' });

  // Total Earnings row
  rect(margin, y, colW, 8, border, [236, 253, 245]);
  setColor(dark);
  bold(9);
  doc.text('Total Earnings', margin + 6, y + 5.5);
  doc.setTextColor(...teal);
  bold(11);
  doc.text(`Rs.${fmt(earnedSalary)}`, margin + colW - 6, y + 5.5, { align: 'right' });

  // Total Deductions row
  const totalDed = (absentDeduction || 0) + (lateDeduction || 0);
  rect(margin + colW + 6, y, colW, 8, border, [254, 242, 242]);
  setColor(dark);
  bold(9);
  doc.text('Total Deductions', margin + colW + 12, y + 5.5);
  doc.setTextColor(220, 38, 38);
  bold(11);
  doc.text(`Rs.${fmt(totalDed)}`, margin + colW + 6 + colW - 6, y + 5.5, { align: 'right' });

  y += 16;

  // ── NET SALARY BOX ──
  rect(margin, y, contentW, 16, border, [236, 253, 245]);
  setColor(dark);
  bold(10);
  doc.text('Net Salary', margin + 6, y + 11);
  doc.setTextColor(...teal);
  bold(24);
  doc.text(`Rs.${fmt(netSalary)}`, pw - margin - 6, y + 11, { align: 'right' });

  y += 24;

  // ── FOOTER ──
  rect(margin, y, contentW, 14, border, lightBg);
  setColor(gray);
  normal(8);
  doc.text('This is a system generated payslip', pw / 2, y + 6, { align: 'center' });
  normal(7);
  doc.text(`Generated on ${genDate} | Sudharsan Eletricals Attendance System`, pw / 2, y + 11, { align: 'center' });

  // Save
  doc.save(`payslip_${monthName}_${year}.pdf`);
}