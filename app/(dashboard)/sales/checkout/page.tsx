"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { salesService } from '@/services/api';
import { 
  ArrowLeft, 
  Plus, 
  Minus,
  Trash2,
  Info,
  ChevronRight
} from 'lucide-react';
import Toast from '@/components/Toast';

interface CartItem {
  _id: string;
  id: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  stock: number;
  image?: string;
}

const CheckoutPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning'; isVisible: boolean }>({
    message: '',
    type: 'success',
    isVisible: false
  });

  useEffect(() => {
    // Obtener productos de la URL
    const itemsParam = searchParams.get('items');
    if (itemsParam) {
      try {
        const items = JSON.parse(decodeURIComponent(itemsParam));
        setCartItems(items);
      } catch (error) {
        console.error('Error al parsear items:', error);
        router.push('/sales/new');
      }
    } else {
      router.push('/sales/new');
    }
  }, [searchParams, router]);

  const updateQuantity = (itemId: string, change: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === itemId || item._id === itemId) {
        const newQuantity = item.quantity + change;
        if (newQuantity < 1) return item;
        if (newQuantity > item.stock) {
          setToast({
            message: `No hay suficiente stock. Disponible: ${item.stock}`,
            type: 'warning',
            isVisible: true
          });
          return item;
        }
        return {
          ...item,
          quantity: newQuantity,
          subtotal: item.price * newQuantity
        };
      }
      return item;
    }));
  };

  const updatePrice = (itemId: string, newPrice: number) => {
    if (newPrice < 0) return;
    setCartItems(prev => prev.map(item => {
      if (item.id === itemId || item._id === itemId) {
        return {
          ...item,
          price: newPrice,
          subtotal: newPrice * item.quantity
        };
      }
      return item;
    }));
  };

  const removeItem = (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId && item._id !== itemId));
  };

  const getTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const handleConfirm = async () => {
    if (cartItems.length === 0) {
      setToast({
        message: 'No hay productos para confirmar',
        type: 'warning',
        isVisible: true
      });
      return;
    }

    setLoading(true);
    try {
      const saleData = {
        items: cartItems.map(item => ({
          productId: item._id,
          quantity: item.quantity,
          price: item.price
        })),
        totalAmount: getTotal(),
        paymentMethod: 'cash'
      };

      const response = await salesService.createSale(saleData);
      
      if (response.success) {
        // Disparar evento personalizado para actualizar notificaciones de stock bajo
        window.dispatchEvent(new CustomEvent('sale-created'));
        window.dispatchEvent(new CustomEvent('stock-updated'));
        
        setToast({
          message: 'Venta registrada exitosamente',
          type: 'success',
          isVisible: true
        });
        
        // Esperar un momento para que se vea la notificación antes de redirigir
        setTimeout(() => {
          router.push('/');
        }, 1500);
      } else {
        setToast({
          message: 'Error al registrar la venta: ' + (response.message || 'Error desconocido'),
          type: 'error',
          isVisible: true
        });
      }
    } catch (error: any) {
      console.error('Error al procesar venta:', error);
      setToast({
        message: 'Error al procesar la venta: ' + (error.response?.data?.message || error.message || 'Error desconocido'),
        type: 'error',
        isVisible: true
      });
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Encabezado */}
      <div className="px-6 py-4 mb-4 -mx-6 rounded-b-2xl shadow-md" style={{ backgroundColor: '#7031f8' }}>
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-lg font-semibold text-white">Confirma precios y cantidades</h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* Banner Informativo */}
      <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 mb-6 flex items-start space-x-3">
        <div className="w-10 h-10 rounded-full bg-lilawhite flex items-center justify-center flex-shrink-0">
          <span className="text-xl">😊</span>
        </div>
        <p className="text-sm text-purple-900 flex-1 leading-relaxed">
          Revisa los precios y cantidades antes de confirmar. Los productos se descontarán automáticamente del inventario.
        </p>
      </div>

      {/* Lista de Productos */}
      <div className="space-y-4 mb-32">
        {cartItems.map((item) => (
          <div
            key={item.id || item._id}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-4 flex-1">
                {/* Imagen del producto - Más grande y visible */}
                <div className="w-24 h-24 rounded-2xl bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0 border border-purple-100 shadow-sm">
                  {item.image && 
                   !item.image.includes('/assets/images/products/default-product') && 
                   !imageErrors.has(item.id || item._id) ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={() => {
                        // Si falla la imagen, agregar a la lista de errores
                        setImageErrors(prev => new Set(prev).add(item.id || item._id));
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                      <span className="text-3xl font-bold text-white">
                        {item.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Información del producto */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {item.name}
                    </h3>
                    <button
                      onClick={() => removeItem(item.id || item._id)}
                      className="ml-2 p-1 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-5 h-5 text-red-500" />
                    </button>
                  </div>

                  {/* Selector de Cantidad */}
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Cantidad *
                    </label>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => updateQuantity(item.id || item._id, -1)}
                        disabled={item.quantity <= 1}
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          item.quantity <= 1
                            ? 'bg-gray-100 text-gray-400'
                            : 'bg-purple-100 text-purple-600'
                        }`}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => {
                          const newQty = parseInt(e.target.value) || 1;
                          if (newQty >= 1 && newQty <= item.stock) {
                            updateQuantity(item.id || item._id, newQty - item.quantity);
                          }
                        }}
                        min="1"
                        max={item.stock}
                        className="w-12 text-center font-semibold text-gray-900 border-0 focus:ring-0 p-0"
                      />
                      <button
                        onClick={() => updateQuantity(item.id || item._id, 1)}
                        disabled={item.quantity >= item.stock}
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          item.quantity >= item.stock
                            ? 'bg-gray-100 text-gray-400'
                            : 'bg-purple-100 text-purple-600'
                        }`}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Precio Unitario */}
                  <div className="mb-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Precio unitario *
                    </label>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-600">$</span>
                      <input
                        type="number"
                        value={item.price.toFixed(2)}
                        onChange={(e) => {
                          const newPrice = parseFloat(e.target.value) || 0;
                          updatePrice(item.id || item._id, newPrice);
                        }}
                        min="0"
                        step="0.01"
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Precio Total */}
                  <p className="text-sm text-gray-600 mt-2">
                    Precio por {item.quantity} unidad{item.quantity !== 1 ? 'es' : ''}: <span className="font-semibold text-gray-900">${item.subtotal.toFixed(2)}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Fijo */}
      <div className="fixed bottom-24 left-0 right-0 px-6 py-4 rounded-t-3xl shadow-2xl z-40" style={{ backgroundColor: '#7031f8' }}>
        <div className="flex items-center justify-between max-w-md mx-auto">
          <button
            onClick={handleConfirm}
            disabled={loading || cartItems.length === 0}
            className="flex items-center space-x-3 text-white font-semibold disabled:opacity-50 transition-opacity active:scale-95"
          >
            <span className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-sm font-bold border border-white/30">
              {cartItems.length}
            </span>
            <span className="text-base">Confirmar</span>
          </button>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-xs text-white/80 font-medium">Total</p>
              <span className="text-2xl font-bold text-white">
                ${getTotal().toFixed(2)}
              </span>
            </div>
            <button
              onClick={handleConfirm}
              disabled={loading || cartItems.length === 0}
              className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center disabled:opacity-50 border border-white/30 transition-all active:scale-95 hover:bg-white/30"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
        duration={toast.type === 'success' ? 2000 : 4000}
      />
    </>
  );
};

export default CheckoutPage;

