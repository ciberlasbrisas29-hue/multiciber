"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, TrendingUp, DollarSign, ShoppingCart, Package, CreditCard, Wallet, Building2, MoreHorizontal, Download, BarChart3, Sparkles, AlertCircle } from 'lucide-react';
import { LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, BarChart, Bar, PieLabelRenderProps } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Estilos para animaciones
const reportsStyles = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`;

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
        <style dangerouslySetInnerHTML={{__html: reportsStyles}} />
        <div className="text-white px-6 py-4 flex items-center justify-between rounded-b-2xl mb-6 -mx-6 md:mx-0 md:rounded-2xl shadow-md" style={{ backgroundColor: '#7031f8' }}>
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-lg transition-all active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-5 h-5 opacity-95" />
            <h1 className="text-2xl font-semibold">Reportes</h1>
          </div>
          <div className="w-10"></div>
        </div>
        <div className="flex justify-center items-center py-20">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-2 border-purple-400 opacity-20"></div>
          </div>
        </div>
      </>
    );
  }

  if (!reportData) {
    return (
      <>
        <style dangerouslySetInnerHTML={{__html: reportsStyles}} />
        <div className="text-white px-6 py-4 flex items-center justify-between rounded-b-2xl mb-6 -mx-6 md:mx-0 md:rounded-2xl shadow-md" style={{ backgroundColor: '#7031f8' }}>
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-lg transition-all active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-5 h-5 opacity-95" />
            <h1 className="text-2xl font-semibold">Reportes</h1>
          </div>
          <div className="w-10"></div>
        </div>
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <p className="text-gray-600 font-semibold">No se pudieron cargar los datos</p>
        </div>
      </>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: reportsStyles}} />
      {/* Header */}
      <div className="text-white px-6 py-4 flex items-center justify-between rounded-b-2xl mb-6 -mx-6 md:mx-0 md:rounded-2xl shadow-md" style={{ backgroundColor: '#7031f8' }}>
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-lg transition-all active:scale-95"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="flex items-center space-x-3">
          <BarChart3 className="w-5 h-5 opacity-95" />
          <h1 className="text-2xl font-semibold">Reportes</h1>
        </div>
        <button
          onClick={downloadPDF}
          className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-lg transition-all active:scale-95"
          title="Descargar PDF"
        >
          <Download className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Filtros de Período Mejorados */}
      <div className="mb-6 mx-4">
        <div className="bg-white rounded-3xl shadow-xl p-1.5 border-2 border-purple-100">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            {periodOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedPeriod(option.value as any)}
                className={`px-5 py-3 rounded-2xl font-bold text-sm whitespace-nowrap transition-all duration-200 active:scale-95 shadow-md ${
                  selectedPeriod === option.value
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-purple-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-lg'
                }`}
              >
                {option.value === 'today' ? '📅 ' : option.value === 'yesterday' ? '📆 ' : option.value === 'week' ? '📊 ' : '🗓️ '}
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Resumen Financiero Diario Mejorado */}
      <div className="grid grid-cols-1 gap-4 mb-6 mx-4">
        <div className="bg-gradient-to-br from-purple-50 via-indigo-50 to-pink-50 rounded-3xl shadow-xl p-6 border-2 border-purple-200 relative overflow-hidden">
          {/* Decoración de fondo */}
          <div className="absolute top-0 right-0 w-32 h-32 opacity-20">
            <div className="w-full h-full rounded-full bg-purple-200"></div>
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Ventas Totales</p>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
                    <h2 className="text-2xl font-extrabold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                      {formatCurrency(reportData.summary.totalSales)}
                    </h2>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-3xl shadow-xl p-6 border-2 border-green-200 relative overflow-hidden">
          {/* Decoración de fondo */}
          <div className="absolute top-0 right-0 w-32 h-32 opacity-20">
            <div className="w-full h-full rounded-full bg-green-200"></div>
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Rentabilidad</p>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
                    <h2 className="text-2xl font-extrabold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      {formatCurrency(reportData.summary.grossProfit)}
                    </h2>
            <p className="text-xs text-gray-500 mt-1">Margen Bruto</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 rounded-3xl shadow-xl p-6 border-2 border-indigo-200 relative overflow-hidden">
          {/* Decoración de fondo */}
          <div className="absolute top-0 right-0 w-32 h-32 opacity-20">
            <div className="w-full h-full rounded-full bg-indigo-200"></div>
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Ticket Promedio</p>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
            </div>
                    <h2 className="text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                      {formatCurrency(reportData.summary.averageTicket)}
                    </h2>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 rounded-3xl shadow-xl p-6 border-2 border-orange-200 relative overflow-hidden">
          {/* Decoración de fondo */}
          <div className="absolute top-0 right-0 w-32 h-32 opacity-20">
            <div className="w-full h-full rounded-full bg-orange-200"></div>
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Transacciones</p>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
            </div>
                    <h2 className="text-2xl font-extrabold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                      {reportData.summary.totalTransactions}
                    </h2>
          </div>
        </div>
      </div>

      {/* Tendencia Semanal Mejorada */}
      <div className="bg-white rounded-3xl shadow-xl p-6 mb-6 mx-4 border-2 border-purple-100 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-gray-900">Tendencia de Ventas</h3>
              <p className="text-sm text-gray-500">Últimos 7 días</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={reportData.weeklyTrend}>
              <XAxis 
                dataKey="day" 
                stroke="#6b7280"
                fontSize={12}
                tick={{ fill: '#6b7280' }}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={(value) => `$${value}`}
                tick={{ fill: '#6b7280' }}
              />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '2px solid #e5e7eb',
                  borderRadius: '16px',
                  padding: '12px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                }}
                labelStyle={{ color: '#9333ea', fontWeight: 'bold' }}
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke={colors.purple} 
                strokeWidth={4}
                dot={{ fill: colors.purple, r: 6, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 8, strokeWidth: 2, stroke: '#fff' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Métodos de Pago Mejorados */}
      <div className="bg-white rounded-3xl shadow-xl p-6 mb-6 mx-4 border-2 border-purple-100 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-gray-900">Métodos de Pago</h3>
              <p className="text-sm text-gray-500">Distribución de pagos</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-4 border-2 border-purple-100">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={reportData.paymentMethods}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(props: PieLabelRenderProps) => {
                      const { name, percent } = props;
                      const percentage = percent !== undefined ? percent * 100 : 0;
                      return `${name}: ${percentage.toFixed(1)}%`;
                    }}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {reportData.paymentMethods.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '2px solid #e5e7eb',
                      borderRadius: '16px',
                      padding: '12px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex flex-col justify-center space-y-3">
              {reportData.paymentMethods.map((method, index) => {
                const Icon = getPaymentMethodIcon(method.name);
                return (
                  <div 
                    key={method.name} 
                    className="flex items-center space-x-4 p-4 rounded-2xl bg-gradient-to-r from-white to-gray-50 border-2 border-gray-100 hover:border-purple-200 hover:shadow-lg transition-all duration-200"
                    style={{
                      animation: `slideIn 0.4s ease-out ${index * 0.1}s both`
                    }}
                  >
                    <div 
                      className="w-14 h-14 rounded-xl flex items-center justify-center shadow-md"
                      style={{ backgroundColor: `${pieColors[index % pieColors.length]}20` }}
                    >
                      <Icon className="w-7 h-7" style={{ color: pieColors[index % pieColors.length] }} />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-lg">{method.name}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatCurrency(method.value)} • {method.count} transacciones
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-extrabold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                        {method.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Rendimiento de Inventario Mejorado */}
      <div className="grid grid-cols-1 gap-4 mb-6 mx-4">
        {/* Producto Estrella */}
        {reportData.inventory.starProduct && (
          <div className="bg-gradient-to-br from-yellow-50 via-orange-50 to-amber-50 rounded-3xl shadow-xl p-6 border-2 border-yellow-200 relative overflow-hidden">
            {/* Decoración de fondo */}
            <div className="absolute top-0 right-0 w-40 h-40 opacity-10">
              <div className="w-full h-full rounded-full bg-yellow-300"></div>
            </div>
            <div className="relative z-10">
              <div className="flex items-center mb-5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mr-4 shadow-lg">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900">⭐ Producto Estrella</h3>
                  <p className="text-sm text-gray-600 font-semibold">Mayor ingresos generados</p>
                </div>
              </div>
              <div className="flex items-center space-x-5 bg-white/80 backdrop-blur-sm rounded-2xl p-4 border-2 border-white/50 shadow-lg">
                {reportData.inventory.starProduct.image ? (
                  <img 
                    src={reportData.inventory.starProduct.image} 
                    alt={reportData.inventory.starProduct.name}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-yellow-200 shadow-md"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center border-2 border-purple-200 shadow-md">
                    <Package className="w-10 h-10 text-purple-600" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-extrabold text-gray-900 text-lg mb-2">
                    {reportData.inventory.starProduct.name}
                  </p>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 font-semibold">Ingresos:</span>
                    <span className="text-lg font-extrabold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      {formatCurrency(reportData.inventory.starProduct.revenue)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Producto de Mayor Rotación */}
        {reportData.inventory.topRotationProduct && (
          <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 rounded-3xl shadow-xl p-6 border-2 border-blue-200 relative overflow-hidden">
            {/* Decoración de fondo */}
            <div className="absolute top-0 right-0 w-40 h-40 opacity-10">
              <div className="w-full h-full rounded-full bg-blue-300"></div>
            </div>
            <div className="relative z-10">
              <div className="flex items-center mb-5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center mr-4 shadow-lg">
                  <ShoppingCart className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900">🔄 Mayor Rotación</h3>
                  <p className="text-sm text-gray-600 font-semibold">Más unidades vendidas</p>
                </div>
              </div>
              <div className="flex items-center space-x-5 bg-white/80 backdrop-blur-sm rounded-2xl p-4 border-2 border-white/50 shadow-lg">
                {reportData.inventory.topRotationProduct.image ? (
                  <img 
                    src={reportData.inventory.topRotationProduct.image} 
                    alt={reportData.inventory.topRotationProduct.name}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-blue-200 shadow-md"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center border-2 border-blue-200 shadow-md">
                    <Package className="w-10 h-10 text-blue-600" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-extrabold text-gray-900 text-lg mb-2">
                    {reportData.inventory.topRotationProduct.name}
                  </p>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 font-semibold">Unidades:</span>
                    <span className="text-lg font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      {reportData.inventory.topRotationProduct.quantity}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ReportsPage;

