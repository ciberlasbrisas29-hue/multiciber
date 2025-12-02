"use client";

import React, { useEffect } from 'react';
import { X, Clock, DollarSign, User, CreditCard, FileText, Package, Calendar } from 'lucide-react';
import Image from 'next/image';

interface SaleItem {
  product?: {
    _id: string;
    name: string;
    image?: string;
  };
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
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
            <div className="space-y-6">
              {/* Tipo de Venta */}
              <div className="flex items-center space-x-2">
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  sale.type === 'free' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-green-100 text-green-700'
                }`}>
                  {sale.type === 'free' ? 'Venta Libre' : 'Venta de Productos'}
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  sale.status === 'paid' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  {sale.status === 'paid' ? 'Pagada' : 'Pendiente'}
                </div>
              </div>

              {/* Items de Productos */}
              {sale.type === 'product' && sale.items && sale.items.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <Package className="w-5 h-5 mr-2 text-purple-600" />
                    Productos
                  </h3>
                  <div className="space-y-3">
                    {sale.items.map((item, index) => (
                      <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <div className="flex items-start space-x-4">
                          {/* Imagen del producto */}
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                            {item.product?.image ? (
                              <Image
                                src={item.product.image}
                                alt={item.productName}
                                width={64}
                                height={64}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/assets/images/products/default-product.jpg';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-indigo-100">
                                <Package className="w-8 h-8 text-purple-400" />
                              </div>
                            )}
                          </div>
                          {/* Información del producto */}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800 truncate">
                              {item.productName}
                            </p>
                            <div className="mt-1 space-y-1">
                              <p className="text-sm text-gray-600">
                                Cantidad: <span className="font-medium">{item.quantity}</span>
                              </p>
                              <p className="text-sm text-gray-600">
                                Precio unitario: <span className="font-medium">${item.unitPrice.toFixed(2)}</span>
                              </p>
                              <p className="text-sm font-semibold text-purple-600">
                                Total: ${item.totalPrice.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Concepto (Venta Libre) */}
              {sale.type === 'free' && sale.concept && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-purple-600" />
                    Concepto
                  </h3>
                  <p className="text-gray-700 bg-gray-50 rounded-xl p-4 border border-gray-200">
                    {sale.concept}
                  </p>
                </div>
              )}

              {/* Cliente */}
              {sale.client && (sale.client.name || sale.client.phone || sale.client.email) && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                    <User className="w-5 h-5 mr-2 text-purple-600" />
                    Cliente
                  </h3>
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-2">
                    {sale.client.name && (
                      <p className="text-gray-700">
                        <span className="font-medium">Nombre:</span> {sale.client.name}
                      </p>
                    )}
                    {sale.client.phone && (
                      <p className="text-gray-700">
                        <span className="font-medium">Teléfono:</span> {sale.client.phone}
                      </p>
                    )}
                    {sale.client.email && (
                      <p className="text-gray-700">
                        <span className="font-medium">Email:</span> {sale.client.email}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Información Financiera */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2 text-purple-600" />
                  Información Financiera
                </h3>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-semibold">${sale.subtotal.toFixed(2)}</span>
                  </div>
                  {sale.discount && sale.discount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Descuento:</span>
                      <span className="font-semibold">
                        {sale.discountType === 'percentage' 
                          ? `${sale.discount}%` 
                          : `-$${sale.discount.toFixed(2)}`}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold text-purple-600 pt-2 border-t border-gray-300">
                    <span>Total:</span>
                    <span>${sale.total.toFixed(2)}</span>
                  </div>
                  {sale.status === 'debt' && (
                    <>
                      {sale.paidAmount !== undefined && sale.paidAmount > 0 && (
                        <div className="flex justify-between text-green-600 pt-2">
                          <span>Pagado:</span>
                          <span className="font-semibold">${sale.paidAmount.toFixed(2)}</span>
                        </div>
                      )}
                      {sale.debtAmount !== undefined && sale.debtAmount > 0 && (
                        <div className="flex justify-between text-orange-600 pt-2">
                          <span>Pendiente:</span>
                          <span className="font-semibold">${sale.debtAmount.toFixed(2)}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Método de Pago */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                  <CreditCard className="w-5 h-5 mr-2 text-purple-600" />
                  Método de Pago
                </h3>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <p className="text-gray-700 font-medium">
                    {getPaymentMethodLabel(sale.paymentMethod)}
                  </p>
                </div>
              </div>

              {/* Notas */}
              {sale.notes && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-purple-600" />
                    Notas
                  </h3>
                  <p className="text-gray-700 bg-gray-50 rounded-xl p-4 border border-gray-200">
                    {sale.notes}
                  </p>
                </div>
              )}

              {/* Fechas */}
              <div className="pb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-purple-600" />
                  Fechas
                </h3>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-2">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Creada:</p>
                      <p className="text-sm font-medium text-gray-700">
                        {formatDateTime(sale.createdAt)}
                      </p>
                    </div>
                  </div>
                  {sale.updatedAt !== sale.createdAt && (
                    <div className="flex items-center space-x-2 pt-2 border-t border-gray-300">
                      <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Actualizada:</p>
                        <p className="text-sm font-medium text-gray-700">
                          {formatDateTime(sale.updatedAt)}
                        </p>
                      </div>
                    </div>
                  )}
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

