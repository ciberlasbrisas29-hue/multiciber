"use client";

import React, { useState, useEffect } from 'react';
import { X, Save, Package, Trash2 } from 'lucide-react';

interface Category {
  name: string;
  displayName: string;
  count: number;
  image: string | null;
}

interface CategoryEditModalProps {
  isOpen: boolean;
  category: Category | null;
  onClose: () => void;
  onUpdate: () => void;
  onDelete?: (categoryName: string, categoryCount: number) => void;
}

const CategoryEditModal: React.FC<CategoryEditModalProps> = ({
  isOpen,
  category,
  onClose,
  onUpdate,
  onDelete
}) => {
  const [editedName, setEditedName] = useState('');
  const [editedColor, setEditedColor] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Colores por defecto
  const defaultColors: { [key: string]: string } = {
    'accesorios-gaming': '#a855f7',
    'almacenamiento': '#3b82f6',
    'conectividad': '#6366f1',
    'accesorios-trabajo': '#10b981',
    'dispositivos-captura': '#ec4899',
    'mantenimiento': '#eab308',
    'otros': '#6b7280',
  };

  // Cargar color personalizado desde localStorage
  const getCategoryColor = (categoryName: string) => {
    if (typeof window === 'undefined' || !categoryName) return null;
    const savedColors = localStorage.getItem('categoryColors');
    const customColors = savedColors ? JSON.parse(savedColors) : {};
    return customColors[categoryName] || null;
  };

  // Obtener nombre para mostrar personalizado
  const getCategoryDisplayName = (categoryName: string, defaultDisplayName: string) => {
    if (typeof window === 'undefined' || !categoryName) return defaultDisplayName;
    const savedNames = localStorage.getItem('categoryDisplayNames');
    const customNames = savedNames ? JSON.parse(savedNames) : {};
    return customNames[categoryName] || defaultDisplayName;
  };

  // Guardar color en localStorage
  const saveCategoryColor = (categoryName: string, color: string) => {
    if (typeof window === 'undefined') return;
    const savedColors = localStorage.getItem('categoryColors');
    const customColors = savedColors ? JSON.parse(savedColors) : {};
    customColors[categoryName] = color;
    localStorage.setItem('categoryColors', JSON.stringify(customColors));
  };

  // Obtener color de visualización
  const getDisplayColor = (categoryName: string) => {
    const savedColor = getCategoryColor(categoryName);
    return savedColor || defaultColors[categoryName] || '#6b7280';
  };

  const getBackgroundColor = (categoryName: string) => {
    const color = getDisplayColor(categoryName);
    const hexToRgba = (hex: string, alpha: number) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };
    return hexToRgba(color, 0.1);
  };

  // Inicializar valores cuando se abre el modal
  useEffect(() => {
    if (isOpen && category) {
      const displayName = getCategoryDisplayName(category.name, category.displayName);
      setEditedName(displayName);
      const savedColor = getCategoryColor(category.name);
      setEditedColor(savedColor || defaultColors[category.name] || '#6b7280');
      setError('');
    }
  }, [isOpen, category]);

  const handleSave = async () => {
    if (!category) return;

    if (!editedName.trim()) {
      setError('El nombre de la categoría es requerido');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Guardar nombre para mostrar personalizado
      const savedNames = typeof window !== 'undefined' ? localStorage.getItem('categoryDisplayNames') : null;
      const customNames = savedNames ? JSON.parse(savedNames) : {};
      customNames[category.name] = editedName.trim();
      if (typeof window !== 'undefined') {
        localStorage.setItem('categoryDisplayNames', JSON.stringify(customNames));
      }

      // Guardar color personalizado
      if (editedColor) {
        saveCategoryColor(category.name, editedColor);
      }

      onUpdate();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al actualizar la categoría');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!category || !onDelete) return;
    onDelete(category.name, category.count);
  };

  if (!isOpen || !category) return null;

  const displayColor = getDisplayColor(category.name);
  const backgroundColor = getBackgroundColor(category.name);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

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
                  <h2 className="text-xl font-bold text-white">Editar Categoría</h2>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>

                {/* Contenido */}
                <div className="p-6">
                  {/* Información de la Categoría */}
                  <div className="flex items-start space-x-4 mb-6 pb-6 border-b border-gray-200">
                    {/* Icono de categoría con color */}
                    <div
                      className="w-24 h-24 flex-shrink-0 rounded-xl flex items-center justify-center"
                      style={{
                        backgroundColor: backgroundColor,
                        color: displayColor
                      }}
                    >
                      <Package className="w-12 h-12" />
                    </div>

                    {/* Información */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-gray-900 mb-1 truncate">
                        {getCategoryDisplayName(category.name, category.displayName)}
                      </h3>
                      <p className="text-sm text-gray-500 mb-2">
                        {category.count} {category.count === 1 ? 'producto' : 'productos'}
                      </p>
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-8 h-8 rounded-lg border-2 border-gray-300"
                          style={{ backgroundColor: displayColor }}
                          title={`Color: ${displayColor}`}
                        />
                        <span className="text-sm text-gray-600">{displayColor}</span>
                      </div>
                    </div>
                  </div>

                  {/* Módulo de Edición */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Configuración</h3>
                    
                    {/* Campo de nombre */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre de la categoría
                      </label>
                      <input
                        type="text"
                        value={editedName}
                        onChange={(e) => {
                          setEditedName(e.target.value);
                          setError('');
                        }}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Nombre de la categoría"
                      />
                    </div>

                    {/* Campo de color */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-4">
                        Color
                      </label>
                      <div className="flex items-center justify-center space-x-4 mb-4">
                        <input
                          type="color"
                          value={editedColor}
                          onChange={(e) => setEditedColor(e.target.value)}
                          className="w-20 h-20 rounded-xl cursor-pointer border-2 border-gray-300"
                        />
                        <div className="flex-1">
                          <div
                            className="w-full h-16 rounded-xl flex items-center justify-center text-white font-semibold shadow-md"
                            style={{ backgroundColor: editedColor }}
                          >
                            Vista previa
                          </div>
                          <p className="text-xs text-gray-500 mt-2 text-center">
                            {editedColor}
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

          {/* Botones de acción */}
          <div className="space-y-3">
            {/* Botón Eliminar */}
            {onDelete && (
              <button
                onClick={handleDelete}
                disabled={category.count > 0 || loading}
                className={`w-full py-3 px-4 rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2 ${
                  category.count > 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-red-50 text-red-600 hover:bg-red-100'
                }`}
                title={
                  category.count > 0
                    ? `No se puede eliminar: tiene ${category.count} producto${category.count > 1 ? 's' : ''} asociado${category.count > 1 ? 's' : ''}`
                    : 'Eliminar categoría'
                }
              >
                <Trash2 className="w-5 h-5" />
                <span>Eliminar Categoría</span>
              </button>
            )}

            {/* Botón Guardar Cambios */}
            <button
              onClick={handleSave}
              disabled={loading || !editedName.trim()}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center justify-center space-x-2 shadow-md"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Guardar Cambios</span>
                </>
              )}
            </button>
          </div>
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

export default CategoryEditModal;

