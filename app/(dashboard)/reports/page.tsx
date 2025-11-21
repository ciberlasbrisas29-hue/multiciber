"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, TrendingUp, DollarSign, ShoppingCart, Package, CreditCard, Wallet, Building2, MoreHorizontal, Download } from 'lucide-react';
import { LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, BarChart, Bar } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportData {
  period: string;
  summary: {
    totalSales: number;
    grossProfit: number;
    averageTicket: number;
    totalTransactions: number;
  };
  weeklyTrend: Array<{
    date: string;
    day: string;
    revenue: number;
    transactions: number;
  }>;
  paymentMethods: Array<{
    name: string;
    value: number;
    count: number;
    percentage: number;
  }>;
  inventory: {
    starProduct: {
      id: string | null;
      name: string;
      image: string | null;
      revenue: number;
    } | null;
    topRotationProduct: {
      id: string | null;
      name: string;
      image: string | null;
      quantity: number;
    } | null;
  };
}

const ReportsPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'yesterday' | 'week' | 'month'>('today');

  const periodOptions = [
    { value: 'today', label: 'Hoy' },
    { value: 'yesterday', label: 'Ayer' },
    { value: 'week', label: 'Últimos 7 días' },
    { value: 'month', label: 'Este mes' },
  ];

  const colors = {
    purple: '#9333ea',
    indigo: '#6366f1',
    pink: '#ec4899',
    green: '#10b981',
    blue: '#3b82f6',
    orange: '#f59e0b',
  };

  const pieColors = [colors.purple, colors.indigo, colors.pink, colors.green, colors.blue];

  useEffect(() => {
    fetchReportData();
  }, [selectedPeriod]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/reports/advanced?period=${selectedPeriod}`);
      const result = await response.json();
      
      if (result.success) {
        setReportData(result.data);
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const downloadPDF = async () => {
    if (!reportData) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Cargar logo una vez y reutilizarlo
    let logoBase64: string | null = null;
    try {
      const logoResponse = await fetch('/assets/images/logo.png');
      if (logoResponse.ok) {
        const logoBlob = await logoResponse.blob();
        logoBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = reader.result as string;
            resolve(base64String);
          };
          reader.readAsDataURL(logoBlob);
        });

        // Agregar logo en la primera página (tamaño: 30x30, posición: izquierda)
        doc.addImage(logoBase64, 'PNG', 14, 10, 30, 30);
      }
    } catch (error) {
      console.error('Error loading logo:', error);
    }

    // Título (ajustado para que quede centrado considerando el logo)
    doc.setFontSize(20);
    doc.setTextColor(147, 51, 234); // Purple
    doc.text('Reportes Avanzados', pageWidth / 2, yPosition + 10, { align: 'center' });
    yPosition += 10;

    // Período
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    const periodLabel = periodOptions.find(p => p.value === selectedPeriod)?.label || 'Hoy';
    doc.text(`Período: ${periodLabel}`, pageWidth / 2, yPosition + 5, { align: 'center' });
    yPosition += 20;

    // Resumen Financiero
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Resumen Financiero', 14, yPosition);
    yPosition += 10;

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

      yPosition = (doc as any).lastAutoTable.finalY + 10;
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

      yPosition = (doc as any).lastAutoTable.finalY + 10;
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
      if (reportData.inventory.starProduct) {
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
      if (reportData.inventory.topRotationProduct) {
        doc.text(`Nombre: ${reportData.inventory.topRotationProduct.name}`, 20, yPosition);
        yPosition += 6;
        doc.text(`Unidades vendidas: ${reportData.inventory.topRotationProduct.quantity}`, 20, yPosition);
      } else {
        doc.text('No hay datos disponibles', 20, yPosition);
      }
    }

    // Agregar logo a todas las páginas adicionales (si existe)
    const totalPages = doc.getNumberOfPages();
    if (logoBase64 && totalPages > 1) {
      for (let i = 2; i <= totalPages; i++) {
        doc.setPage(i);
        // Logo más pequeño en páginas adicionales (20x20)
        doc.addImage(logoBase64, 'PNG', 14, 10, 20, 20);
      }
    }

    // Pie de página
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

    // Descargar
    const fileName = `Reporte_Avanzado_${selectedPeriod}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'Efectivo':
        return Wallet;
      case 'Tarjeta':
        return CreditCard;
      case 'Transferencia':
        return Building2;
      default:
        return MoreHorizontal;
    }
  };

  if (loading) {
    return (
      <>
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 mb-6 -mx-6 rounded-b-2xl">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 flex items-center justify-center active:opacity-70"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            <h1 className="text-lg font-bold text-white">Reportes Avanzados</h1>
            <div className="w-10"></div>
          </div>
        </div>
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </>
    );
  }

  if (!reportData) {
    return (
      <>
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 mb-6 -mx-6 rounded-b-2xl">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 flex items-center justify-center active:opacity-70"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            <h1 className="text-lg font-bold text-white">Reportes Avanzados</h1>
            <div className="w-10"></div>
          </div>
        </div>
        <div className="text-center py-20 text-gray-500">
          <p>No se pudieron cargar los datos</p>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Encabezado */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 mb-6 -mx-6 rounded-b-2xl">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center active:opacity-70"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-lg font-bold text-white">Reportes Avanzados</h1>
          <button
            onClick={downloadPDF}
            className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full transition-colors"
            title="Descargar PDF"
          >
            <Download className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Filtros de Período */}
      <div className="mb-6">
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {periodOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedPeriod(option.value as any)}
              className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
                selectedPeriod === option.value
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-purple-300'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Resumen Financiero Diario */}
      <div className="grid grid-cols-1 gap-4 mb-6">
        <div className="bg-white rounded-3xl shadow-lg p-6 border border-purple-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Ventas Totales</p>
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </div>
          <h2 className="text-3xl font-bold text-purple-600">
            {formatCurrency(reportData.summary.totalSales)}
          </h2>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-6 border border-purple-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Rentabilidad (Margen Bruto)</p>
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-green-600">
            {formatCurrency(reportData.summary.grossProfit)}
          </h2>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-6 border border-purple-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Ticket Promedio</p>
            <ShoppingCart className="w-5 h-5 text-indigo-600" />
          </div>
          <h2 className="text-3xl font-bold text-indigo-600">
            {formatCurrency(reportData.summary.averageTicket)}
          </h2>
        </div>
      </div>

      {/* Tendencia Semanal */}
      <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 border border-purple-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Tendencia de Ventas (7 días)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={reportData.weeklyTrend}>
            <XAxis 
              dataKey="day" 
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip 
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '8px'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke={colors.purple} 
              strokeWidth={3}
              dot={{ fill: colors.purple, r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Métodos de Pago */}
      <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 border border-purple-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Métodos de Pago</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={reportData.paymentMethods}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {reportData.paymentMethods.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="flex flex-col justify-center space-y-3">
            {reportData.paymentMethods.map((method, index) => {
              const Icon = getPaymentMethodIcon(method.name);
              return (
                <div key={method.name} className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${pieColors[index % pieColors.length]}20` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: pieColors[index % pieColors.length] }} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{method.name}</p>
                    <p className="text-sm text-gray-600">
                      {formatCurrency(method.value)} ({method.count} transacciones)
                    </p>
                  </div>
                  <span className="text-sm font-bold text-gray-700">
                    {method.percentage.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Rendimiento de Inventario */}
      <div className="grid grid-cols-1 gap-4 mb-6">
        {/* Producto Estrella */}
        {reportData.inventory.starProduct && (
          <div className="bg-white rounded-3xl shadow-lg p-6 border border-purple-100">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mr-4">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Producto Estrella</h3>
                <p className="text-sm text-gray-500">Mayor ingresos generados</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {reportData.inventory.starProduct.image ? (
                <img 
                  src={reportData.inventory.starProduct.image} 
                  alt={reportData.inventory.starProduct.name}
                  className="w-16 h-16 rounded-xl object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
                  <Package className="w-8 h-8 text-purple-600" />
                </div>
              )}
              <div className="flex-1">
                <p className="font-bold text-gray-900 text-lg">
                  {reportData.inventory.starProduct.name}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Ingresos: <span className="font-bold text-green-600">
                    {formatCurrency(reportData.inventory.starProduct.revenue)}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Producto de Mayor Rotación */}
        {reportData.inventory.topRotationProduct && (
          <div className="bg-white rounded-3xl shadow-lg p-6 border border-purple-100">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center mr-4">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Mayor Rotación</h3>
                <p className="text-sm text-gray-500">Más unidades vendidas</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {reportData.inventory.topRotationProduct.image ? (
                <img 
                  src={reportData.inventory.topRotationProduct.image} 
                  alt={reportData.inventory.topRotationProduct.name}
                  className="w-16 h-16 rounded-xl object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                  <Package className="w-8 h-8 text-blue-600" />
                </div>
              )}
              <div className="flex-1">
                <p className="font-bold text-gray-900 text-lg">
                  {reportData.inventory.topRotationProduct.name}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Unidades: <span className="font-bold text-blue-600">
                    {reportData.inventory.topRotationProduct.quantity}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ReportsPage;

