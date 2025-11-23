"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Calendar, ArrowUp, ArrowDown, Clock,
  TrendingUp, TrendingDown, DollarSign, FileText,
  AlertCircle, CheckCircle, Minus, Plus, X, Wallet
} from 'lucide-react';
import { dashboardService, salesService, expensesService } from '@/services/api';

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
            formattedTransactions.push({
              id: sale._id,
              type: 'sale',
              concept: sale.client?.name 
                ? `Venta: ${sale.client.name}` 
                : sale.saleNumber 
                  ? `Venta #${sale.saleNumber}` 
                  : 'Venta',
              paymentMethod: sale.paymentMethod || 'Efectivo',
              date: saleDate,
              amount: sale.total || 0,
              description: sale.items?.length > 0 
                ? `${sale.items.length} producto${sale.items.length > 1 ? 's' : ''}`
                : undefined
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
    <DashboardLayout>
      <div className="min-h-screen pb-24 -mt-20 md:-mt-16">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 flex items-center space-x-3 rounded-b-2xl mb-6 -mx-6">
          <Wallet className="w-6 h-6" />
          <h1 className="text-2xl font-bold">Balance</h1>
        </div>

        {/* Pestañas Principales */}
        <div className="bg-white rounded-2xl shadow-md p-1 mb-4 mx-4 mt-4 border border-purple-100">
          <div className="flex">
                <button
              onClick={() => setActiveTab('activity')}
              className={`flex-1 py-3 text-center font-semibold rounded-xl transition-all ${
                activeTab === 'activity'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              Actividad Diaria
                </button>
            <button
              onClick={() => setActiveTab('debts')}
              className={`flex-1 py-3 text-center font-semibold rounded-xl transition-all ${
                activeTab === 'debts'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              Deudas Pendientes
            </button>
          </div>
        </div>

        {activeTab === 'activity' ? (
          <>
            {/* Tarjeta de Resumen */}
            <div className="bg-white rounded-3xl shadow-xl p-6 mb-6 mx-4 border border-purple-100">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <p className="text-sm text-gray-500 mb-1">Balance del {label}</p>
                  <h2 className={`text-4xl font-bold ${
                    summary.balance < 0 
                      ? 'text-red-600' 
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent'
                  }`}>
                    {formatCurrency(summary.balance)}
                  </h2>
                </div>
                {summary.balance >= 0 && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Positivo
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Ingresos</p>
                    <p className="text-lg font-bold text-green-600">{formatCurrency(summary.totalIncome)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Egresos</p>
                    <p className="text-lg font-bold text-red-600">{formatCurrency(summary.totalExpenses)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Selector de Período */}
            <div className="bg-white rounded-2xl shadow-md p-4 mb-4 mx-4 border border-purple-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">Período</h3>
                <button
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'date';
                    input.value = selectedDate.toISOString().split('T')[0];
                    input.onchange = (e: any) => {
                      setSelectedDate(new Date(e.target.value));
                      setDateRange('custom');
                    };
                    input.click();
                  }}
                  className="p-2 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors"
                >
                  <Calendar className="w-5 h-5" />
                </button>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {(['today', 'yesterday', 'last7days'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setDateRange(range)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                      dateRange === range
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {range === 'today' ? 'Hoy' : range === 'yesterday' ? 'Ayer' : 'Últimos 7 días'}
                  </button>
            ))}
          </div>
            </div>

            {/* Pestañas de Movimientos */}
            <div className="bg-white rounded-3xl shadow-lg mb-6 mx-4 border border-purple-100 overflow-hidden">
              <div className="flex border-b border-gray-100">
                <button
                  onClick={() => setActiveSubTab('income')}
                  className={`flex-1 py-4 text-center font-semibold transition-colors ${
                    activeSubTab === 'income'
                      ? 'text-green-600 border-b-2 border-green-600'
                      : 'text-gray-500'
                  }`}
                >
                  Ingresos
                </button>
            <button
                  onClick={() => setActiveSubTab('expenses')}
                  className={`flex-1 py-4 text-center font-semibold transition-colors ${
                    activeSubTab === 'expenses'
                      ? 'text-red-600 border-b-2 border-red-600'
                      : 'text-gray-500'
                  }`}
                >
                  Egresos
            </button>
          </div>

              <div className="p-4">
        {loading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
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
                      No hay {activeSubTab === 'income' ? 'ingresos' : 'egresos'} para este período
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredTransactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center p-3 rounded-2xl hover:bg-gray-50 transition-colors"
                      >
                        {/* Icono */}
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 flex-shrink-0 ${
                          transaction.type === 'sale' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {transaction.type === 'sale' ? (
                            <ArrowUp className="w-6 h-6 text-green-600" />
                          ) : (
                            <ArrowDown className="w-6 h-6 text-red-600" />
                          )}
                </div>

                        {/* Información */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800 truncate">
                            {transaction.concept}
                          </p>
                          <div className="flex items-center space-x-2 mt-1 flex-wrap">
                            <div className="flex items-center text-xs text-gray-500">
                              <DollarSign className="w-3 h-3 mr-1" />
                              <span>{transaction.paymentMethod || 'Efectivo'}</span>
              </div>
                            <span className="text-gray-400">•</span>
                            <div className="flex items-center text-xs text-gray-500">
                              <Clock className="w-3 h-3 mr-1" />
                              {formatDateTime(transaction.date)}
                  </div>
                </div>
              </div>

                        {/* Monto */}
                        <div className="ml-4 flex-shrink-0">
                          <p className={`text-lg font-bold ${
                            transaction.type === 'sale' ? 'text-green-600' : 'text-red-600'
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
            {/* Pestañas de Deudas */}
            <div className="bg-white rounded-3xl shadow-lg mb-6 mx-4 border border-purple-100 overflow-hidden">
              <div className="flex border-b border-gray-100">
                <button
                  onClick={() => setDebtSubTab('receivable')}
                  className={`flex-1 py-4 text-center font-semibold transition-colors ${
                    debtSubTab === 'receivable'
                      ? 'text-gray-900 border-b-2 border-gray-900'
                      : 'text-gray-400'
                  }`}
                >
                  Por Cobrar
                </button>
                <button
                  onClick={() => setDebtSubTab('payable')}
                  className={`flex-1 py-4 text-center font-semibold transition-colors ${
                    debtSubTab === 'payable'
                      ? 'text-gray-900 border-b-2 border-gray-900'
                      : 'text-gray-400'
                  }`}
                >
                  Por Pagar
                </button>
              </div>

              <div className="p-4 min-h-[400px]">
                {loading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  </div>
                ) : filteredDebts.length === 0 ? (
                  <div className="text-center py-12 flex flex-col items-center justify-center h-full">
                    {/* Ilustración de billetes con X */}
                    <div className="relative mb-6">
                      {/* Stack de billetes verdes */}
                      <div className="relative">
                        <div className="w-24 h-32 bg-gradient-to-br from-green-400 to-green-600 rounded-lg shadow-lg transform rotate-[-8deg] relative z-10">
                          <div className="absolute inset-0 bg-gradient-to-b from-green-300/50 to-transparent rounded-lg"></div>
                          <div className="absolute top-2 left-2 right-2 h-1 bg-green-200/30 rounded"></div>
                          <div className="absolute top-6 left-2 right-2 h-1 bg-green-200/30 rounded"></div>
                          <div className="absolute top-10 left-2 right-2 h-1 bg-green-200/30 rounded"></div>
                        </div>
                        <div className="w-24 h-32 bg-gradient-to-br from-green-500 to-green-700 rounded-lg shadow-md transform rotate-[4deg] absolute top-2 left-2 z-0">
                          <div className="absolute inset-0 bg-gradient-to-b from-green-400/50 to-transparent rounded-lg"></div>
                        </div>
                        {/* Banda amarilla/clara */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-28 h-3 bg-yellow-200 rounded-full z-20 shadow-sm"></div>
                        {/* X roja en círculo */}
                        <div className="absolute -top-2 -right-2 w-12 h-12 bg-red-500 rounded-full flex items-center justify-center shadow-lg z-30 border-4 border-white">
                          <X className="w-6 h-6 text-white" />
                        </div>
                </div>
              </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      No tienes deudas {debtSubTab === 'receivable' ? 'por cobrar' : 'por pagar'}
                    </h3>
                    <p className="text-gray-500 text-sm">
                      {debtSubTab === 'receivable' 
                        ? "Créalas en 'Nueva venta'" 
                        : "Créalas en 'Nuevo gasto'"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredDebts.map((debt) => {
                      const isOverdue = debt.dueDate && debt.dueDate < new Date();
                      return (
                        <button
                          key={debt.id}
                          onClick={() => {
                            // Solo hacer clicable las deudas por cobrar (ventas)
                            if (debt.type === 'receivable') {
                              router.push(`/balance/debt/${debt.id}/payment`);
                            }
                          }}
                          disabled={debt.type !== 'receivable'}
                          className={`w-full flex items-center p-3 rounded-2xl transition-colors border border-gray-100 ${
                            debt.type === 'receivable'
                              ? 'hover:bg-gray-50 active:bg-gray-100 cursor-pointer'
                              : 'cursor-default'
                          }`}
                        >
                          {/* Icono */}
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 flex-shrink-0 ${
                            debt.type === 'receivable' ? 'bg-green-100' : 'bg-red-100'
                          }`}>
                            {debt.type === 'receivable' ? (
                              <ArrowUp className="w-6 h-6 text-green-600" />
                            ) : (
                              <ArrowDown className="w-6 h-6 text-red-600" />
                            )}
              </div>

                          {/* Información */}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800 truncate">
                              {debt.concept}
                            </p>
                            <div className="flex items-center space-x-2 mt-1 flex-wrap">
                              {debt.dueDate && (
                                <>
                                  <div className={`flex items-center text-xs ${
                                    isOverdue ? 'text-red-600 font-semibold' : 'text-gray-500'
                                  }`}>
                                    <Calendar className="w-3 h-3 mr-1" />
                                    <span>Vence: {formatDate(debt.dueDate)}</span>
                                  </div>
                                  <span className="text-gray-400">•</span>
                                </>
                              )}
                              <div className="flex items-center text-xs text-gray-500">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatDate(debt.createdAt)}
                  </div>
                              {isOverdue && (
                                <>
                                  <span className="text-gray-400">•</span>
                                  <span className="text-xs text-red-600 font-semibold flex items-center">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    Vencida
                                  </span>
                                </>
                              )}
                </div>
              </div>

                          {/* Monto */}
                          <div className="ml-4 flex-shrink-0">
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

            {/* Botones de Acción Inferiores */}
            <div className="fixed bottom-24 left-0 right-0 px-4 pb-4 z-40">
              <div className="flex gap-3 max-w-md mx-auto">
                <button
                  onClick={() => router.push('/sales/new')}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl px-4 py-3 flex items-center space-x-2 shadow-lg transition-all duration-200 active:scale-95"
                >
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                    <Plus className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-base font-semibold">Nueva venta</span>
                </button>
                <button
                  onClick={() => router.push('/expenses/new')}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl px-4 py-3 flex items-center space-x-2 shadow-lg transition-all duration-200 active:scale-95"
                >
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                    <Minus className="w-4 h-4 text-red-600" />
                  </div>
                  <span className="text-base font-semibold">Nuevo gasto</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default BalancePage;
