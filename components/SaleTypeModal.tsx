"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { X, Package, DollarSign } from 'lucide-react';

interface SaleTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SaleTypeModal: React.FC<SaleTypeModalProps> = ({ isOpen, onClose }) => {
  const router = useRouter();

  if (!isOpen) return null;

  const handleSelectType = (type: 'product' | 'free') => {
    if (type === 'product') {
      router.push('/sales/new');
    } else {
      // Para venta libre, redirigir a una ruta específica o usar la misma con parámetros
      router.push('/sales/free');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Nueva venta</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Opción 1: Venta de productos */}
          <button
            onClick={() => handleSelectType('product')}
            className="w-full p-5 rounded-2xl border-2 border-purple-200 hover:border-purple-400 bg-gradient-to-br from-purple-50 to-indigo-50 transition-all duration-200 active:scale-95 flex items-start space-x-4"
          >
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg">
              <Package className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                Venta de productos
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Registra una venta seleccionando los productos de tu inventario.
              </p>
            </div>
          </button>

          {/* Opción 2: Venta libre */}
          <button
            onClick={() => handleSelectType('free')}
            className="w-full p-5 rounded-2xl border-2 border-indigo-200 hover:border-indigo-400 bg-gradient-to-br from-indigo-50 to-blue-50 transition-all duration-200 active:scale-95 flex items-start space-x-4"
          >
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg">
              <DollarSign className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                Venta libre
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Registra un ingreso sin seleccionar productos de tu inventario.
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaleTypeModal;

