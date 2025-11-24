"use client";

import React, { useState } from 'react';
import { X, Save, Package } from 'lucide-react';

interface CategoryCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CategoryCreateModal: React.FC<CategoryCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [color, setColor] = useState('#6b7280');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Resetear formulario cuando se abre/cierra
  React.useEffect(() => {
    if (isOpen) {
      setName('');
      setDisplayName('');
      setColor('#6b7280');
      setError('');
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!name.trim() || !displayName.trim()) {
      setError('El nombre y el nombre para mostrar son requeridos');
      return;
    }

    // Normalizar el nombre (lowercase, sin espacios, solo letras, números y guiones)
    const normalizedName = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    if (!normalizedName) {
      setError('El nombre debe contener al menos una letra o número');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: normalizedName,
          displayName: displayName.trim(),
          color: color,
          icon: 'Package'
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Error al crear la categoría');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al crear la categoría');
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const backgroundColor = hexToRgba(color, 0.1);

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 backdrop-blur-sm transition-opacity"
      onClick={handleBackdropClick}
    >
      {/* Modal */}
      <div 
        className="bg-white rounded-t-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con gradiente púrpura */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <h2 className="text-xl font-bold text-white">Nueva Categoría</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6">
          {/* Vista previa */}
          <div className="flex items-start space-x-4 mb-6 pb-6 border-b border-gray-200">
            <div
              className="w-24 h-24 flex-shrink-0 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: backgroundColor,
                color: color
              }}
            >
              <Package className="w-12 h-12" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-gray-900 mb-1">
                {displayName || 'Nombre de la categoría'}
              </h3>
              <p className="text-sm text-gray-500 mb-2">
                Vista previa
              </p>
              <div className="flex items-center space-x-2">
                <div
                  className="w-8 h-8 rounded-lg border-2 border-gray-300"
                  style={{ backgroundColor: color }}
                  title={`Color: ${color}`}
                />
                <span className="text-sm text-gray-600">{color}</span>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Configuración</h3>
            
            {/* Campo de nombre (ID interno) */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre (ID interno) <span className="text-gray-400 text-xs">(se generará automáticamente)</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                  // Auto-generar displayName si está vacío
                  if (!displayName && e.target.value) {
                    const formatted = e.target.value
                      .replace(/[^a-zA-Z0-9\s-]/g, '')
                      .replace(/\s+/g, ' ')
                      .trim();
                    setDisplayName(formatted);
                  }
                }}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="ej: accesorios-gaming"
              />
              <p className="text-xs text-gray-500 mt-1">
                Solo letras, números y guiones. Se convertirá a minúsculas automáticamente.
              </p>
            </div>

            {/* Campo de nombre para mostrar */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre para mostrar <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  setError('');
                }}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="ej: Accesorios Gaming"
              />
            </div>

            {/* Campo de color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Color <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center justify-center space-x-4 mb-4">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-20 h-20 rounded-xl cursor-pointer border-2 border-gray-300"
                />
                <div className="flex-1">
                  <div
                    className="w-full h-16 rounded-xl flex items-center justify-center text-white font-semibold shadow-md"
                    style={{ backgroundColor: color }}
                  >
                    Vista previa
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    {color}
                  </p>
                </div>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>

          {/* Botón Guardar */}
          <button
            onClick={handleSave}
            disabled={loading || !name.trim() || !displayName.trim()}
            className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center justify-center space-x-2 shadow-md"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Creando...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Crear Categoría</span>
              </>
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default CategoryCreateModal;

