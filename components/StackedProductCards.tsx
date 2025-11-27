"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Minus, Clock, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
  stock: number;
}

interface StackedProductCardsProps {
  products: Product[];
  onUpdateQuantity?: (productId: string, change: number) => void;
  onRemove?: (productId: string) => void;
}

const StackedProductCards: React.FC<StackedProductCardsProps> = ({
  products,
  onUpdateQuantity,
  onRemove
}) => {
  const [expanded, setExpanded] = useState(false);
  const [animatingProducts, setAnimatingProducts] = useState<Set<string>>(new Set());
  
  // Máximo de tarjetas visibles cuando está colapsado
  const MAX_VISIBLE_COLLAPSED = 3;
  const visibleProducts = expanded ? products : products.slice(0, MAX_VISIBLE_COLLAPSED);
  const hiddenCount = products.length - MAX_VISIBLE_COLLAPSED;

  // Detectar productos nuevos y animarlos
  useEffect(() => {
    if (products.length > 0) {
      const lastProduct = products[products.length - 1];
      setAnimatingProducts(prev => new Set(prev).add(lastProduct.id));
      
      // Remover la animación después de que termine
      setTimeout(() => {
        setAnimatingProducts(prev => {
          const next = new Set(prev);
          next.delete(lastProduct.id);
          return next;
        });
      }, 500);
    }
  }, [products.length]);

  // Calcular el offset para cada tarjeta (efecto de apilamiento estilo iOS)
  const getCardStyle = (index: number, total: number) => {
    // Invertir el índice para que la más reciente esté arriba
    const reverseIndex = total - 1 - index;
    
    // En modo colapsado, solo mostrar offset en las primeras 3
    const displayIndex = expanded ? reverseIndex : Math.min(reverseIndex, MAX_VISIBLE_COLLAPSED - 1);
    
    // Offset más pronunciado para efecto de apilamiento realista
    const offset = displayIndex * 12; // 12px de offset por tarjeta
    const scale = 1 - (displayIndex * 0.05); // Reducir escala más notablemente
    const zIndex = reverseIndex + 1; // La más reciente (última en array) tiene mayor z-index
    const opacity = expanded 
      ? 1 
      : (reverseIndex < MAX_VISIBLE_COLLAPSED ? Math.max(0.4, 1 - (displayIndex * 0.15)) : 0);
    
    const isAnimating = animatingProducts.has(products[index].id);
    
    return {
      transform: `translateY(-${offset}px) scale(${scale})`,
      zIndex,
      opacity,
      transition: isAnimating 
        ? 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease'
        : 'transform 0.25s ease, opacity 0.25s ease'
    };
  };

  return (
    <div className="relative">
      {/* Contenedor de tarjetas apiladas */}
      <div 
        className="relative" 
        style={{ 
          minHeight: expanded 
            ? `${products.length * 12 + 100}px` 
            : `${Math.min(products.length, MAX_VISIBLE_COLLAPSED) * 12 + 100}px`,
          paddingBottom: expanded ? '1rem' : '0'
        }}
      >
        {/* Renderizar en orden inverso para que la más reciente esté arriba visualmente */}
        {[...visibleProducts].reverse().map((product, reverseDisplayIndex) => {
          const actualIndex = products.findIndex(p => p.id === product.id);
          const total = products.length;
          const reverseIndex = total - 1 - actualIndex;
          const displayIndex = expanded ? reverseIndex : Math.min(reverseIndex, MAX_VISIBLE_COLLAPSED - 1);
          
          return (
            <div
              key={product.id}
              className="absolute left-0 right-0"
              style={{
                ...getCardStyle(actualIndex, products.length),
                top: expanded ? `${actualIndex * 12}px` : '0'
              }}
            >
              <div 
                className="bg-white rounded-2xl p-4 border border-purple-100 mx-4"
                style={{
                  boxShadow: `0 ${4 + displayIndex * 2}px ${8 + displayIndex * 2}px rgba(0, 0, 0, ${0.1 + displayIndex * 0.05})`
                }}
              >
                <div className="flex items-center space-x-4">
                  {/* Imagen del producto */}
                  <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0 border border-purple-100">
                    {product.image && product.image !== '/assets/images/products/default-product.jpg' ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                        <span className="text-xl font-bold text-white">
                          {product.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Información del producto */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-1 truncate text-sm">
                      {product.name}
                    </h3>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200 flex items-center whitespace-nowrap">
                        <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
                        {product.stock} disponibles
                      </span>
                    </div>
                    <p className="text-base font-bold text-purple-600">
                      ${product.price.toFixed(2)}
                    </p>
                  </div>

                  {/* Controles de cantidad */}
                  {onUpdateQuantity && (
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <button
                        onClick={() => onUpdateQuantity(product.id, -1)}
                        disabled={product.quantity <= 1}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                          product.quantity <= 1
                            ? 'bg-gray-100 text-gray-400'
                            : 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-md'
                        }`}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center font-bold text-gray-900 text-base">
                        {product.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(product.id, 1)}
                        className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-md hover:shadow-lg transition-all active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Botón para expandir/colapsar si hay más de MAX_VISIBLE_COLLAPSED productos */}
      {products.length > MAX_VISIBLE_COLLAPSED && (
        <div className="mt-4 px-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full py-2 px-4 bg-purple-50 hover:bg-purple-100 rounded-xl border border-purple-200 flex items-center justify-center space-x-2 transition-colors"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-600">Ver menos</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-600">
                  Ver {hiddenCount} más
                </span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Indicador de productos ocultos cuando está colapsado */}
      {!expanded && products.length > MAX_VISIBLE_COLLAPSED && (
        <div 
          className="absolute left-1/2 transform -translate-x-1/2"
          style={{ 
            bottom: `${(MAX_VISIBLE_COLLAPSED - 1) * 12 + 20}px`,
            zIndex: 1
          }}
        >
          <div className="bg-purple-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-xl flex items-center space-x-1">
            <span>+{hiddenCount}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StackedProductCards;

