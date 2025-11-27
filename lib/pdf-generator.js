import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Genera un PDF del reporte avanzado
 * @param {Object} reportData - Datos del reporte avanzado
 * @param {string} period - Período del reporte (today, yesterday, week, month)
 * @returns {Promise<Buffer>} - Buffer del PDF generado
 */
export async function generateReportPDF(reportData, period = 'today') {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Mapeo de períodos
  const periodLabels = {
    today: 'Hoy',
    yesterday: 'Ayer',
    week: 'Últimos 7 días',
    month: 'Este mes'
  };
  const periodLabel = periodLabels[period] || 'Hoy';

  // Título
  doc.setFontSize(20);
  doc.setTextColor(147, 51, 234); // Purple
  doc.text('Reportes Avanzados', pageWidth / 2, yPosition + 10, { align: 'center' });
  yPosition += 10;

  // Período
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`Período: ${periodLabel}`, pageWidth / 2, yPosition + 5, { align: 'center' });
  yPosition += 20;

  // Resumen Financiero
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('Resumen Financiero', 14, yPosition);
  yPosition += 10;

  const formatCurrency = (amount) => `$${amount.toFixed(2)}`;

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Ventas Totales:', 14, yPosition);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(reportData.summary.totalSales), 80, yPosition);
  yPosition += 7;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Rentabilidad (Margen Bruto):', 14, yPosition);
  doc.setTextColor(0, 150, 0);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(reportData.summary.grossProfit), 80, yPosition);
  yPosition += 7;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Ticket Promedio:', 14, yPosition);
  doc.setTextColor(99, 102, 241);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(reportData.summary.averageTicket), 80, yPosition);
  yPosition += 7;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Total de Transacciones:', 14, yPosition);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text(reportData.summary.totalTransactions.toString(), 80, yPosition);
  yPosition += 7;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Gastos:', 14, yPosition);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(reportData.summary.totalExpenses || 0), 80, yPosition);
  yPosition += 15;

  // Tendencia Semanal
  if (reportData.weeklyTrend && reportData.weeklyTrend.length > 0) {
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('Tendencia de Ventas (7 días)', 14, yPosition);
    yPosition += 10;

    const trendData = reportData.weeklyTrend.map(item => [
      item.day,
      formatCurrency(item.revenue),
      item.transactions.toString()
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Día', 'Ingresos', 'Transacciones']],
      body: trendData,
      theme: 'striped',
      headStyles: { fillColor: [147, 51, 234], textColor: 255 },
      styles: { fontSize: 9 },
      margin: { left: 14, right: 14 }
    });

    yPosition = doc.lastAutoTable.finalY + 10;
  }

  // Métodos de Pago
  if (reportData.paymentMethods && reportData.paymentMethods.length > 0) {
    if (yPosition > pageHeight - 50) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('Métodos de Pago', 14, yPosition);
    yPosition += 10;

    const paymentData = reportData.paymentMethods.map(item => [
      item.name,
      formatCurrency(item.value),
      `${item.percentage.toFixed(1)}%`,
      item.count.toString()
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Método', 'Monto', 'Porcentaje', 'Transacciones']],
      body: paymentData,
      theme: 'striped',
      headStyles: { fillColor: [147, 51, 234], textColor: 255 },
      styles: { fontSize: 9 },
      margin: { left: 14, right: 14 }
    });

    yPosition = doc.lastAutoTable.finalY + 10;
  }

  // Rendimiento de Inventario
  if (reportData.inventory) {
    if (yPosition > pageHeight - 50) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('Rendimiento de Inventario', 14, yPosition);
    yPosition += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Producto Estrella (Mayor Ingresos):', 14, yPosition);
    yPosition += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    if (reportData.inventory.starProduct && reportData.inventory.starProduct.name !== 'N/A') {
      doc.text(`Nombre: ${reportData.inventory.starProduct.name}`, 20, yPosition);
      yPosition += 6;
      doc.text(`Ingresos: ${formatCurrency(reportData.inventory.starProduct.revenue)}`, 20, yPosition);
      yPosition += 10;
    } else {
      doc.text('No hay datos disponibles', 20, yPosition);
      yPosition += 10;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Producto de Mayor Rotación:', 14, yPosition);
    yPosition += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    if (reportData.inventory.topRotationProduct && reportData.inventory.topRotationProduct.name !== 'N/A') {
      doc.text(`Nombre: ${reportData.inventory.topRotationProduct.name}`, 20, yPosition);
      yPosition += 6;
      doc.text(`Unidades vendidas: ${reportData.inventory.topRotationProduct.quantity}`, 20, yPosition);
    } else {
      doc.text('No hay datos disponibles', 20, yPosition);
    }
  }

  // Pie de página
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Página ${i} de ${totalPages} - Generado el ${new Date().toLocaleDateString('es-ES')}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Convertir a buffer
  const pdfOutput = doc.output('arraybuffer');
  return Buffer.from(pdfOutput);
}

