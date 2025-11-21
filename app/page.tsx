"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { dashboardService } from '@/services/api';
import { 
  Plus, 
  DollarSign,
  Package,
  MoreVertical,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Clock,
  ArrowRightLeft
} from 'lucide-react';

interface Movement {
  id: string;
  type: 'sale' | 'expense';
  title: string;
  subtitle: string;
  amount: number;
  date: Date;
  description?: string;
}

const HomePage = () => {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recentMovements, setRecentMovements] = useState<Movement[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(true);

  // Redirigir si no está autenticado
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // No renderizar nada mientras se verifica la autenticación o si no está autenticado
  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const formatDateTime = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await dashboardService.getStats();
        if (response.success) {
          setStats(response.data);
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  useEffect(() => {
    const fetchRecentMovements = async () => {
      try {
        setLoadingMovements(true);
        const [salesResponse, expensesResponse] = await Promise.all([
          dashboardService.getRecentSales(5),
          dashboardService.getRecentExpenses(5)
        ]);

        const movements: Movement[] = [];

        // Procesar ventas
        if (salesResponse.success && salesResponse.data) {
          salesResponse.data.forEach((sale: any) => {
            // Prioridad 1: Nombre de cliente
            let title = 'Venta Rápida';
            let subtitle = '';
            
            if (sale.client?.name) {
              title = `Venta: Cliente ${sale.client.name}`;
              subtitle = sale.saleNumber ? `#${sale.saleNumber}` : '';
            } else if (sale.saleNumber) {
              title = `Venta #${sale.saleNumber}`;
            } else {
              title = 'Venta Rápida';
            }

            // Si no hay información específica, mostrar fecha/hora en subtitle
            if (!subtitle && !sale.client?.name && !sale.saleNumber) {
              const saleDate = new Date(sale.createdAt);
              subtitle = formatDateTime(saleDate);
            } else if (!subtitle) {
              subtitle = sale.items?.length > 0 
                ? `${sale.items.length} producto${sale.items.length > 1 ? 's' : ''}`
                : '';
            }

            movements.push({
              id: sale._id,
              type: 'sale',
              title,
              subtitle,
              amount: sale.total || sale.subtotal || 0,
              date: new Date(sale.createdAt),
              description: sale.items?.length > 0 
                ? `${sale.items.length} producto${sale.items.length > 1 ? 's' : ''}`
                : 'Venta registrada'
            });
          });
        }

        // Procesar gastos
        if (expensesResponse.success && expensesResponse.data) {
          expensesResponse.data.forEach((expense: any) => {
            // Prioridad 1: Nombre de proveedor o descripción
            let title = 'Gasto General';
            let subtitle = '';
            
            if (expense.vendor?.name) {
              title = `Gasto: Proveedor ${expense.vendor.name}`;
              subtitle = expense.description || expense.category || '';
            } else if (expense.description) {
              title = expense.description;
              subtitle = expense.expenseNumber ? `#${expense.expenseNumber}` : expense.category || '';
            } else if (expense.expenseNumber) {
              title = `Gasto #${expense.expenseNumber}`;
              subtitle = expense.category || '';
            } else {
              title = expense.category || 'Gasto General';
            }

            // Si no hay información específica, mostrar fecha/hora en subtitle
            if (!subtitle && !expense.vendor?.name && !expense.description && !expense.expenseNumber) {
              const expenseDate = new Date(expense.createdAt);
              subtitle = formatDateTime(expenseDate);
            } else if (!subtitle) {
              subtitle = expense.category || '';
            }

            movements.push({
              id: expense._id,
              type: 'expense',
              title,
              subtitle,
              amount: expense.amount || 0,
              date: new Date(expense.createdAt),
              description: expense.category || 'Gasto registrado'
            });
          });
        }

        // Ordenar por fecha (más reciente primero) y tomar los últimos 5
        movements.sort((a, b) => b.date.getTime() - a.date.getTime());
        setRecentMovements(movements.slice(0, 5));
      } catch (err) {
        console.error("Error fetching recent movements:", err);
      } finally {
        setLoadingMovements(false);
      }
    };

    fetchRecentMovements();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchRecentMovements, 30000);
    return () => clearInterval(interval);
  }, []);

  const currentBalance = stats?.month?.profit !== undefined 
    ? stats.month.profit.toFixed(2) 
    : '0.00';

  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Hace unos momentos';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `Hace ${days} día${days > 1 ? 's' : ''}`;
    }
  };

  return (
    <>
        {/* Card Principal */}
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-6 border border-purple-100">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className="text-sm text-gray-500 mb-1">Balance Actual</p>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                ${currentBalance}
              </h2>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Activo
            </span>
          </div>
          <div className="pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400">Actualizado hace unos momentos</p>
          </div>
        </div>

        {/* Fila de Botones de Acción */}
        <div className="flex justify-between mb-6">
          <button 
            onClick={() => router.push('/sales/new')}
            className="flex-1 mx-2 first:ml-0 last:mr-0 flex flex-col items-center justify-center bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 border border-purple-100"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-2">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-medium text-gray-700">Agregar</span>
          </button>

          <button 
            onClick={() => router.push('/balance')}
            className="flex-1 mx-2 first:ml-0 last:mr-0 flex flex-col items-center justify-center bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 border border-purple-100"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center mb-2">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-medium text-gray-700">Balance</span>
          </button>

          <button 
            onClick={() => router.push('/inventory')}
            className="flex-1 mx-2 first:ml-0 last:mr-0 flex flex-col items-center justify-center bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 border border-purple-100"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center mb-2">
              <Package className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-medium text-gray-700">Inventario</span>
          </button>

          <button className="flex-1 mx-2 first:ml-0 last:mr-0 flex flex-col items-center justify-center bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 border border-purple-100">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center mb-2">
              <MoreVertical className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-medium text-gray-700">Más</span>
          </button>
        </div>

        {/* Sección Destacada - Banner */}
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 rounded-3xl p-6 mb-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
          <div className="relative z-10">
            <div className="flex items-center mb-3">
              <Sparkles className="w-6 h-6 text-white mr-2" />
              <h3 className="text-xl font-bold text-white">Nueva Funcionalidad</h3>
            </div>
            <p className="text-white/90 text-sm mb-4 leading-relaxed">
              Descubre nuestro nuevo sistema de reportes avanzados con análisis en tiempo real
            </p>
            <button 
              onClick={() => router.push('/reports')}
              className="bg-white text-purple-600 px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center hover:bg-purple-50 transition-colors"
            >
              Explorar
              <ArrowRightLeft className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>

        {/* Últimos Movimientos */}
        <div className="bg-white rounded-3xl shadow-lg p-4 mb-6 border border-purple-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4 px-2">Últimos Movimientos</h2>
          
          {loadingMovements ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : recentMovements.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No hay movimientos recientes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentMovements.map((movement) => {
                const isIncome = movement.type === 'sale';
                const timeAgo = getTimeAgo(movement.date);

                return (
                  <div
                    key={movement.id}
                    className="flex items-center p-3 rounded-2xl hover:bg-gray-50 transition-colors"
                  >
                    {/* Icono */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 flex-shrink-0 ${
                      isIncome ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {isIncome ? (
                        <ArrowUp className="w-6 h-6 text-green-600" />
                      ) : (
                        <ArrowDown className="w-6 h-6 text-red-600" />
                      )}
                    </div>

                    {/* Información */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 truncate">
                        {movement.title}
                      </p>
                      <div className="flex items-center space-x-2 mt-0.5 flex-wrap">
                        {movement.subtitle && (
                          <>
                            <span className="text-xs text-gray-600 truncate">
                              {movement.subtitle}
                            </span>
                            <span className="text-gray-400">•</span>
                          </>
                        )}
                        <span className={`text-sm font-bold ${
                          isIncome ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {isIncome ? '+' : '-'}${movement.amount.toFixed(2)}
                        </span>
                        <span className="text-gray-400">•</span>
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="w-3 h-3 mr-1" />
                          {timeAgo}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
    </>
  );
};

export default HomePage;
