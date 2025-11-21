"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toPng } from 'html-to-image';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Calendar, Download, TrendingUp, TrendingDown,
  DollarSign, Users, FileText, BarChart3,
  AlertTriangle, CheckCircle, Info, X
} from 'lucide-react';

const COLORS = ['#0891b2', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface BalanceData {
  summary: {
    totalSales: number;
    totalPaidSales: number;
    totalDebts: number;
    totalTransactions: number;
    averageTicket: number;
    grossProfit: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;
    totalRevenue: number;
    estimatedCost: number;
  };
  charts: {
    dailySales: Array<{ date: string; sales: number; cost: number; profit: number; transactions: number }>;
    paymentMethods: Array<{ method: string; total: number; count: number }>;
    weeklyTrend: Array<{ day: string; sales: number; transactions: number }>;
    topProducts: Array<{ _id: string; totalQuantity: number; totalRevenue: number }>;
  };
  topProducts: Array<{
    _id: string;
    totalQuantity: number;
    totalRevenue: number;
    averagePrice: number;
  }>;
  paymentMethods: Array<{
    _id: string;
    total: number;
    count: number;
  }>;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  period: string;
}

const BalancePage = () => {
  const [balanceData, setBalanceData] = useState<BalanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'success' | 'warning' | 'error' | 'info';
    message: string;
    timestamp: Date;
  }>>([]);
  const reportRef = useRef<HTMLDivElement>(null);

  const periodOptions = [
    { value: 'today', label: 'Hoy' },
    { value: 'yesterday', label: 'Ayer' },
    { value: 'week', label: 'Esta Semana' },
    { value: 'month', label: 'Este Mes' },
    { value: 'year', label: 'Este Año' },
    { value: 'custom', label: 'Personalizado' }
  ];

  const fetchBalanceData = useCallback(async () => {
    try {
      setLoading(true);
      let url = `/api/balance?period=${selectedPeriod}`;

      if (selectedPeriod === 'custom') {
        url += `&startDate=${customDateRange.startDate}&endDate=${customDateRange.endDate}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setBalanceData(data.data);

        const newNotifications = [];

        if (data.data.summary.totalDebts > data.data.summary.totalSales * 0.3) {
          newNotifications.push({
            id: `debt-${Date.now()}`,
            type: 'warning' as const,
            message: `Las deudas representan el ${((data.data.summary.totalDebts / data.data.summary.totalSales) * 100).toFixed(0)}% de las ventas totales`,
            timestamp: new Date()
          });
        }

        if (data.data.summary.profitMargin > 40) {
          newNotifications.push({
            id: `profit-${Date.now()}`,
            type: 'success' as const,
            message: `¡Excelente margen de ganancia del ${data.data.summary.profitMargin.toFixed(1)}%!`,
            timestamp: new Date()
          });
        } else if (data.data.summary.profitMargin < 15) {
          newNotifications.push({
            id: `lowprofit-${Date.now()}`,
            type: 'warning' as const,
            message: `Margen de ganancia bajo: ${data.data.summary.profitMargin.toFixed(1)}%`,
            timestamp: new Date()
          });
        }

        if (data.data.summary.totalTransactions === 0) {
          newNotifications.push({
            id: `notrans-${Date.now()}`,
            type: 'info' as const,
            message: 'No hay transacciones en el período seleccionado',
            timestamp: new Date()
          });
        }

        setNotifications(newNotifications);
      }
    } catch (error) {
      console.error('Error fetching balance data:', error);
      setNotifications([{
        id: `error-${Date.now()}`,
        type: 'error',
        message: 'Error al cargar los datos del balance',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod, customDateRange]);

  useEffect(() => {
    fetchBalanceData();
  }, [fetchBalanceData]);

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    setShowCustomDate(period === 'custom');
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5" />;
      case 'warning': return <AlertTriangle className="w-5 h-5" />;
      case 'error': return <AlertTriangle className="w-5 h-5" />;
      case 'info': return <Info className="w-5 h-5" />;
      default: return <Info className="w-5 h-5" />;
    }
  };

  const getNotificationColors = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200 text-green-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error': return 'bg-red-50 border-red-200 text-red-800';
      case 'info': return 'bg-blue-50 border-blue-200 text-blue-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-SV', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const loadImage = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = url;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
    });
  };

  const exportToPDF = async () => {
    if (!reportRef.current || !balanceData) return;

    try {
      setExportingPDF(true);

      let logoData = null;
      try {
        logoData = await loadImage('/assets/images/logo.png');
      } catch (e) {
        console.warn('Could not load logo', e);
      }

      const imgData = await toPng(reportRef.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 1.5,
        filter: (node) => {
          return node.id !== 'pdf-exclude-summary';
        }
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const headerColor = [8, 145, 178];
      pdf.setFillColor(headerColor[0], headerColor[1], headerColor[2]);
      pdf.rect(0, 0, pdfWidth, 40, 'F');

      if (logoData) {
        const logoWidth = 30;
        const logoHeight = 30;
        pdf.addImage(logoData, 'PNG', 15, 5, logoWidth, logoHeight);
      }

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.text('Reporte Financiero', logoData ? 50 : 20, 20);

      pdf.setFontSize(12);
      pdf.text(`Generado: ${format(new Date(), "d 'de' MMMM, yyyy HH:mm", { locale: es })}`, logoData ? 50 : 20, 30);

      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(pdfWidth - 70, 10, 60, 20, 3, 3, 'F');
      pdf.setTextColor(8, 145, 178);
      pdf.setFontSize(10);
      pdf.text('Período:', pdfWidth - 65, 16);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      const periodLabel = periodOptions.find(p => p.value === selectedPeriod)?.label || selectedPeriod;
      pdf.text(periodLabel, pdfWidth - 65, 24);

      let currentY = 50;

      pdf.setTextColor(50, 50, 50);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Resumen Financiero', 15, currentY);
      currentY += 10;

      const summaryData = [
        ['Ventas Totales', formatCurrency(balanceData.summary.totalSales)],
        ['Ganancia Bruta', formatCurrency(balanceData.summary.grossProfit)],
        ['Gastos Operativos', formatCurrency(balanceData.summary.totalExpenses)],
        ['Ganancia Neta', formatCurrency(balanceData.summary.netProfit)],
        ['Margen', `${balanceData.summary.profitMargin.toFixed(1)}%`],
        ['Deudas', formatCurrency(balanceData.summary.totalDebts)]
      ];

      const cardWidth = (pdfWidth - 40) / 2;
      const cardHeight = 12;

      summaryData.forEach((item, index) => {
        const x = 15 + (index % 2) * (cardWidth + 10);
        const y = currentY + Math.floor(index / 2) * (cardHeight + 5);

        pdf.setFillColor(245, 247, 250);
        pdf.roundedRect(x, y, cardWidth, cardHeight, 2, 2, 'F');

        pdf.setFontSize(10);
        pdf.setTextColor(100, 100, 100);
        pdf.setFont('helvetica', 'normal');
        pdf.text(item[0], x + 5, y + 8);

        pdf.setFontSize(11);
        pdf.setTextColor(30, 30, 30);
        pdf.setFont('helvetica', 'bold');
        pdf.text(item[1], x + cardWidth - 5, y + 8, { align: 'right' });
      });

      currentY += Math.ceil(summaryData.length / 2) * (cardHeight + 5) + 10;

      pdf.setFontSize(14);
      pdf.setTextColor(8, 145, 178);
      pdf.text('Métodos de Pago', 15, currentY);
      currentY += 5;

      const paymentHeaders = [['Método', 'Transacciones', 'Total']];
      const paymentRows = balanceData.paymentMethods.map(pm => [
        pm._id === 'cash' ? 'Efectivo' : pm._id === 'card' ? 'Tarjeta' : pm._id === 'transfer' ? 'Transferencia' : 'Otro',
        pm.count,
        formatCurrency(pm.total)
      ]);

      autoTable(pdf, {
        startY: currentY,
        head: paymentHeaders,
        body: paymentRows,
        theme: 'grid',
        headStyles: { fillColor: [8, 145, 178], textColor: 255 },
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: { 2: { halign: 'right' } },
        margin: { left: 15, right: 15 }
      });

      currentY = (pdf as any).lastAutoTable.finalY + 15;

      pdf.setFontSize(14);
      pdf.setTextColor(8, 145, 178);
      pdf.text('Productos Más Vendidos', 15, currentY);
      currentY += 5;

      const productHeaders = [['Producto', 'Cantidad', 'Precio Prom.', 'Total']];
      const productRows = balanceData.topProducts.slice(0, 10).map(p => [
        p._id,
        p.totalQuantity,
        formatCurrency(p.averagePrice),
        formatCurrency(p.totalRevenue)
      ]);

      autoTable(pdf, {
        startY: currentY,
        head: productHeaders,
        body: productRows,
        theme: 'grid',
        headStyles: { fillColor: [8, 145, 178], textColor: 255 },
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' } },
        margin: { left: 15, right: 15 }
      });

      currentY = (pdf as any).lastAutoTable.finalY + 15;

      if (currentY + 100 > pdfHeight) {
        pdf.addPage();
        currentY = 20;
      }

      pdf.setFontSize(14);
      pdf.setTextColor(8, 145, 178);
      pdf.text('Gráficos Detallados', 15, currentY);
      currentY += 10;

      const imgProps = pdf.getImageProperties(imgData);
      const pdfImgWidth = pdfWidth - 30;
      const pdfImgHeight = (imgProps.height * pdfImgWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 15, currentY, pdfImgWidth, pdfImgHeight);

      const pageCount = (pdf as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(
          `Página ${i} de ${pageCount} - Multiciber Dashboard`,
          pdfWidth / 2,
          pdfHeight - 10,
          { align: 'center' }
        );
      }

      pdf.save(`balance-${selectedPeriod}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Hubo un error al generar el PDF. Por favor intenta de nuevo.');
    } finally {
      setExportingPDF(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Balance Financiero</h1>
            <p className="text-gray-500">Resumen de ingresos, gastos y rentabilidad</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="flex bg-white rounded-lg shadow-sm p-1 border border-gray-200">
              {periodOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handlePeriodChange(option.value)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${selectedPeriod === option.value
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <button
              onClick={exportToPDF}
              disabled={exportingPDF || loading}
              className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium shadow-sm transition-colors disabled:opacity-50"
            >
              {exportingPDF ? (
                <span className="animate-pulse">Generando...</span>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar PDF
                </>
              )}
            </button>
          </div>
        </div>

        {notifications.length > 0 && (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-center justify-between p-4 rounded-lg border ${getNotificationColors(notification.type)}`}
              >
                <div className="flex items-center space-x-3">
                  {getNotificationIcon(notification.type)}
                  <span className="font-medium">{notification.message}</span>
                </div>
                <button
                  onClick={() => dismissNotification(notification.id)}
                  className="p-1 hover:bg-black/5 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {showCustomDate && (
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-wrap gap-4 items-end animate-in fade-in slide-in-from-top-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
              <input
                type="date"
                value={customDateRange.startDate}
                onChange={(e) => setCustomDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm p-2 border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
              <input
                type="date"
                value={customDateRange.endDate}
                onChange={(e) => setCustomDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm p-2 border"
              />
            </div>
            <button
              onClick={fetchBalanceData}
              className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 font-medium shadow-sm"
            >
              Aplicar Filtro
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          </div>
        ) : balanceData ? (
          <div ref={reportRef} className="space-y-6 bg-gray-50 p-4 rounded-xl">
            <div id="pdf-exclude-summary" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-teal-100 p-3 rounded-lg">
                    <DollarSign className="w-6 h-6 text-teal-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-500">Ventas Totales</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(balanceData.summary.totalSales)}</h3>
                <p className="text-sm text-teal-600 mt-1 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {balanceData.summary.totalTransactions} transacciones
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-500">Ganancia Neta</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(balanceData.summary.netProfit)}</h3>
                <p className={`text-sm mt-1 flex items-center ${balanceData.summary.profitMargin >= 30 ? 'text-green-600' : 'text-yellow-600'}`}>
                  {balanceData.summary.profitMargin >= 30 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                  {balanceData.summary.profitMargin.toFixed(1)}% Margen
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-orange-100 p-3 rounded-lg">
                    <FileText className="w-6 h-6 text-orange-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-500">Gastos Operativos</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(balanceData.summary.totalExpenses)}</h3>
                <p className="text-sm text-gray-500 mt-1">Del período</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-red-100 p-3 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-500">Deudas Pendientes</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(balanceData.summary.totalDebts)}</h3>
                <p className="text-sm text-red-600 mt-1">Por cobrar</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 md:p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="bg-teal-100 p-1.5 rounded-lg">
                    <BarChart3 className="w-4 h-4 text-teal-600" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900">Ventas Diarias</h3>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={balanceData.charts.dailySales}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [formatCurrency(value), 'Ventas']} />
                    <Bar dataKey="sales" fill="#0891b2" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 md:p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="bg-purple-100 p-1.5 rounded-lg">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900">Rentabilidad Diaria</h3>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={balanceData.charts.dailySales}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0891b2" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#0891b2" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" />
                    <YAxis />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Area type="monotone" dataKey="sales" name="Ingresos" stroke="#0891b2" fillOpacity={1} fill="url(#colorSales)" />
                    <Area type="monotone" dataKey="profit" name="Ganancia Neta" stroke="#10b981" fillOpacity={1} fill="url(#colorProfit)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 md:p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="bg-blue-100 p-1.5 rounded-lg">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900">Métodos de Pago</h3>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={balanceData.charts.paymentMethods}
                      cx="50%"
                      cy="40%"
                      outerRadius={70}
                      dataKey="total"
                      label={false}
                    >
                      {balanceData.charts.paymentMethods.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [formatCurrency(value), 'Total']} />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      formatter={(value) => <span style={{ fontSize: '12px' }}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 md:p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="bg-green-100 p-1.5 rounded-lg">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900">Tendencia Semanal</h3>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={balanceData.charts.weeklyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [formatCurrency(value), 'Ventas']} />
                    <Line type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 md:p-6 col-span-1 lg:col-span-2">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="bg-orange-100 p-1.5 rounded-lg">
                    <FileText className="w-4 h-4 text-orange-600" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900">Productos Más Vendidos</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {balanceData.charts.topProducts.map((product: { _id: string; totalQuantity: number; totalRevenue: number }, index: number) => (
                    <div key={product._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className="bg-teal-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 truncate max-w-[150px]">{product._id}</p>
                          <p className="text-xs text-gray-500">{product.totalQuantity} unidades</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-teal-700">{formatCurrency(product.totalRevenue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No hay datos disponibles para el período seleccionado.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default BalancePage;