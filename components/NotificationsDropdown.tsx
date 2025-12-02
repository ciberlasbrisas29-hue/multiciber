"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  X,
  AlertTriangle,
  Clock,
  Package,
  Bell,
  Sparkles
} from 'lucide-react';
import { useLowStock } from '@/hooks/useLowStock';
import DefaultProductImage from '@/components/DefaultProductImage';

// Estilos para animaciones
const notificationsStyles = `
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
  
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

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
      <style dangerouslySetInnerHTML={{__html: notificationsStyles}} />
      {/* Backdrop con animación fade-in suave */}
      <div 
        className="fixed inset-0 z-[45] bg-black/40 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Panel deslizante que se detiene justo por encima de la barra de navegación */}
      <div 
        ref={dropdownRef}
        className="fixed top-0 left-0 right-0 z-[48] bg-white flex flex-col overflow-hidden rounded-b-3xl shadow-2xl"
        style={{
          height: 'calc(100vh - 80px)', // Deja espacio para la barra de navegación inferior
          maxHeight: 'calc(100vh - 80px)',
          animation: 'slideDown 0.3s ease-out'
        }}
      >
        {/* Header Mejorado con gradiente */}
        <div className="px-5 py-6 bg-gradient-to-br from-purple-600 via-indigo-600 to-pink-500 flex-shrink-0 relative overflow-hidden">
          {/* Decoración de fondo */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -ml-12 -mb-12"></div>
          </div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-extrabold text-white drop-shadow-lg">
                    Notificaciones
                  </h2>
                  {totalNotifications > 0 && (
                    <p className="text-sm text-white/90 font-medium mt-0.5">
                      Tienes <span className="font-bold text-white">{totalNotifications}</span> {totalNotifications === 1 ? 'notificación' : 'notificaciones'} hoy.
                    </p>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm hover:bg-white/30 border border-white/30 shadow-lg active:scale-95 flex items-center justify-center transition-all duration-200"
              aria-label="Cerrar notificaciones"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Contenido con scroll Mejorado */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-br from-white to-purple-50/30">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="relative">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600 mx-auto mb-4"></div>
                  <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border-2 border-purple-400 opacity-20"></div>
                </div>
                <p className="text-sm text-gray-600 font-semibold">Cargando notificaciones...</p>
              </div>
            </div>
          ) : totalNotifications === 0 ? (
            <div className="text-center py-24 px-6">
              <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                <Package className="w-10 h-10 text-purple-600" />
              </div>
              <p className="text-gray-900 font-extrabold text-lg mb-2">No hay notificaciones</p>
              <p className="text-gray-500 text-sm">Todos los productos están en buen estado</p>
            </div>
          ) : criticalProducts.length === 0 ? (
            <div className="text-center py-24 px-6">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-10 h-10 text-green-600" />
              </div>
              <p className="text-gray-900 font-extrabold text-lg mb-2">No hay productos críticos</p>
              <p className="text-gray-500 text-sm">Todos los productos críticos han sido resueltos</p>
            </div>
          ) : (
            <div className="px-4 py-4 space-y-3">
              {criticalProducts.map((product, index) => (
                <div
                  key={product._id}
                  onClick={() => handleProductClick(product)}
                  className="bg-white rounded-2xl p-4 border-2 border-red-100 hover:border-red-200 hover:shadow-lg transition-all duration-200 cursor-pointer active:scale-[0.98] relative overflow-hidden"
                  style={{
                    animation: `fadeInUp 0.4s ease-out ${index * 0.05}s both`
                  }}
                >
                  {/* Indicador de urgencia */}
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-red-500 to-orange-500"></div>
                  
                  <div className="flex items-start space-x-4">
                    {/* Imagen del producto Mejorada */}
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 shadow-md">
                        {product.image && product.image !== '/assets/images/products/default-product.svg' ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-8 h-8 text-red-600" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Contenido de la notificación Mejorado */}
                    <div className="flex-1 min-w-0">
                      {/* Nombre del producto */}
                      <p className="text-base font-extrabold text-gray-900 mb-2">
                        {product.name}
                      </p>
                      
                      {/* Mensaje de criticidad Mejorado */}
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="px-3 py-1.5 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-200">
                          <span className="text-sm text-gray-900 font-semibold">
                            Stock: <span className="font-extrabold text-red-600">{product.stock}</span>
                          </span>
                        </div>
                        <div className="px-3 py-1.5 bg-gray-100 rounded-lg">
                          <span className="text-sm text-gray-600 font-semibold">
                            Mínimo: <span className="font-bold text-gray-700">{product.minStock}</span>
                        </span>
                        </div>
                      </div>

                      {/* Timestamp Mejorado */}
                      {(product.updatedAt || product.createdAt) && (
                        <div className="flex items-center space-x-1 mt-2">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-xs text-gray-500 font-medium">
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