"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Calendar, ArrowUp, ArrowDown, Clock,
  TrendingUp, TrendingDown, DollarSign, FileText,
  AlertCircle, CheckCircle, Minus, Plus, X, Wallet
} from 'lucide-react';
import { dashboardService, salesService, expensesService } from '@/services/api';
import SaleDetailModal from '@/components/SaleDetailModal';
import DatePickerModal from '@/components/DatePickerModal';

// Estilos para animaciones
const balanceStyles = `
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
  
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`;

interface Transaction {
  id: string;
  type: 'sale' | 'expense';
  concept: string;
  paymentMethod?: string;
  date: Date;
  amount: number;
  description?: string;
}

interface Debt {
  id: string;
  type: 'receivable' | 'payable';
  concept: string;
  amount: number;
  dueDate?: Date;
  createdAt: Date;
  description?: string;
}

const BalancePage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  
  // Inicializar activeTab basado en el parámetro de la URL
  const [activeTab, setActiveTab] = useState<'activity' | 'debts'>(() => {
    return tabParam === 'debts' ? 'debts' : 'activity';
  });
  const [activeSubTab, setActiveSubTab] = useState<'income' | 'expenses'>('income');
  const [debtSubTab, setDebtSubTab] = useState<'receivable' | 'payable'>('receivable');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dateRange, setDateRange] = useState<'today' | 'yesterday' | 'last7days' | 'custom'>('today');
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0
  });
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [isSaleDetailModalOpen, setIsSaleDetailModalOpen] = useState(false);
  const [loadingSaleDetail, setLoadingSaleDetail] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Actualizar activeTab cuando cambia el parámetro de la URL
  useEffect(() => {
    if (tabParam === 'debts') {
      setActiveTab('debts');
    }
  }, [tabParam]);

  const getDateRange = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    switch (dateRange) {
      case 'today':
        return {
          start: today.toISOString(),
          end: endOfDay.toISOString(),
          label: 'Hoy'
        };
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const endOfYesterday = new Date(yesterday);
        endOfYesterday.setHours(23, 59, 59, 999);
        return {
          start: yesterday.toISOString(),
          end: endOfYesterday.toISOString(),
          label: 'Ayer'
        };
      case 'last7days':
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return {
          start: sevenDaysAgo.toISOString(),
          end: endOfDay.toISOString(),
          label: 'Últimos 7 días'
        };
      case 'custom':
        const customStart = new Date(selectedDate);
        customStart.setHours(0, 0, 0, 0);
        const customEnd = new Date(selectedDate);
        customEnd.setHours(23, 59, 59, 999);
        return {
          start: customStart.toISOString(),
          end: customEnd.toISOString(),
          label: selectedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })
        };
      default:
        return {
          start: today.toISOString(),
          end: endOfDay.toISOString(),
          label: 'Hoy'
        };
    }
  };

  const fetchDailyTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const { start, end } = getDateRange();
      
      // Obtener ventas y gastos recientes
      const [salesResponse, expensesResponse] = await Promise.all([
        dashboardService.getRecentSales(100),
        dashboardService.getRecentExpenses(100)
      ]);

      const formattedTransactions: Transaction[] = [];

      // Procesar ventas (ingresos)
      if (salesResponse.success && salesResponse.data) {
        salesResponse.data.forEach((sale: any) => {
          const saleDate = new Date(sale.createdAt);
          const range = getDateRange();
          const startDate = new Date(range.start);
          const endDate = new Date(range.end);

          if (saleDate >= startDate && saleDate <= endDate && sale.status === 'paid') {
            // Determinar el concepto basado en el tipo de venta
            let concept = '';
            let description = '';
            
            const isFreeSale = sale.type === 'free';
            
            if (isFreeSale) {
              // Para ventas libres, usar concepto o cliente
              if (sale.concept) {
                concept = sale.concept;
              } else if (sale.client?.name) {
                concept = sale.client.name;
              } else if (sale.saleNumber) {
                concept = `Venta #${sale.saleNumber}`;
              } else {
                concept = 'Venta Libre';
              }
              description = sale.saleNumber ? `#${sale.saleNumber}` : '';
            } else {
              // Para ventas de productos, mostrar nombres de productos
              if (sale.items && sale.items.length > 0) {
                // Si hay un solo producto, mostrar su nombre completo
                if (sale.items.length === 1) {
                  const item = sale.items[0];
                  concept = item.productName || item.product?.name || 'Producto';
                  description = sale.saleNumber ? `#${sale.saleNumber}` : '';
                } else {
                  // Si hay múltiples productos, mostrar los primeros 2-3 nombres
                  const productNames = sale.items
                    .slice(0, 3)
                    .map((item: any) => item.productName || item.product?.name || 'Producto')
                    .join(', ');
                  const remaining = sale.items.length - 3;
                  concept = productNames + (remaining > 0 ? ` y ${remaining} más` : '');
                  description = sale.saleNumber ? `#${sale.saleNumber}` : '';
                }
                
                // Si no hay description, agregar información adicional
                if (!description) {
                  description = `${sale.items.length} producto${sale.items.length > 1 ? 's' : ''}`;
                }
              } else {
                // Fallback si no hay items
                if (sale.client?.name) {
                  concept = sale.client.name;
                } else if (sale.saleNumber) {
                  concept = `Venta #${sale.saleNumber}`;
                } else {
                  concept = 'Venta de Productos';
                }
                description = '';
              }
            }

            formattedTransactions.push({
              id: sale._id,
              type: 'sale',
              concept: concept,
              paymentMethod: sale.paymentMethod || 'Efectivo',
              date: saleDate,
              amount: sale.total || 0,
              description: description || undefined
            });
          }
        });
      }

      // Procesar gastos (egresos)
      if (expensesResponse.success && expensesResponse.data) {
        expensesResponse.data.forEach((expense: any) => {
          const expenseDate = new Date(expense.createdAt);
          const range = getDateRange();
          const startDate = new Date(range.start);
          const endDate = new Date(range.end);

          if (expenseDate >= startDate && expenseDate <= endDate && expense.status === 'paid') {
            formattedTransactions.push({
              id: expense._id,
              type: 'expense',
              concept: expense.vendor?.name 
                ? `Gasto: ${expense.vendor.name}` 
                : expense.description 
                  ? expense.description 
                  : expense.category || 'Gasto',
              paymentMethod: expense.paymentMethod || 'Efectivo',
              date: expenseDate,
              amount: expense.amount || 0,
              description: expense.category
            });
          }
        });
      }

      // Ordenar por fecha (más reciente primero)
      formattedTransactions.sort((a, b) => b.date.getTime() - a.date.getTime());

      // Calcular resumen
      const totalIncome = formattedTransactions
        .filter(t => t.type === 'sale')
        .reduce((sum, t) => sum + t.amount, 0);
      const totalExpenses = formattedTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      setTransactions(formattedTransactions);
      setSummary({
        totalIncome,
        totalExpenses,
        balance: totalIncome - totalExpenses
      });
    } catch (err) {
      console.error("Error fetching daily transactions:", err);
    } finally {
      setLoading(false);
    }
  }, [dateRange, selectedDate]);

  const fetchDebts = useCallback(async () => {
    try {
      setLoading(true);
      
      // Obtener ventas y gastos con deudas usando los servicios de API
      const [salesResponse, expensesResponse] = await Promise.allSettled([
        salesService.getSales({ status: 'debt', limit: 100 }),
        expensesService.getExpenses({ status: 'pending', limit: 100 })
      ]);

      const debtsList: Debt[] = [];

      // Procesar deudas por cobrar (ventas con status 'debt')
      if (salesResponse.status === 'fulfilled' && salesResponse.value?.success && salesResponse.value?.data) {
        salesResponse.value.data.forEach((sale: any) => {
          const remainingAmount = (sale.total || 0) - (sale.paidAmount || 0);
          if (remainingAmount > 0) {
            // Priorizar concepto o cliente para ventas libres
            let conceptText = 'Venta';
            if (sale.type === 'free' && sale.concept) {
              conceptText = sale.concept;
            } else if (sale.client?.name) {
              conceptText = `Venta: ${sale.client.name}`;
            } else if (sale.saleNumber) {
              conceptText = `Venta #${sale.saleNumber}`;
            }

            debtsList.push({
              id: sale._id,
              type: 'receivable',
              concept: conceptText,
              amount: remainingAmount,
              dueDate: sale.dueDate ? new Date(sale.dueDate) : undefined,
              createdAt: new Date(sale.createdAt),
              description: sale.type === 'free' 
                ? (sale.client?.name ? `Cliente: ${sale.client.name}` : 'Venta libre')
                : (sale.items?.length > 0 
                ? `${sale.items.length} producto${sale.items.length > 1 ? 's' : ''}`
                  : undefined)
            });
          }
        });
      }

      // Procesar deudas por pagar (gastos con status 'pending')
      if (expensesResponse.status === 'fulfilled' && expensesResponse.value?.success && expensesResponse.value?.data) {
        expensesResponse.value.data.forEach((expense: any) => {
          debtsList.push({
            id: expense._id,
            type: 'payable',
            concept: expense.vendor?.name 
              ? `Gasto: ${expense.vendor.name}` 
              : expense.description 
                ? expense.description 
                : expense.category || 'Gasto',
            amount: expense.amount || 0,
            dueDate: expense.dueDate ? new Date(expense.dueDate) : undefined,
            createdAt: new Date(expense.createdAt),
            description: expense.category
          });
        });
      }

      // Ordenar por fecha de vencimiento o creación
      debtsList.sort((a, b) => {
        const dateA = a.dueDate?.getTime() || a.createdAt.getTime();
        const dateB = b.dueDate?.getTime() || b.createdAt.getTime();
        return dateA - dateB;
      });

      setDebts(debtsList);
    } catch (err) {
      // Silenciar errores - simplemente no mostrar deudas si hay un error
      setDebts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'activity') {
      fetchDailyTransactions();
    } else {
      fetchDebts();
    }
  }, [activeTab, fetchDailyTransactions, fetchDebts]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const filteredTransactions = transactions.filter(t => 
    activeSubTab === 'income' ? t.type === 'sale' : t.type === 'expense'
  );

  const filteredDebts = debts.filter(d => 
    debtSubTab === 'receivable' ? d.type === 'receivable' : d.type === 'payable'
  );

  const { label } = getDateRange();

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: balanceStyles}} />
      <div className="min-h-screen pb-24">
              {/* Header */}
              <div className="text-white px-6 py-4 flex items-center space-x-3 rounded-b-2xl mb-6 -mx-6 md:mx-0 md:rounded-2xl shadow-md" style={{ backgroundColor: '#7031f8' }}>
                <Wallet className="w-5 h-5 opacity-95" />
                <h1 className="text-2xl font-semibold">Balance</h1>
              </div>

        {/* Pestañas Principales Mejoradas */}
        <div className="bg-white rounded-2xl shadow-md p-1.5 mb-6 mx-4 mt-4 border border-gray-200">
          <div className="flex gap-2">
                <button
              onClick={() => setActiveTab('activity')}
              className={`flex-1 py-3.5 text-center font-semibold rounded-xl transition-all duration-200 active:scale-95 ${
                activeTab === 'activity'
                  ? 'text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              style={activeTab === 'activity' ? { backgroundColor: '#7031f8' } : {}}
            >
              Actividad
                </button>
            <button
              onClick={() => setActiveTab('debts')}
              className={`flex-1 py-3.5 text-center font-semibold rounded-xl transition-all duration-200 active:scale-95 ${
                activeTab === 'debts'
                  ? 'text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              style={activeTab === 'debts' ? { backgroundColor: '#7031f8' } : {}}
            >
              Deudas
            </button>
          </div>
        </div>

        {activeTab === 'activity' ? (
          <>
            {/* Tarjeta de Resumen Mejorada */}
            <div className={`rounded-2xl shadow-md p-4 mb-4 mx-4 border overflow-hidden relative ${
              summary.balance < 0 
                ? 'bg-gradient-to-br from-red-50/80 to-orange-50/80 border-red-200/50' 
                : 'bg-purple-50/40 border-purple-200/30'
            }`}>
              <div>
                <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-600 mb-1 flex items-center">
                      <Calendar className="w-3.5 h-3.5 mr-1.5" />
                      Balance del {label}
                    </p>
                    <h2 
                      className={`text-2xl font-bold ${
                        summary.balance < 0 
                          ? 'text-red-500' 
                          : ''
                      }`}
                      style={summary.balance >= 0 ? { color: '#7031f8' } : {}}
                    >
                      {formatCurrency(summary.balance)}
                    </h2>
                </div>
                {summary.balance >= 0 && (
                    <div className="px-2.5 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-semibold flex items-center">
                      <CheckCircle className="w-3 h-3 mr-1" />
                    Positivo
                    </div>
                  )}
                  {summary.balance < 0 && (
                    <div className="px-2.5 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-semibold flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Negativo
                    </div>
                )}
              </div>

                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-200/50">
                  <div className="bg-white/70 rounded-lg p-3 shadow-sm border border-green-200/50 cursor-pointer hover:bg-white/90 transition-colors" onClick={() => setActiveSubTab('income')}>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                  </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-600">Ingresos</p>
                        <p className="text-sm font-bold text-green-600">
                          {formatCurrency(summary.totalIncome)}
                        </p>
                  </div>
                </div>
                  </div>
                  <div className="bg-white/70 rounded-lg p-3 shadow-sm border border-red-200/50 cursor-pointer hover:bg-white/90 transition-colors" onClick={() => setActiveSubTab('expenses')}>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                        <TrendingDown className="w-3.5 h-3.5 text-red-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-600">Egresos</p>
                        <p className="text-sm font-bold text-red-600">
                          {formatCurrency(summary.totalExpenses)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Selector de Período Mejorado */}
            <div className="bg-white rounded-2xl shadow-md p-4 mb-6 mx-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center">
                  <Calendar className="w-4 h-4 mr-1.5 text-gray-500" />
                  Período
                </h3>
                <button
                  type="button"
                  onClick={() => setIsDatePickerOpen(true)}
                  className="p-2 rounded-lg bg-purple-100 hover:bg-purple-200 transition-colors active:scale-95"
                  style={{ color: '#7031f8' }}
                >
                  <Calendar className="w-4 h-4" />
                </button>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {(['today', 'yesterday', 'last7days'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setDateRange(range)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 active:scale-95 ${
                      dateRange === range
                        ? 'text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    style={dateRange === range ? { backgroundColor: '#7031f8' } : {}}
                  >
                    {range === 'today' ? 'Hoy' : range === 'yesterday' ? 'Ayer' : 'Últimos 7 días'}
                  </button>
            ))}
          </div>
            </div>

            {/* Pestañas de Movimientos Mejoradas */}
            <div className="bg-white rounded-2xl shadow-md mb-6 mx-4 border border-gray-200 overflow-hidden">
              <div className="flex bg-gray-50 p-1">
                <button
                  onClick={() => setActiveSubTab('income')}
                  className={`flex-1 py-3 text-center font-semibold transition-all duration-200 rounded-lg ${
                    activeSubTab === 'income'
                      ? 'bg-green-500 text-white shadow-sm'
                      : 'text-gray-600 hover:text-green-600'
                  }`}
                >
                  Ingresos
                </button>
            <button
                  onClick={() => setActiveSubTab('expenses')}
                  className={`flex-1 py-3 text-center font-semibold transition-all duration-200 rounded-lg ${
                    activeSubTab === 'expenses'
                      ? 'bg-red-500 text-white shadow-sm'
                      : 'text-gray-600 hover:text-red-600'
                  }`}
                >
                  Egresos
            </button>
          </div>

              <div className="p-4">
        {loading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#7031f8' }}></div>
                  </div>
                ) : filteredTransactions.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      {activeSubTab === 'income' ? (
                        <ArrowUp className="w-8 h-8 text-gray-400" />
                      ) : (
                        <ArrowDown className="w-8 h-8 text-gray-400" />
                      )}
                </div>
                    <p className="text-gray-500 text-sm">
                      {activeSubTab === 'income' ? 'Aún no hay ingresos' : 'Aún no hay egresos'} en este período
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredTransactions.map((transaction, index) => (
                      <div
                        key={transaction.id}
                        onClick={async () => {
                          if (transaction.type === 'sale') {
                            setLoadingSaleDetail(true);
                            setIsSaleDetailModalOpen(true);
                            try {
                              const response = await fetch(`/api/sales/${transaction.id}`);
                              const data = await response.json();
                              if (data.success) {
                                setSelectedSale(data.data);
                              } else {
                                setSelectedSale(null);
                              }
                            } catch (error) {
                              console.error('Error obteniendo detalles de venta:', error);
                              setSelectedSale(null);
                            } finally {
                              setLoadingSaleDetail(false);
                            }
                          }
                        }}
                        className={`flex items-center p-3 rounded-xl hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200 bg-white active:scale-[0.98] ${
                          transaction.type === 'sale' ? 'cursor-pointer' : ''
                        }`}
                        style={{
                          animation: `fadeInUp 0.4s ease-out ${index * 0.05}s both`
                        }}
                      >
                        {/* Icono Mejorado */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-3 flex-shrink-0 shadow-sm ${
                          transaction.type === 'sale' 
                            ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                            : 'bg-gradient-to-br from-red-500 to-pink-600'
                        }`}>
                          {transaction.type === 'sale' ? (
                            <ArrowUp className="w-4 h-4 text-white" />
                          ) : (
                            <ArrowDown className="w-4 h-4 text-white" />
                          )}
                </div>

                        {/* Información Mejorada */}
                        <div className="flex-1 min-w-0 pr-2">
                          <p className="font-semibold text-gray-900 text-base mb-1 break-words">
                            {transaction.concept}
                          </p>
                          {transaction.description && (
                            <p className="text-xs text-gray-500 mb-1.5">{transaction.description}</p>
                          )}
                          <div className="flex items-center space-x-2 mt-1.5 flex-wrap gap-y-1">
                            {transaction.description && transaction.description.startsWith('#') && (
                              <span className="text-xs text-gray-500">{transaction.description}</span>
                            )}
                            <div className="flex items-center text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                              <DollarSign className="w-3 h-3 mr-1" />
                              <span>{transaction.paymentMethod || 'Efectivo'}</span>
              </div>
                            <div className="flex items-center text-xs text-gray-500">
                              <Clock className="w-3 h-3 mr-1" />
                              {formatDateTime(transaction.date)}
                  </div>
                </div>
              </div>

                        {/* Monto Mejorado */}
                        <div className="ml-2 flex-shrink-0 text-right">
                          <p className={`text-xl font-bold ${
                            transaction.type === 'sale' 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {transaction.type === 'sale' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Pestañas de Deudas Mejoradas */}
            <div className="bg-white rounded-3xl shadow-xl mb-6 mx-4 border-2 border-purple-100 overflow-hidden">
              <div className="flex bg-gradient-to-r from-gray-50 to-purple-50 p-1">
                <button
                  onClick={() => setDebtSubTab('receivable')}
                  className={`flex-1 py-4 text-center font-bold transition-all duration-200 rounded-2xl ${
                    debtSubTab === 'receivable'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
                      : 'text-gray-500 hover:text-green-600'
                  }`}
                >
                  💵 Por Cobrar
                </button>
                <button
                  onClick={() => setDebtSubTab('payable')}
                  className={`flex-1 py-4 text-center font-bold transition-all duration-200 rounded-2xl ${
                    debtSubTab === 'payable'
                      ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg'
                      : 'text-gray-500 hover:text-red-600'
                  }`}
                >
                  💳 Por Pagar
                </button>
              </div>

              <div className="p-4 min-h-[400px]">
                {loading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#7031f8' }}></div>
                  </div>
                ) : filteredDebts.length === 0 ? (
                  <div className="text-center py-8 flex flex-col items-center justify-center h-full">
                    {/* Ilustración de billetes con X */}
                    <div className="relative mb-4">
                      {/* Stack de billetes verdes */}
                      <div className="relative">
                        <div className="w-20 h-28 bg-gradient-to-br from-green-400 to-green-600 rounded-lg shadow-lg transform rotate-[-8deg] relative z-10">
                          <div className="absolute inset-0 bg-gradient-to-b from-green-300/50 to-transparent rounded-lg"></div>
                          <div className="absolute top-1.5 left-1.5 right-1.5 h-0.5 bg-green-200/30 rounded"></div>
                          <div className="absolute top-5 left-1.5 right-1.5 h-0.5 bg-green-200/30 rounded"></div>
                          <div className="absolute top-8 left-1.5 right-1.5 h-0.5 bg-green-200/30 rounded"></div>
                        </div>
                        <div className="w-20 h-28 bg-gradient-to-br from-green-500 to-green-700 rounded-lg shadow-md transform rotate-[4deg] absolute top-1.5 left-1.5 z-0">
                          <div className="absolute inset-0 bg-gradient-to-b from-green-400/50 to-transparent rounded-lg"></div>
                        </div>
                        {/* Banda amarilla/clara */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-2.5 bg-yellow-200 rounded-full z-20 shadow-sm"></div>
                        {/* X roja en círculo */}
                        <div className="absolute -top-1.5 -right-1.5 w-10 h-10 bg-red-500 rounded-full flex items-center justify-center shadow-lg z-30 border-2 border-white">
                          <X className="w-5 h-5 text-white" />
                        </div>
                </div>
              </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1.5">
                      No tienes deudas {debtSubTab === 'receivable' ? 'por cobrar' : 'por pagar'}
                    </h3>
                    <p className="text-gray-500 text-xs">
                      {debtSubTab === 'receivable' 
                        ? "Créalas en 'Nueva venta'" 
                        : "Créalas en 'Nuevo gasto'"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredDebts.map((debt, index) => {
                      const isOverdue = debt.dueDate && debt.dueDate < new Date();
                      return (
                        <button
                          key={debt.id}
                          onClick={() => {
                            // Navegar según el tipo de deuda
                            if (debt.type === 'receivable') {
                              router.push(`/balance/debt/${debt.id}/payment`);
                            } else if (debt.type === 'payable') {
                              router.push(`/balance/expense/${debt.id}/payment`);
                            }
                          }}
                          className={`w-full flex items-center p-4 rounded-2xl transition-all duration-200 border-2 ${
                            debt.type === 'receivable'
                              ? 'hover:shadow-lg active:scale-[0.98] cursor-pointer border-transparent hover:border-green-200 bg-gradient-to-r from-white to-green-50/50'
                              : 'hover:shadow-lg active:scale-[0.98] cursor-pointer border-transparent hover:border-red-200 bg-gradient-to-r from-white to-red-50/50'
                          } ${isOverdue ? 'border-red-300 bg-red-50/50' : ''}`}
                          style={{
                            animation: `fadeInUp 0.4s ease-out ${index * 0.05}s both`
                          }}
                        >
                          {/* Icono Mejorado */}
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mr-4 flex-shrink-0 shadow-md ${
                            debt.type === 'receivable' 
                              ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                              : 'bg-gradient-to-br from-red-500 to-pink-600'
                          } ${isOverdue ? 'ring-2 ring-red-400' : ''}`}>
                            {debt.type === 'receivable' ? (
                              <ArrowUp className="w-7 h-7 text-white" />
                            ) : (
                              <ArrowDown className="w-7 h-7 text-white" />
                            )}
              </div>

                          {/* Información Mejorada */}
                          <div className="flex-1 min-w-0 pr-2">
                            <p className="font-semibold text-gray-900 text-base break-words mb-1">
                              {debt.concept}
                            </p>
                            {debt.description && (
                              <p className="text-xs text-gray-500 mb-1.5 break-words">{debt.description}</p>
                            )}
                            <div className="flex items-center space-x-2 mt-1.5 flex-wrap gap-y-1">
                              {debt.dueDate && (
                                <>
                                  <div className={`flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
                                    isOverdue 
                                      ? 'bg-red-100 text-red-700 border border-red-300' 
                                      : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    <Calendar className="w-3 h-3 mr-1" />
                                    <span>Vence: {formatDate(debt.dueDate)}</span>
                                  </div>
                                  {isOverdue && (
                                    <span className="text-xs text-red-600 font-bold flex items-center bg-red-100 px-2 py-0.5 rounded-full border border-red-300">
                                      <AlertCircle className="w-3 h-3 mr-1" />
                                      Vencida
                                    </span>
                                  )}
                                  <span className="text-gray-400">•</span>
                                </>
                              )}
                              <div className="flex items-center text-xs text-gray-500">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatDate(debt.createdAt)}
                  </div>
                </div>
              </div>

                          {/* Monto Mejorado */}
                          <div className="ml-2 flex-shrink-0 text-right">
                            <p className={`text-lg font-bold ${
                              debt.type === 'receivable' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatCurrency(debt.amount)}
                            </p>
                </div>
                        </button>
                      );
                    })}
                        </div>
                )}
                      </div>
                    </div>

            {/* Botones de Acción Inferiores Mejorados */}
            <div className="fixed bottom-24 left-0 right-0 px-4 pb-4 z-40">
              <div className="flex gap-3 max-w-md mx-auto">
                <button
                  onClick={() => router.push('/sales/new')}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl px-3 py-2.5 flex items-center justify-center space-x-2 shadow-lg hover:shadow-green-300/50 transition-all duration-200 active:scale-95"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 border border-white/30">
                    <Plus className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-bold">Nueva venta</span>
                </button>
                <button
                  onClick={() => router.push('/expenses/new')}
                  className="flex-1 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl px-3 py-2.5 flex items-center justify-center space-x-2 shadow-lg hover:shadow-red-300/50 transition-all duration-200 active:scale-95"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 border border-white/30">
                    <Minus className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-bold">Nuevo gasto</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal de detalles de venta */}
      <SaleDetailModal
        isOpen={isSaleDetailModalOpen}
        onClose={() => {
          setIsSaleDetailModalOpen(false);
          setSelectedSale(null);
        }}
        sale={selectedSale}
        loading={loadingSaleDetail}
      />

      {/* Modal de selección de fecha */}
      <DatePickerModal
        isOpen={isDatePickerOpen}
        selectedDate={selectedDate}
        onSelectDate={(date) => {
          setSelectedDate(date);
          setDateRange('custom');
          setIsDatePickerOpen(false);
        }}
        onClose={() => setIsDatePickerOpen(false)}
      />
    </>
  );
};

export default BalancePage;
