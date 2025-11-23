"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  AlertTriangle, 
  Package, 
  X, 
  ArrowRight, 
  RefreshCw,
  TrendingDown,
  AlertCircle
} from 'lucide-react';
import ProductQuickEditModal from './ProductQuickEditModal';

interface LowStockProduct {
  _id: string;
  name: string;
  stock: number;
  minStock: number;
  category?: string;
  price?: number;
  severity: 'critical' | 'warning' | 'low';
  stockPercentage: number;
  image?: string;
}

interface LowStockData {
  products: LowStockProduct[];
  count: number;
  critical: number;
  warning: number;
}

interface LowStockAlertProps {
  compact?: boolean;
  onUpdate?: () => void;
}

const LowStockAlert: React.FC<LowStockAlertProps> = ({ compact = false, onUpdate }) => {
  const router = useRouter();
  const [lowStockData, setLowStockData] = useState<LowStockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<LowStockProduct | null>(null);
  const [showQuickEdit, setShowQuickEdit] = useState(false);

  const fetchLowStock = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/products/low-stock');
      const data = await response.json();
      if (data.success) {
        setLowStockData(data.data);
      }
    } catch (error) {
      console.error('Error fetching low stock:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLowStock();

    // Escuchar eventos de actualización cuando haya cambios en stock, ventas o gastos
    const handleStockUpdate = () => {
      fetchLowStock();
    };

    // Eventos personalizados que se dispararán cuando haya cambios
    window.addEventListener('stock-updated', handleStockUpdate);
    window.addEventListener('sale-created', handleStockUpdate);
    window.addEventListener('expense-created', handleStockUpdate);
    window.addEventListener('product-updated', handleStockUpdate);

    return () => {
      window.removeEventListener('stock-updated', handleStockUpdate);
      window.removeEventListener('sale-created', handleStockUpdate);
      window.removeEventListener('expense-created', handleStockUpdate);
      window.removeEventListener('product-updated', handleStockUpdate);
    };
  }, []);

  const handleProductClick = async (product: LowStockProduct) => {
    try {
      // Obtener el producto completo del API
      const response = await fetch(`/api/products/${product._id}`);
      const data = await response.json();
      if (data.success && data.data) {
        // Asegurar que el producto tenga todos los campos necesarios
        const fullProduct = {
          ...data.data,
          stock: data.data.stock || 0,
          minStock: data.data.minStock || 0,
          price: data.data.price || 0,
          cost: data.data.cost || 0,
          category: data.data.category || '',
          unit: data.data.unit || 'unidades',
        };
        setSelectedProduct(fullProduct);
        setShowQuickEdit(true);
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
      // Si falla, intentar con los datos que tenemos
      const fallbackProduct = {
        _id: product._id,
        name: product.name,
        stock: product.stock || 0,
        minStock: product.minStock || 0,
        price: product.price || 0,
        cost: 0,
        category: product.category || '',
        unit: 'unidades',
      };
      setSelectedProduct(fallbackProduct as any);
      setShowQuickEdit(true);
    }
  };

  const handleUpdateStock = () => {
    fetchLowStock();
    if (onUpdate) {
      onUpdate();
    }
  };

  if (loading || !lowStockData || lowStockData.count === 0) {
    if (compact) {
      return null;
    }
    return null;
  }

  const criticalProducts = lowStockData.products.filter(p => p.severity === 'critical');
  const warningProducts = lowStockData.products.filter(p => p.severity === 'warning');

  // Versión compacta (para badge en navbar)
  if (compact) {
    return (
      <div className="relative">
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
          {lowStockData.count > 9 ? '9+' : lowStockData.count}
        </span>
      </div>
    );
  }

  // Versión completa (para dashboard)
  return (
    <>
      <div className="mb-6 bg-gradient-to-r from-red-50 via-orange-50 to-yellow-50 border-2 border-red-400 rounded-2xl p-5 shadow-lg animate-pulse-once">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-4 flex-1">
            <div className="bg-red-500 p-3 rounded-xl shadow-md">
              <AlertTriangle className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="text-xl font-bold text-red-900">
                  ¡Alerta de Stock Bajo!
                </h3>
                <button
                  onClick={fetchLowStock}
                  className="p-1 rounded-lg hover:bg-red-100 transition-colors"
                  title="Actualizar"
                >
                  <RefreshCw className="w-4 h-4 text-red-600" />
                </button>
              </div>
              <p className="text-base text-red-800 mb-3">
                {lowStockData.count} producto{lowStockData.count > 1 ? 's' : ''} requiere{lowStockData.count > 1 ? 'n' : ''} atención
              </p>
              <div className="flex flex-wrap gap-3 mb-4">
                {lowStockData.critical > 0 && (
                  <div className="flex items-center space-x-2 px-3 py-1.5 bg-red-500 text-white rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm font-semibold">
                      {lowStockData.critical} Crítico{lowStockData.critical > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
                {lowStockData.warning > 0 && (
                  <div className="flex items-center space-x-2 px-3 py-1.5 bg-orange-500 text-white rounded-lg">
                    <TrendingDown className="w-4 h-4" />
                    <span className="text-sm font-semibold">
                      {lowStockData.warning} Advertencia{lowStockData.warning > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShowModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors shadow-md"
                >
                  <Package className="w-4 h-4" />
                  <span>Ver Productos</span>
                </button>
                <button
                  onClick={() => router.push('/inventory')}
                  className="flex items-center space-x-2 px-4 py-2 bg-white text-red-600 border-2 border-red-600 rounded-xl font-semibold hover:bg-red-50 transition-colors"
                >
                  <span>Ir a Inventario</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mostrar productos críticos destacados */}
        {criticalProducts.length > 0 && (
          <div className="mt-4 pt-4 border-t border-red-200">
            <p className="text-sm font-semibold text-red-900 mb-2">Productos Críticos:</p>
            <div className="flex flex-wrap gap-2">
              {criticalProducts.slice(0, 5).map((product) => (
                <button
                  key={product._id}
                  onClick={() => handleProductClick(product)}
                  className="px-3 py-1.5 bg-red-100 text-red-900 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors border border-red-300"
                >
                  {product.name} ({product.stock})
                </button>
              ))}
              {criticalProducts.length > 5 && (
                <button
                  onClick={() => setShowModal(true)}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  +{criticalProducts.length - 5} más
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal de productos con stock bajo */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Productos con Stock Bajo</h2>
                  <p className="text-sm text-gray-500">{lowStockData.count} producto{lowStockData.count > 1 ? 's' : ''}</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Productos críticos */}
              {criticalProducts.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center space-x-2 mb-3">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <h3 className="text-lg font-bold text-red-900">Críticos ({criticalProducts.length})</h3>
                  </div>
                  <div className="space-y-2">
                    {criticalProducts.map((product) => (
                      <div
                        key={product._id}
                        onClick={() => handleProductClick(product)}
                        className="p-4 bg-red-50 border-2 border-red-300 rounded-xl cursor-pointer hover:bg-red-100 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 mb-1">{product.name}</p>
                            <div className="flex items-center space-x-3 text-sm">
                              <span className="text-red-700 font-bold">Stock: {product.stock}</span>
                              <span className="text-gray-600">Mínimo: {product.minStock}</span>
                              {product.category && (
                                <span className="text-gray-500">• {product.category}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-12 h-12 rounded-lg bg-red-200 flex items-center justify-center">
                              <Package className="w-6 h-6 text-red-700" />
                            </div>
                            <ArrowRight className="w-5 h-5 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Productos en advertencia */}
              {warningProducts.length > 0 && (
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <TrendingDown className="w-5 h-5 text-orange-600" />
                    <h3 className="text-lg font-bold text-orange-900">Advertencia ({warningProducts.length})</h3>
                  </div>
                  <div className="space-y-2">
                    {warningProducts.map((product) => (
                      <div
                        key={product._id}
                        onClick={() => handleProductClick(product)}
                        className="p-4 bg-orange-50 border border-orange-200 rounded-xl cursor-pointer hover:bg-orange-100 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 mb-1">{product.name}</p>
                            <div className="flex items-center space-x-3 text-sm">
                              <span className="text-orange-700 font-bold">Stock: {product.stock}</span>
                              <span className="text-gray-600">Mínimo: {product.minStock}</span>
                              {product.category && (
                                <span className="text-gray-500">• {product.category}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-12 h-12 rounded-lg bg-orange-200 flex items-center justify-center">
                              <Package className="w-6 h-6 text-orange-700" />
                            </div>
                            <ArrowRight className="w-5 h-5 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setShowModal(false);
                  router.push('/inventory');
                }}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Ver en Inventario
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edición rápida */}
      {showQuickEdit && selectedProduct && (
        <ProductQuickEditModal
          product={selectedProduct}
          isOpen={showQuickEdit}
          onClose={() => {
            setShowQuickEdit(false);
            setSelectedProduct(null);
            setShowModal(false); // Cerrar también el modal de productos si está abierto
          }}
          onUpdate={() => {
            handleUpdateStock();
            setShowModal(false); // Cerrar el modal de productos cuando se actualiza el stock
          }}
        />
      )}
    </>
  );
};

export default LowStockAlert;
