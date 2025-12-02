"use client";

import React, { useEffect, useState } from 'react';
import { X, Clock, DollarSign, User, CreditCard, FileText, Package, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import Image from 'next/image';

interface SaleItem {
  product?: {
    _id: string;
    name: string;
    image?: string;
    cost?: number;
  };
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  cost?: number;
}

interface SaleDetail {
  _id: string;
  saleNumber?: string;
  type: 'product' | 'free';
  status: 'paid' | 'debt';
  items?: SaleItem[];
  concept?: string;
  client?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  subtotal: number;
  discount?: number;
  discountType?: 'percentage' | 'amount';
  total: number;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'check' | 'other';
  paidAmount?: number;
  debtAmount?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface SaleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: SaleDetail | null;
  loading?: boolean;
}

const SaleDetailModal: React.FC<SaleDetailModalProps> = ({ isOpen, onClose, sale, loading = false }) => {
  const [isProductsExpanded, setIsProductsExpanded] = useState(false);

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      // Guardar el valor actual del overflow
      const originalStyle = window.getComputedStyle(document.body).overflow;
      // Bloquear el scroll
      document.body.style.overflow = 'hidden';
      
      // Restaurar el scroll cuando el modal se cierre
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const getPaymentMethodLabel = (method: string): string => {
    const labels: Record<string, string> = {
      cash: 'Efectivo',
      card: 'Tarjeta',
      transfer: 'Transferencia',
      check: 'Cheque',
      other: 'Otro'
    };
    return labels[method] || method;
  };

  // Calcular ganancias
  const calculateProfit = (): number => {
    if (!sale || !sale.items || sale.items.length === 0) return 0;
    
    let totalCost = 0;
    sale.items.forEach(item => {
      // Obtener el costo: primero del item, luego del producto populado
      let itemCost = 0;
      
      if (item.cost !== undefined && item.cost !== null && !isNaN(item.cost) && item.cost > 0) {
        itemCost = Number(item.cost);
      } else if (item.product) {
        if (typeof item.product === 'object' && item.product !== null) {
          const productCost = item.product.cost;
          if (productCost !== undefined && productCost !== null && !isNaN(productCost) && productCost > 0) {
            itemCost = Number(productCost);
          }
        }
      }
      
      totalCost += itemCost * item.quantity;
    });
    
    return sale.total - totalCost;
  };

  // Calcular referencias totales (total de items)
  const getTotalReferences = (): number => {
    if (!sale || !sale.items) return 0;
    return sale.items.reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        // Cerrar al hacer click fuera del modal
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[calc(100vh-2rem)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white relative flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-bold pr-10">Detalles de Venta</h2>
          {sale?.saleNumber && (
            <p className="text-white/90 text-sm mt-1">#{sale.saleNumber}</p>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 pb-6" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : sale ? (
            <div className="space-y-4">
              {/* Resumen de la Venta */}
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-5 border border-purple-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-purple-600" />
                  Resumen de la Venta
                </h3>
                <div className="space-y-3">
                  {/* Transacción # */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Transacción #</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {sale.saleNumber ? `#${sale.saleNumber}` : `#${sale._id.slice(-6).toUpperCase()}`}
                    </span>
                  </div>

                  {/* Descripción/Producto */}
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-gray-600">
                      {sale.type === 'free' ? 'Descripción' : 'Producto'}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 text-right max-w-[60%] break-words">
                      {sale.type === 'free' && sale.concept 
                        ? sale.concept 
                        : sale.items && sale.items.length > 0
                        ? sale.items.length === 1
                          ? sale.items[0].productName
                          : `${sale.items[0].productName} y ${sale.items.length - 1} más`
                        : 'Venta'}
                    </span>
                  </div>

                  {/* Valor Total */}
                  <div className="flex justify-between items-center pt-2 border-t border-purple-200">
                    <span className="text-sm font-medium text-gray-600">Valor Total</span>
                    <span className="text-lg font-bold text-purple-600">
                      ${sale.total.toFixed(2)}
                    </span>
                  </div>

                  {/* Fecha */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Fecha</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatDateTime(sale.createdAt)}
                    </span>
                  </div>

                  {/* Método de Pago */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Método de Pago</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {getPaymentMethodLabel(sale.paymentMethod)}
                    </span>
                  </div>

                  {/* Cantidad */}
                  {sale.items && sale.items.length > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Cantidad</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {getTotalReferences()} {getTotalReferences() === 1 ? 'producto' : 'productos'}
                      </span>
                    </div>
                  )}

                  {/* Ganancias - Siempre mostrar para ventas de productos */}
                  {sale.type === 'product' && sale.items && sale.items.length > 0 && (
                    <div className="flex justify-between items-center pt-2 border-t border-purple-200">
                      <span className="text-sm font-medium text-gray-600">Ganancias</span>
                      <span className={`text-sm font-bold ${calculateProfit() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${calculateProfit().toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Listado de Productos Desplegable */}
              {sale.type === 'product' && sale.items && sale.items.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => setIsProductsExpanded(!isProductsExpanded)}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center">
                      <Package className="w-5 h-5 mr-2 text-purple-600" />
                      <span className="text-base font-semibold text-gray-900">
                        Productos ({sale.items.length})
                      </span>
                    </div>
                    {isProductsExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                  
                  {isProductsExpanded && (
                    <div className="border-t border-gray-200 p-4 space-y-3">
                      {sale.items.map((item, index) => (
                        <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <div className="flex items-start space-x-3">
                            {/* Imagen del producto */}
                            <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                              {item.product?.image ? (
                                <Image
                                  src={item.product.image}
                                  alt={item.productName}
                                  width={56}
                                  height={56}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/assets/images/products/default-product.jpg';
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-indigo-100">
                                  <Package className="w-6 h-6 text-purple-400" />
                                </div>
                              )}
                            </div>
                            {/* Información del producto */}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-800 text-sm break-words mb-1.5">
                                {item.productName}
                              </p>
                              <div className="space-y-1">
                                <p className="text-xs text-gray-600">
                                  Cantidad: <span className="font-medium">{item.quantity}</span>
                                </p>
                                <p className="text-xs text-gray-600">
                                  Precio unitario: <span className="font-medium">${item.unitPrice.toFixed(2)}</span>
                                </p>
                                <p className="text-xs font-semibold text-purple-600">
                                  Total: ${item.totalPrice.toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Estado de la Venta */}
              <div className="flex items-center space-x-2">
                <div className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                  sale.type === 'free' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-green-100 text-green-700'
                }`}>
                  {sale.type === 'free' ? 'Venta Libre' : 'Venta'}
                </div>
                <div className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                  sale.status === 'paid' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  {sale.status === 'paid' ? 'Pagada' : 'Pendiente'}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>Ups, no pudimos cargar los detalles</p>
              <p className="text-sm mt-2 text-gray-400">Intenta de nuevo en un momento</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SaleDetailModal;

