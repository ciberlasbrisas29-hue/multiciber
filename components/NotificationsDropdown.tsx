"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  X,
  AlertTriangle,
  Clock,
  Package
} from 'lucide-react';
import { useLowStock } from '@/hooks/useLowStock';
import DefaultProductImage from '@/components/DefaultProductImage';

interface NotificationsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onStockUpdated?: () => void;
}

const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({ 
  isOpen, 
  onClose,
  onStockUpdated 
}) => {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { lowStockData, loading } = useLowStock(isOpen);

  // Prevenir scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleProductClick = (product: any) => {
    // Cerrar el dropdown primero
    onClose();
    
    // Pequeño delay para permitir que la animación de cierre se complete
    setTimeout(() => {
      // Redirigir al inventario con la categoría y el ID del producto
      const category = product.category || 'otros';
      router.push(`/inventory?category=${encodeURIComponent(category)}&productId=${product._id}`);
    }, 200);
  };

  // Función para formatear la fecha y hora - estilo Instagram (relativo, compacto)
  const formatDateTime = (dateString: string | Date) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    // Si es hoy, mostrar tiempo relativo corto
    if (diffDays === 0) {
      if (diffMins < 1) return 'Ahora';
      if (diffMins < 60) return `${diffMins}m`;
      if (diffHours < 24) return `${diffHours}h`;
    }

    // Si es ayer
    if (diffDays === 1) {
      return 'Ayer';
    }

    // Si es esta semana
    if (diffDays < 7) {
      return `${diffDays}d`;
    }

    // Más de una semana - mostrar fecha corta
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks}${weeks === 1 ? ' semana' : ' semanas'}`;
    }

    // Más de un mes
    const months = Math.floor(diffDays / 30);
    if (months < 12) {
      return `${months}${months === 1 ? ' mes' : ' meses'}`;
    }

    // Más de un año
    return date.toLocaleDateString('es-SV', { day: 'numeric', month: 'short' });
  };

  if (!isOpen) return null;

  // Mostrar solo productos críticos (los más urgentes)
  const criticalProducts = lowStockData?.products.filter(p => p.severity === 'critical') || [];
  const totalNotifications = (lowStockData?.count || 0);

  return (
    <>
      {/* Backdrop con animación fade-in suave */}
      <div 
        className="fixed inset-0 z-[45] bg-black/30 animate-fade-in" 
        onClick={onClose}
      />
      
      {/* Panel deslizante que se detiene justo por encima de la barra de navegación */}
      <div 
        ref={dropdownRef}
        className="fixed top-0 left-0 right-0 z-[48] bg-white flex flex-col overflow-hidden animate-slide-down-smooth rounded-b-3xl shadow-2xl"
        style={{
          height: 'calc(100vh - 80px)', // Deja espacio para la barra de navegación inferior
          maxHeight: 'calc(100vh - 80px)'
        }}
      >
        {/* Header con gradiente suave y bordes redondeados */}
        <div className="px-5 py-5 bg-gradient-to-r from-purple-50 via-indigo-50 to-pink-50 rounded-t-3xl flex-shrink-0 border-b border-purple-100/50 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-md">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    Notificaciones
                  </h2>
                  {totalNotifications > 0 && (
                    <p className="text-sm text-gray-600 font-medium mt-0.5">
                      Tienes <span className="font-bold text-purple-600">{totalNotifications}</span> {totalNotifications === 1 ? 'notificación' : 'notificaciones'} hoy.
                    </p>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white border border-purple-200/50 shadow-sm active:scale-95 flex items-center justify-center transition-all duration-200 hover:shadow-md"
              aria-label="Cerrar notificaciones"
            >
              <X className="w-5 h-5 text-purple-600" />
            </button>
          </div>
        </div>

        {/* Contenido con scroll - estilo Instagram */}
        <div className="flex-1 overflow-y-auto bg-white">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-3"></div>
                <p className="text-sm text-gray-500">Cargando notificaciones...</p>
              </div>
            </div>
          ) : totalNotifications === 0 ? (
            <div className="text-center py-24 px-6">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-900 font-semibold text-base">No hay notificaciones</p>
              <p className="text-gray-500 text-sm mt-1">Todos los productos están en buen estado</p>
            </div>
          ) : criticalProducts.length === 0 ? (
            <div className="text-center py-24 px-6">
              <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-900 font-semibold text-base">No hay productos críticos</p>
              <p className="text-gray-500 text-sm mt-1">Todos los productos críticos han sido resueltos</p>
            </div>
          ) : (
            <div className="px-0">
              {criticalProducts.map((product, index) => (
                <div
                  key={product._id}
                  onClick={() => handleProductClick(product)}
                  className="px-4 py-4 border-b border-gray-100 cursor-pointer active:bg-gray-50 transition-colors duration-150 animate-fade-in-up"
                  style={{
                    animationDelay: `${index * 30}ms`,
                    opacity: 0
                  }}
                >
                  <div className="flex items-start space-x-3">
                    {/* Círculo con imagen del producto o ícono */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
                        {product.image && product.image !== '/assets/images/products/default-product.svg' ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : null}
                        {(!product.image || product.image === '/assets/images/products/default-product.svg') && (
                          <div className="w-full h-full flex items-center justify-center bg-red-50">
                            <Package className="w-6 h-6 text-red-600" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Contenido de la notificación */}
                    <div className="flex-1 min-w-0">
                      {/* Nombre del producto - arriba */}
                      <p className="text-sm font-semibold text-black leading-tight mb-2">
                        {product.name}
                      </p>
                      
                      {/* Mensaje de criticidad - abajo con mejor espaciado */}
                      <div className="flex items-center space-x-2 mb-1.5">
                        <span className="text-sm text-gray-900 leading-relaxed">
                          Stock: <span className="font-bold text-red-600">{product.stock}</span>, Mínimo: <span className="text-gray-600">{product.minStock}</span>
                        </span>
                      </div>

                      {/* Timestamp - estilo Instagram */}
                      {(product.updatedAt || product.createdAt) && (
                        <div className="mt-1">
                          <span className="text-xs text-gray-500">
                            {formatDateTime(product.updatedAt || product.createdAt)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationsDropdown;