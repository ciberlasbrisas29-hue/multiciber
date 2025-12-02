"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { dashboardService } from '@/services/api';
import SaleTypeModal from '@/components/SaleTypeModal';
import SaleDetailModal from '@/components/SaleDetailModal';
import { 
  Plus, 
  DollarSign,
  Package,
  MoreVertical,
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
  saleData?: any; // Datos completos de la venta para el modal
}

const HomePage = () => {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recentMovements, setRecentMovements] = useState<Movement[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [isSaleDetailModalOpen, setIsSaleDetailModalOpen] = useState(false);
  const [loadingSaleDetail, setLoadingSaleDetail] = useState(false);

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
    // Solo ejecutar cuando el componente esté montado
    if (!mounted) return;

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
              // Para ventas de productos, mostrar nombres de productos
              if (sale.items && sale.items.length > 0) {
                // Si hay un solo producto, mostrar su nombre completo
                if (sale.items.length === 1) {
                  const item = sale.items[0];
                  title = item.productName || item.product?.name || 'Producto';
                  subtitle = sale.saleNumber ? `#${sale.saleNumber}` : '';
                } else {
                  // Si hay múltiples productos, mostrar los primeros 2-3 nombres
                  const productNames = sale.items
                    .slice(0, 3)
                    .map((item: any) => item.productName || item.product?.name || 'Producto')
                    .join(', ');
                  const remaining = sale.items.length - 3;
                  title = productNames + (remaining > 0 ? ` y ${remaining} más` : '');
                  subtitle = sale.saleNumber ? `#${sale.saleNumber}` : '';
                }
                
                // Si no hay subtitle, agregar información adicional
                if (!subtitle) {
                  subtitle = `${sale.items.length} producto${sale.items.length > 1 ? 's' : ''}`;
                }
              } else {
                // Fallback si no hay items
            if (sale.client?.name) {
              title = `Venta: Cliente ${sale.client.name}`;
              subtitle = sale.saleNumber ? `#${sale.saleNumber}` : '';
            } else if (sale.saleNumber) {
              title = `Venta #${sale.saleNumber}`;
            } else {
                title = 'Venta de Productos';
            }
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
              paidAmount: isDebt ? paidAmount : undefined,
              saleData: sale // Guardar datos completos para el modal
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
        movements.sort((a, b) => {
          // Ordenar por fecha, y si son iguales, priorizar pagos sobre ventas/gastos
          const dateDiff = b.date.getTime() - a.date.getTime();
          if (dateDiff === 0) {
            // Si tienen la misma fecha, los pagos van primero
            if (a.isPayment && !b.isPayment) return -1;
            if (!a.isPayment && b.isPayment) return 1;
          }
          return dateDiff;
        });
        setRecentMovements(movements.slice(0, 5));
      } catch (err) {
        console.error("Error fetching recent movements:", err);
        // En caso de error, intentar recargar después de un breve delay
        setTimeout(() => {
          fetchRecentMovements();
        }, 1000);
      } finally {
        setLoadingMovements(false);
      }
    };

    // Ejecutar inmediatamente
    fetchRecentMovements();
    
    // También ejecutar cuando la página gane foco (por si el usuario cambia de pestaña)
    const handleFocus = () => {
      fetchRecentMovements();
    };
    
    // Escuchar eventos de actualización cuando haya cambios en ventas, gastos o deudas
    const handleUpdate = () => {
      fetchRecentMovements();
    };

    // Eventos personalizados que se dispararán cuando haya cambios
    window.addEventListener('sale-created', handleUpdate);
    window.addEventListener('expense-created', handleUpdate);
    window.addEventListener('debt-updated', handleUpdate);
    window.addEventListener('payment-created', handleUpdate);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        fetchRecentMovements();
      }
    });

    return () => {
      window.removeEventListener('sale-created', handleUpdate);
      window.removeEventListener('expense-created', handleUpdate);
      window.removeEventListener('debt-updated', handleUpdate);
      window.removeEventListener('payment-created', handleUpdate);
      window.removeEventListener('focus', handleFocus);
    };
  }, [mounted]); // Dependencia en mounted para ejecutar cuando esté listo

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
      const variations = ['Recién', 'Ahora mismo', 'Hace un rato'];
      return variations[Math.floor(Math.random() * variations.length)];
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      if (minutes === 1) return 'Hace 1 min';
      return `Hace ${minutes} min`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      if (hours === 1) return 'Hace 1 hora';
      return `Hace ${hours} horas`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      if (days === 1) return 'Ayer';
      return `Hace ${days} días`;
    }
  };

  const handleMovementClick = async (movement: Movement) => {
    // Solo abrir modal para ventas (no para gastos o pagos)
    if (movement.type === 'sale' && !movement.isPayment) {
      setLoadingSaleDetail(true);
      setIsSaleDetailModalOpen(true);
      
      try {
        // Si ya tenemos los datos de la venta, usarlos directamente
        if (movement.saleData) {
          setSelectedSale(movement.saleData);
        } else {
          // Si no, hacer fetch de la venta
          const response = await fetch(`/api/sales/${movement.id}`);
          const data = await response.json();
          if (data.success) {
            setSelectedSale(data.data);
          } else {
            console.error('Error obteniendo detalles de venta:', data.message);
            setSelectedSale(null);
          }
        }
      } catch (error) {
        console.error('Error obteniendo detalles de venta:', error);
        setSelectedSale(null);
      } finally {
        setLoadingSaleDetail(false);
      }
    }
  };

  // Asegurar que siempre retornamos contenido válido
  return (
    <div className="min-h-screen">
        {/* Card Principal */}
        <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 border border-gray-100">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className="text-sm text-gray-500 mb-2 font-medium">Balance Actual</p>
              <h2 className="text-3xl font-bold text-purple-600 mb-1">
                ${currentBalance}
              </h2>
            </div>
            <span className="px-4 py-2 bg-green-50 border border-green-200 text-green-700 rounded-full text-xs font-semibold flex items-center shadow-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              Activo
            </span>
          </div>
          <div className="pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              Actualizado recién
            </p>
          </div>
        </div>

        {/* Fila de Botones de Acción */}
        <div className="grid grid-cols-5 gap-3 mb-6">
          <button 
            onClick={() => router.push('/balance')}
            className="flex flex-col items-center justify-center bg-white rounded-2xl p-3 shadow-sm hover:shadow-lg transition-all duration-200 active:scale-95 border border-gray-100 group"
          >
            <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center mb-2 group-hover:bg-indigo-700 transition-colors shadow-sm">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-semibold text-gray-700">Balance</span>
          </button>

          <button 
            onClick={() => router.push('/inventory')}
            className="flex flex-col items-center justify-center bg-white rounded-2xl p-3 shadow-sm hover:shadow-lg transition-all duration-200 active:scale-95 border border-gray-100 group"
          >
            <div className="w-12 h-12 rounded-full bg-pink-500 flex items-center justify-center mb-2 group-hover:bg-pink-600 transition-colors shadow-sm">
              <Package className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-semibold text-gray-700">Inventario</span>
          </button>

          <button 
            onClick={() => router.push('/balance?tab=debts')}
            className="flex flex-col items-center justify-center bg-white rounded-2xl p-3 shadow-sm hover:shadow-lg transition-all duration-200 active:scale-95 border border-gray-100 group"
          >
            <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center mb-2 group-hover:bg-purple-700 transition-colors shadow-sm">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-semibold text-gray-700">Deudas</span>
          </button>

          <button 
            onClick={() => router.push('/clients')}
            className="flex flex-col items-center justify-center bg-white rounded-2xl p-3 shadow-sm hover:shadow-lg transition-all duration-200 active:scale-95 border border-gray-100 group"
          >
            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center mb-2 group-hover:bg-green-600 transition-colors shadow-sm">
              <User className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-semibold text-gray-700">Clientes</span>
          </button>

          <button 
            onClick={() => router.push('/suppliers')}
            className="flex flex-col items-center justify-center bg-white rounded-2xl p-3 shadow-sm hover:shadow-lg transition-all duration-200 active:scale-95 border border-gray-100 group"
          >
            <div className="w-12 h-12 rounded-full bg-teal-500 flex items-center justify-center mb-2 group-hover:bg-teal-600 transition-colors shadow-sm">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-semibold text-gray-700">Proveedores</span>
          </button>
        </div>

        {/* Sección Destacada - Banner */}
        <div className="text-white px-6 py-5 rounded-3xl mb-6 shadow-lg" style={{ backgroundColor: '#7031f8' }}>
          <div className="mb-3">
            <h3 className="text-2xl font-bold text-white mb-2">Reportes Avanzados</h3>
          </div>
          <p className="text-white/95 text-sm mb-5 leading-relaxed">
            Sistema de reportes con análisis en tiempo real
          </p>
          <button 
            onClick={() => router.push('/reports')}
            className="bg-white text-purple-600 px-6 py-3 rounded-xl font-bold text-sm flex items-center hover:bg-purple-50 transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            Explorar
            <ArrowRightLeft className="w-4 h-4 ml-2" />
          </button>
        </div>

        {/* Últimos Movimientos */}
        <div className="bg-white rounded-3xl shadow-lg p-5 mb-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-5 px-1">Últimos Movimientos</h2>
          
          {loadingMovements ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : recentMovements.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">Aún no hay movimientos</p>
              <p className="text-xs mt-1 text-gray-400">Cuando hagas una venta o gasto, aparecerá aquí</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentMovements.map((movement) => {
                const isIncome = movement.type === 'sale';
                const timeAgo = getTimeAgo(movement.date);

                return (
                  <div
                    key={movement.id}
                    onClick={() => handleMovementClick(movement)}
                    className={`flex items-center p-3 rounded-2xl transition-colors ${
                      movement.type === 'sale' && !movement.isPayment
                        ? 'hover:bg-gray-50 cursor-pointer active:bg-gray-100'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {/* Icono */}
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mr-4 flex-shrink-0 shadow-sm ${
                      isIncome ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'
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
    </div>
  );
};

export default HomePage;
