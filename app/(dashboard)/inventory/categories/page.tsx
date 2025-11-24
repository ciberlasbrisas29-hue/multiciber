"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Package, Plus, GripVertical } from 'lucide-react';
import Toast from '@/components/Toast';
import CategoryEditModal from '@/components/CategoryEditModal';
import CategoryCreateModal from '@/components/CategoryCreateModal';

interface Category {
  _id?: string;
  name: string;
  displayName: string;
  count: number;
  image: string | null;
  color?: string;
  icon?: string;
}

const CategoryManagementPage = () => {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' as 'success' | 'error' | 'warning', isVisible: false });
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const categoriesContainerRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  // Colores por defecto (fallback)
  const defaultColors: { [key: string]: string } = {
    'accesorios-gaming': '#a855f7',
    'almacenamiento': '#3b82f6',
    'conectividad': '#6366f1',
    'accesorios-trabajo': '#10b981',
    'dispositivos-captura': '#ec4899',
    'mantenimiento': '#eab308',
    'otros': '#6b7280',
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

  const handleDelete = async (categoryId: string, categoryName: string, categoryCount: number) => {
    try {
      const response = await fetch('/api/products/categories/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categoryId: categoryId
        })
      });

      const data = await response.json();
      if (!data.success) {
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

      setToast({
        message: 'Categoría eliminada exitosamente',
        type: 'success',
        isVisible: true
      });

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

  // Obtener color desde la BD (category.color)
  const getDisplayColor = (category: Category) => {
    return category.color || defaultColors[category.name] || '#6b7280';
  };

  const getBackgroundColor = (category: Category) => {
    const color = getDisplayColor(category);
    // Convertir hex a rgba con opacidad
    const hexToRgba = (hex: string, alpha: number) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };
    return hexToRgba(color, 0.1);
  };

  // Auto-scroll durante el drag
  useEffect(() => {
    if (draggedIndex === null) {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
      return;
    }

    const handleDragMove = (e: MouseEvent) => {
      if (!categoriesContainerRef.current) return;

      const container = categoriesContainerRef.current;
      const containerRect = container.getBoundingClientRect();
      const mouseY = e.clientY;
      
      // Zona de auto-scroll (50px desde los bordes)
      const scrollZone = 50;
      const scrollSpeed = 10;

      // Verificar si el mouse está cerca del borde superior
      if (mouseY < containerRect.top + scrollZone) {
        if (!scrollIntervalRef.current) {
          scrollIntervalRef.current = setInterval(() => {
            if (categoriesContainerRef.current) {
              categoriesContainerRef.current.scrollBy({
                top: -scrollSpeed,
                behavior: 'auto'
              });
            }
          }, 16); // ~60fps
        }
      }
      // Verificar si el mouse está cerca del borde inferior
      else if (mouseY > containerRect.bottom - scrollZone) {
        if (!scrollIntervalRef.current) {
          scrollIntervalRef.current = setInterval(() => {
            if (categoriesContainerRef.current) {
              categoriesContainerRef.current.scrollBy({
                top: scrollSpeed,
                behavior: 'auto'
              });
            }
          }, 16); // ~60fps
        }
      }
      // Si no está en ninguna zona de scroll, detener
      else {
        if (scrollIntervalRef.current) {
          clearInterval(scrollIntervalRef.current);
          scrollIntervalRef.current = null;
        }
      }
    };

    document.addEventListener('dragover', handleDragMove);

    return () => {
      document.removeEventListener('dragover', handleDragMove);
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
    };
  }, [draggedIndex]);

  // Funciones para drag and drop
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', '');
    // Hacer el elemento semi-transparente mientras se arrastra
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
    // Detener auto-scroll
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);

    if (draggedIndex === null || draggedIndex === dropIndex) {
      return;
    }

    // Reordenar las categorías localmente
    const newCategories = [...categories];
    const draggedCategory = newCategories[draggedIndex];
    newCategories.splice(draggedIndex, 1);
    newCategories.splice(dropIndex, 0, draggedCategory);

    // Actualizar el estado local inmediatamente para feedback visual
    setCategories(newCategories);

    // Actualizar el orden en la base de datos
    try {
      const categoryOrders = newCategories.map((cat, index) => ({
        categoryId: cat._id,
        order: index
      }));

      const response = await fetch('/api/categories/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ categoryOrders })
      });

      const data = await response.json();

      if (!data.success) {
        // Si falla, revertir al orden anterior
        await fetchCategories();
        setToast({
          message: 'Error al guardar el nuevo orden',
          type: 'error',
          isVisible: true
        });
      } else {
        // Recargar desde el servidor para confirmar que se guardó correctamente
        await fetchCategories();
        setToast({
          message: 'Orden de categorías actualizado',
          type: 'success',
          isVisible: true
        });
      }
    } catch (error) {
      console.error('Error al reordenar categorías:', error);
      // Revertir al orden anterior
      await fetchCategories();
      setToast({
        message: 'Error al guardar el nuevo orden',
        type: 'error',
        isVisible: true
      });
    }

    setDraggedIndex(null);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 flex items-center justify-between rounded-b-2xl mb-6 -mx-6 md:mx-0 md:rounded-2xl">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white/20 rounded-full transition-colors -ml-2"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <Package className="w-6 h-6" />
          <h1 className="text-2xl font-bold">Gestión de Categorías</h1>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="p-2.5 bg-white/20 hover:bg-white/30 rounded-full transition-colors flex items-center justify-center"
          title="Crear nueva categoría"
        >
          <Plus className="w-6 h-6" />
        </button>
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
                 <div 
                   ref={categoriesContainerRef}
                   className="space-y-4 overflow-y-auto"
                   style={{ 
                     maxHeight: 'calc(100vh - 280px)',
                     scrollBehavior: 'auto'
                   }}
                 >
                   {categories.map((category, index) => {
                     const displayColor = getDisplayColor(category);
                     const backgroundColor = getBackgroundColor(category);
                     const isDragging = draggedIndex === index;
                     const isDragOver = dragOverIndex === index;

                     return (
                       <div
                         key={category._id || category.name}
                         draggable
                         onDragStart={(e) => handleDragStart(e, index)}
                         onDragEnd={handleDragEnd}
                         onDragOver={(e) => handleDragOver(e, index)}
                         onDragLeave={handleDragLeave}
                         onDrop={(e) => handleDrop(e, index)}
                         onClick={() => handleCategoryClick(category)}
                         className={`bg-white rounded-2xl p-6 shadow-md border border-gray-100 cursor-pointer hover:shadow-lg transition-all active:scale-[0.98] ${
                           isDragging ? 'opacity-50' : ''
                         } ${
                           isDragOver ? 'border-purple-400 border-2 shadow-lg' : ''
                         }`}
                         style={{
                           cursor: 'grab',
                           ...(isDragging && { cursor: 'grabbing' })
                         }}
                       >
                         <div className="flex items-center space-x-4">
                           {/* Handle para arrastrar */}
                           <div
                             className="flex-shrink-0 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 transition-colors"
                             onMouseDown={(e) => e.stopPropagation()}
                             onClick={(e) => e.stopPropagation()}
                           >
                             <GripVertical className="w-6 h-6" />
                           </div>
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
                               {category.displayName}
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
               onDelete={selectedCategory?._id ? (categoryName: string, categoryCount: number) => {
                 handleDelete(selectedCategory._id!, categoryName, categoryCount);
               } : undefined}
             />

             <CategoryCreateModal
               isOpen={showCreateModal}
               onClose={() => setShowCreateModal(false)}
               onSuccess={() => {
                 fetchCategories();
                 setToast({
                   message: 'Categoría creada exitosamente',
                   type: 'success',
                   isVisible: true
                 });
               }}
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

