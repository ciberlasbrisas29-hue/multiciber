"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Package } from 'lucide-react';
import Toast from '@/components/Toast';
import CategoryEditModal from '@/components/CategoryEditModal';

interface Category {
  name: string;
  displayName: string;
  count: number;
  image: string | null;
}

const CategoryManagementPage = () => {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' as 'success' | 'error' | 'warning', isVisible: false });

  // Cargar categorías
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/products/categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      setToast({
        message: 'Error al cargar las categorías',
        type: 'error',
        isVisible: true
      });
    } finally {
      setLoading(false);
    }
  };

  // Cargar color personalizado desde localStorage
  const getCategoryColor = (categoryName: string) => {
    if (typeof window === 'undefined') return null;
    const savedColors = localStorage.getItem('categoryColors');
    const customColors = savedColors ? JSON.parse(savedColors) : {};
    return customColors[categoryName] || null;
  };

  // Guardar color en localStorage
  const saveCategoryColor = (categoryName: string, color: string) => {
    if (typeof window === 'undefined') return;
    const savedColors = localStorage.getItem('categoryColors');
    const customColors = savedColors ? JSON.parse(savedColors) : {};
    customColors[categoryName] = color;
    localStorage.setItem('categoryColors', JSON.stringify(customColors));
  };

  // Eliminar color de localStorage
  const removeCategoryColor = (categoryName: string) => {
    if (typeof window === 'undefined') return;
    const savedColors = localStorage.getItem('categoryColors');
    const customColors = savedColors ? JSON.parse(savedColors) : {};
    delete customColors[categoryName];
    localStorage.setItem('categoryColors', JSON.stringify(customColors));
  };

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

  // Obtener nombre para mostrar personalizado
  const getDisplayName = (categoryName: string, defaultDisplayName: string) => {
    if (typeof window === 'undefined') return defaultDisplayName;
    const savedNames = localStorage.getItem('categoryDisplayNames');
    const customNames = savedNames ? JSON.parse(savedNames) : {};
    return customNames[categoryName] || defaultDisplayName;
  };

  const handleCategoryClick = (category: Category) => {
    setSelectedCategory(category);
    setShowEditModal(true);
  };

  const handleModalClose = () => {
    setShowEditModal(false);
    setSelectedCategory(null);
  };

  const handleCategoryUpdate = () => {
    fetchCategories();
    setToast({
      message: 'Categoría actualizada exitosamente',
      type: 'success',
      isVisible: true
    });
  };

  const handleDelete = async (categoryName: string, categoryCount: number) => {
    // Verificar en el servidor que no tenga productos
    try {
      const response = await fetch('/api/products/categories/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: categoryName
        })
      });

      const data = await response.json();
      if (!data.success) {
        // Si hay productos asociados, mostrar error
        if (data.productsCount && data.productsCount > 0) {
          setToast({
            message: `No se puede eliminar la categoría "${categoryName}" porque tiene ${data.productsCount} producto${data.productsCount > 1 ? 's' : ''} asociado${data.productsCount > 1 ? 's' : ''}.`,
            type: 'error',
            isVisible: true
          });
          return;
        }
        throw new Error(data.message || 'Error al eliminar la categoría');
      }

      // Si llegamos aquí, la categoría no tiene productos
      // Eliminar nombres y colores personalizados de localStorage
      removeCategoryColor(categoryName);
      if (typeof window !== 'undefined') {
        const savedNames = localStorage.getItem('categoryDisplayNames');
        const customNames = savedNames ? JSON.parse(savedNames) : {};
        delete customNames[categoryName];
        localStorage.setItem('categoryDisplayNames', JSON.stringify(customNames));
      }

      setToast({
        message: 'Preferencias de categoría eliminadas',
        type: 'success',
        isVisible: true
      });

      // Cerrar modal y recargar categorías
      handleModalClose();
      await fetchCategories();
    } catch (error: any) {
      setToast({
        message: error.message || 'Error al eliminar la categoría',
        type: 'error',
        isVisible: true
      });
    }
  };

  const formatCategoryName = (name: string) => {
    return name?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Sin categoría';
  };

  const getDisplayColor = (categoryName: string) => {
    const savedColor = getCategoryColor(categoryName);
    return savedColor || defaultColors[categoryName] || '#6b7280';
  };

  const getBackgroundColor = (categoryName: string) => {
    const color = getDisplayColor(categoryName);
    // Convertir hex a rgba con opacidad
    const hexToRgba = (hex: string, alpha: number) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };
    return hexToRgba(color, 0.1);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 flex items-center space-x-3 rounded-b-2xl mb-6 -mx-6 md:mx-0 md:rounded-2xl">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-white/20 rounded-full transition-colors -ml-2"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <Package className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Gestión de Categorías</h1>
      </div>

      <div className="px-6 md:px-0 space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando categorías...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center bg-white p-12 rounded-2xl shadow-md">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay categorías</h3>
            <p className="text-gray-500">Crea productos para ver las categorías aquí.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {categories.map((category) => {
              const displayColor = getDisplayColor(category.name);
              const backgroundColor = getBackgroundColor(category.name);

              return (
                <div
                  key={category.name}
                  onClick={() => handleCategoryClick(category)}
                  className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 cursor-pointer hover:shadow-lg transition-all active:scale-[0.98]"
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: backgroundColor,
                        color: displayColor
                      }}
                    >
                      <Package className="w-8 h-8" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {getDisplayName(category.name, category.displayName)}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {category.count} {category.count === 1 ? 'producto' : 'productos'}
                      </p>
                    </div>
                    <div
                      className="w-10 h-10 rounded-lg border-2 border-gray-300 flex-shrink-0"
                      style={{ backgroundColor: displayColor }}
                      title={`Color: ${displayColor}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Category Edit Modal */}
      <CategoryEditModal
        isOpen={showEditModal}
        category={selectedCategory}
        onClose={handleModalClose}
        onUpdate={handleCategoryUpdate}
        onDelete={handleDelete}
      />

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
        duration={toast.type === 'success' ? 2000 : 4000}
      />
    </div>
  );
};

export default CategoryManagementPage;

