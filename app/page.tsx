"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { dashboardService } from '@/services/api';
import SaleTypeModal from '@/components/SaleTypeModal';
import { 
  Plus, 
  DollarSign,
  Package,
  MoreVertical,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Clock,
  ArrowRightLeft,
  FileText,
  Building2,
  User
} from 'lucide-react';

interface Movement {
  id: string;
  type: 'sale' | 'expense';
  title: string;
  subtitle: string;
  amount: number;
  date: Date;
  description?: string;
  totalAmount?: number; // Para ventas con deuda: mostrar el total
  paidAmount?: number; // Para ventas con deuda: mostrar el abono
  isPayment?: boolean; // Indica si es un pago/abono
  referenceId?: string; // ID de la venta/gasto relacionado
  referenceType?: 'sale' | 'expense'; // Tipo de referencia
}

const HomePage = () => {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recentMovements, setRecentMovements] = useState<Movement[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);

  // Asegurar que el componente está montado (solo en cliente)
  useEffect(() => {
    setMounted(true);
  }, []);

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
    
    // Escuchar eventos de actualización cuando haya cambios en ventas, gastos o deudas
    const handleUpdate = () => {
      fetchStats();
    };

    // Eventos personalizados que se dispararán cuando haya cambios
    window.addEventListener('sale-created', handleUpdate);
    window.addEventListener('expense-created', handleUpdate);
    window.addEventListener('debt-updated', handleUpdate);

    return () => {
      window.removeEventListener('sale-created', handleUpdate);
      window.removeEventListener('expense-created', handleUpdate);
      window.removeEventListener('debt-updated', handleUpdate);
    };
  }, []);

  useEffect(() => {
    const fetchRecentMovements = async () => {
      try {
        setLoadingMovements(true);
        const [salesResponse, expensesResponse, paymentsResponse] = await Promise.all([
          dashboardService.getRecentSales(10),
          dashboardService.getRecentExpenses(10),
          fetch('/api/payments?limit=10').then(res => res.json())
        ]);

        const movements: Movement[] = [];

        // Procesar ventas
        if (salesResponse.success && salesResponse.data) {
          console.log('Dashboard: Procesando ventas recientes:', salesResponse.data.length);
          salesResponse.data.forEach((sale: any) => {
            // Determinar si es venta libre o de productos
            const isFreeSale = sale.type === 'free';
            
            let title = 'Venta Rápida';
            let subtitle = '';
            let description = 'Venta registrada';
            
            if (isFreeSale) {
              // Para ventas libres, priorizar: concepto > cliente > saleNumber
              if (sale.concept) {
                title = sale.concept;
                subtitle = sale.saleNumber ? `#${sale.saleNumber}` : '';
              } else if (sale.client?.name) {
                title = `Venta Libre: ${sale.client.name}`;
                subtitle = sale.saleNumber ? `#${sale.saleNumber}` : '';
              } else if (sale.saleNumber) {
                title = `Venta Libre #${sale.saleNumber}`;
              } else {
                title = 'Venta Libre';
              }
              
              // Si no hay subtitle, mostrar información del cliente o fecha
              if (!subtitle) {
                if (sale.client?.name) {
                  subtitle = `Cliente: ${sale.client.name}`;
                } else {
                  const saleDate = new Date(sale.createdAt);
                  subtitle = formatDateTime(saleDate);
                }
              }
              
              description = sale.concept || (sale.client?.name ? `Cliente: ${sale.client.name}` : 'Venta libre registrada');
            } else {
              // Para ventas de productos, usar la lógica anterior
            if (sale.client?.name) {
              title = `Venta: Cliente ${sale.client.name}`;
              subtitle = sale.saleNumber ? `#${sale.saleNumber}` : '';
            } else if (sale.saleNumber) {
              title = `Venta #${sale.saleNumber}`;
            } else {
                title = 'Venta de Productos';
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
              
              description = sale.items?.length > 0 
                ? `${sale.items.length} producto${sale.items.length > 1 ? 's' : ''}`
                : 'Venta registrada';
            }

            // Para ventas con deuda, guardar tanto el total como el abono
            const saleTotal = sale.total || sale.subtotal || sale.freeSaleAmount || 0;
            const paidAmount = sale.paidAmount || 0;
            const isDebt = sale.status === 'debt' && paidAmount > 0 && paidAmount < saleTotal;

            // Mostrar todas las ventas, incluyendo las que tienen deuda parcial
            // Los abonos aparecerán como pagos separados
            movements.push({
              id: sale._id,
              type: 'sale',
              title,
              subtitle,
              amount: saleTotal,
              date: new Date(sale.createdAt),
              description,
              totalAmount: isDebt ? saleTotal : undefined,
              paidAmount: isDebt ? paidAmount : undefined
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

        // Procesar pagos (abonos)
        console.log('Payments response:', paymentsResponse);
        if (paymentsResponse.success && paymentsResponse.data && paymentsResponse.data.length > 0) {
          console.log('Procesando', paymentsResponse.data.length, 'pagos');
          paymentsResponse.data.forEach((payment: any) => {
            let title = '';
            let subtitle = '';
            
            if (payment.referenceType === 'sale' && payment.referenceInfo) {
              const sale = payment.referenceInfo;
              // Título: concepto o nombre del cliente
              if (sale.concept) {
                title = sale.concept;
              } else if (sale.client?.name) {
                title = `Venta: ${sale.client.name}`;
              } else {
                title = 'Venta';
              }
              // Subtitle: mostrar el abono y el número de factura
              const saleNumber = sale.saleNumber ? `#${sale.saleNumber}` : 'sin número';
              subtitle = `Abono: +$${payment.amount.toFixed(2)} - Factura ${saleNumber}`;
            } else if (payment.referenceType === 'expense' && payment.referenceInfo) {
              const expense = payment.referenceInfo;
              if (expense.vendor?.name) {
                title = `Gasto: ${expense.vendor.name}`;
              } else if (expense.description) {
                title = expense.description;
              } else {
                title = 'Gasto';
              }
              subtitle = `Pago: -$${payment.amount.toFixed(2)}`;
            } else {
              // Fallback si no hay información de referencia
              title = payment.referenceType === 'sale' ? 'Abono de Venta' : 'Pago de Gasto';
              subtitle = payment.referenceType === 'sale' 
                ? `Abono: +$${payment.amount.toFixed(2)}`
                : `Pago: -$${payment.amount.toFixed(2)}`;
              // Intentar obtener el número de factura desde el referenceId si es posible
              if (payment.referenceType === 'sale' && payment.referenceId) {
                subtitle += ` - Factura ${payment.referenceId.toString().substring(0, 8)}...`;
              }
            }

            movements.push({
              id: payment._id,
              type: payment.referenceType === 'sale' ? 'sale' : 'expense',
              title,
              subtitle,
              amount: payment.amount,
              date: new Date(payment.paymentDate || payment.createdAt),
              description: payment.referenceType === 'sale' ? 'Abono registrado' : 'Pago registrado',
              isPayment: true,
              referenceId: payment.referenceId,
              referenceType: payment.referenceType
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
    
    // Escuchar eventos de actualización cuando haya cambios en ventas, gastos o deudas
    const handleUpdate = () => {
      fetchRecentMovements();
    };

    // Eventos personalizados que se dispararán cuando haya cambios
    window.addEventListener('sale-created', handleUpdate);
    window.addEventListener('expense-created', handleUpdate);
    window.addEventListener('debt-updated', handleUpdate);
    window.addEventListener('payment-created', handleUpdate);

    return () => {
      window.removeEventListener('sale-created', handleUpdate);
      window.removeEventListener('expense-created', handleUpdate);
      window.removeEventListener('debt-updated', handleUpdate);
      window.removeEventListener('payment-created', handleUpdate);
    };
  }, []);

  // No renderizar contenido hasta que esté montado (evita problemas de SSR)
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-pink-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

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

  // Asegurar que siempre retornamos contenido válido
  return (
    <div className="min-h-screen">
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
        <div className="grid grid-cols-5 gap-2 mb-6">
          <button 
            onClick={() => router.push('/balance')}
            className="flex flex-col items-center justify-center bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 border border-purple-100"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center mb-2">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-medium text-gray-700">Balance</span>
          </button>

          <button 
            onClick={() => router.push('/inventory')}
            className="flex flex-col items-center justify-center bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 border border-purple-100"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center mb-2">
              <Package className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-medium text-gray-700">Inventario</span>
          </button>

          <button 
            onClick={() => router.push('/balance?tab=debts')}
            className="flex flex-col items-center justify-center bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 border border-purple-100"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mb-2">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-medium text-gray-700">Deudas</span>
          </button>

          <button 
            onClick={() => router.push('/clients')}
            className="flex flex-col items-center justify-center bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 border border-purple-100"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-2">
              <User className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-medium text-gray-700">Clientes</span>
          </button>

          <button 
            onClick={() => router.push('/suppliers')}
            className="flex flex-col items-center justify-center bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 border border-purple-100"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center mb-2">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-medium text-gray-700">Proveedores</span>
          </button>
        </div>

        {/* Sección Destacada - Banner */}
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 rounded-3xl p-6 mb-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
          <div className="relative z-10">
            <div className="flex items-center mb-3">
              <Sparkles className="w-6 h-6 text-white mr-2" />
              <h3 className="text-xl font-bold text-white">Sistema de Reportes Avanzados</h3>
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
                        {/* Si hay deuda, mostrar total y abono */}
                        {movement.totalAmount && movement.paidAmount ? (
                          <>
                            <span className="text-xs text-gray-600">
                              Total: <span className="font-semibold">${movement.totalAmount.toFixed(2)}</span>
                            </span>
                            <span className="text-gray-400">•</span>
                            <span className={`text-xs font-bold ${
                              isIncome ? 'text-green-600' : 'text-red-600'
                            }`}>
                              Abono: {isIncome ? '+' : '-'}${movement.paidAmount.toFixed(2)}
                            </span>
                          </>
                        ) : (
                        <span className={`text-sm font-bold ${
                          isIncome ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {isIncome ? '+' : '-'}${movement.amount.toFixed(2)}
                        </span>
                        )}
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

        {/* Modal de selección de tipo de venta */}
        <SaleTypeModal 
          isOpen={isSaleModalOpen} 
          onClose={() => setIsSaleModalOpen(false)} 
        />
    </div>
  );
};

export default HomePage;
