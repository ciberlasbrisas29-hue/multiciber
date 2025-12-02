"use client";

import React, { useRef, useState, useEffect } from 'react';
import { Plus, Minus, Clock, Trash2 } from 'lucide-react';

interface SwipeableProductCardProps {
  product: {
    id: string;
    name: string;
    quantity: number;
    price: number;
    image?: string;
    stock: number;
  };
  onUpdateQuantity?: (productId: string, change: number) => void;
  onRemove?: (productId: string) => void;
}

const SwipeableProductCard: React.FC<SwipeableProductCardProps> = ({
  product,
  onUpdateQuantity,
  onRemove
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef<number>(0);
  const currentXRef = useRef<number>(0);
  const SWIPE_THRESHOLD = 80; // Píxeles necesarios para activar el swipe

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    currentXRef.current = startXRef.current;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    currentXRef.current = e.touches[0].clientX;
    const diff = currentXRef.current - startXRef.current;
    
    // Solo permitir swipe hacia la izquierda (valores negativos)
    if (diff < 0) {
      setTranslateX(Math.max(diff, -120)); // Máximo -120px
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    
    // Si el swipe supera el umbral, eliminar el producto
    if (translateX <= -SWIPE_THRESHOLD && onRemove) {
      onRemove(product.id);
      setTranslateX(0);
    } else {
      // Si no, volver a la posición original
      setTranslateX(0);
    }
  };

  // Resetear posición si se cancela el drag
  useEffect(() => {
    if (!isDragging && translateX !== 0 && translateX > -SWIPE_THRESHOLD) {
      setTranslateX(0);
    }
  }, [isDragging, translateX]);

  return (
    <div className="relative overflow-hidden">
      {/* Botón de eliminar (fondo rojo) */}
      <div 
        className="absolute right-0 top-0 bottom-0 w-20 bg-red-500 flex items-center justify-center z-10"
        style={{
          transform: `translateX(${translateX < -SWIPE_THRESHOLD ? 0 : 100}%)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out'
        }}
      >
        <Trash2 className="w-6 h-6 text-white" />
      </div>

      {/* Tarjeta del producto */}
      <div
        ref={cardRef}
        className="bg-white rounded-2xl p-4 shadow-md border border-purple-100 relative z-20"
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out',
          touchAction: 'pan-y'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex items-center space-x-4">
          {/* Imagen del producto */}
          <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0 border border-purple-100">
            {product.image && product.image !== '/assets/images/products/default-product.jpg' ? (
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {product.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Información del producto */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 mb-1.5 truncate">
              {product.name}
            </h3>
            <div className="flex items-center space-x-2 mb-1.5">
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200 flex items-center whitespace-nowrap">
                <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
                {product.stock} disponibles
              </span>
            </div>
            <p className="text-lg font-bold text-purple-600">
              ${product.price.toFixed(2)}
            </p>
          </div>

          {/* Controles de cantidad */}
          {onUpdateQuantity && (
            <div className="flex items-center space-x-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateQuantity(product.id, -1);
                }}
                disabled={product.quantity <= 1}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                  product.quantity <= 1
                    ? 'bg-gray-100 text-gray-400'
                    : 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-md'
                }`}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-10 text-center font-bold text-gray-900 text-lg">
                {product.quantity}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateQuantity(product.id, 1);
                }}
                className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-md hover:shadow-lg transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SwipeableProductCard;

